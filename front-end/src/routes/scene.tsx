/**
 * Scene · 第五幕互动游戏主页（Prism 接入版）
 *
 * 取代旧的 game-api.ts 链路，改用：
 *  - usePlay() 主状态机
 *  - PRISM 折射出动态选项
 *  - 方案 B 翻译层
 *  - 全屏 QTE
 *  - 结局展示
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Send, Sparkles } from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";
import { PrismHUD } from "@/components/PrismHUD";
import { EndingScreen } from "@/components/EndingScreen";
import { BGMPlayer } from "@/components/BGMPlayer";
import { usePlay } from "@/hooks/use-play";
import { useRoomChat } from "@/hooks/use-room-chat";
import { CHARACTERS, getCharacter } from "@/lib/characters";
import { translateIntent } from "@/lib/chat";
import sceneBg from "@/assets/scene-cijitang.png";
import type { ViewKey } from "@/lib/story";

type SceneSearch = { role?: string; room?: string; userId?: string };

function roleToView(role?: string): ViewKey {
  return role === "moshen" ? "fyx" : "hanyan";
}

export const Route = createFileRoute("/scene")({
  validateSearch: (s: Record<string, unknown>): SceneSearch => ({
    role: typeof s.role === "string" ? s.role : undefined,
    room: typeof s.room === "string" ? s.room : undefined,
    userId: typeof s.userId === "string" ? s.userId : undefined,
  }),
  component: ScenePage,
  head: () => ({
    meta: [
      { title: "第五幕 · 离心时刻" },
      { name: "description", content: "Prism 驱动的古风互动剧情。" },
    ],
  }),
});

function ScenePage() {
  return (
    <PhoneMockup>
      <Scene />
    </PhoneMockup>
  );
}

function Scene() {
  const navigate = useNavigate();
  const { role, room: roomCode, userId: paramUserId } = Route.useSearch();
  const initialView = roleToView(role);

  // 多人模式：有 room 和 userId 参数时启用房间聊天
  const stableUserId = useRef(
    typeof window !== "undefined"
      ? (paramUserId || window.localStorage.getItem("ruxi.matchmaking.userId") || "")
      : "",
  ).current;

  const isMultiplayer = Boolean(roomCode && stableUserId);
  const roomChat = useRoomChat(isMultiplayer ? roomCode! : null, stableUserId);

  const {
    state,
    view,
    startGame,
    chooseOption,
    submitFreeInput,
    skipScene,
    goNext,
    restart,
    switchView,
    ending,
  } = usePlay(initialView);

  const scrollRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const [freeInput, setFreeInput] = useState("");
  const [mpBusy, setMpBusy] = useState(false);
  const latestMessageId = state.messages.at(-1)?.id;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const scroller = scrollRef.current;
      const latest = latestMessageRef.current;
      if (!scroller || !latest) return;

      const scrollerRect = scroller.getBoundingClientRect();
      const latestRect = latest.getBoundingClientRect();
      const latestTop = latestRect.top - scrollerRect.top + scroller.scrollTop;
      const targetTop = latestTop - scroller.clientHeight * 0.36;

      scroller.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [state.messages, state.options]);

  useEffect(() => {
    if (state.phase === "intro") {
      startGame();
    }
  }, [state.phase, startGame]);

  // 多人模式：把对方消息合并到消息列表渲染
  // kind "player" 表示真人消息（不显示 AI 标签），"me" 表示自己发的
  const mpMessages = isMultiplayer
    ? roomChat.messages.map((m) => {
        const char = getCharacter(m.roleId) ?? CHARACTERS[0];
        return {
          id: m.id,
          kind: m.isMine ? "me" : "player",
          name: char.name,
          text: m.text,
          roleName: char.name,
        } as const;
      })
    : [];

  const allMessages = isMultiplayer && mpMessages.length > 0
    ? [...state.messages, ...mpMessages]
    : state.messages;

  const latestMId = allMessages.at(-1)?.id;

  // 多人模式：轮次 = 双方各说一次算一轮（2 条消息 = 1 轮）
  const mpRound = isMultiplayer ? Math.floor(roomChat.messages.length / 2) : 0;
  const mpShowContinue = isMultiplayer && mpRound >= state.maxRoundsPerScene;

  // 多人模式：检测对方发送的「推进场景」信号
  useEffect(() => {
    if (!isMultiplayer || roomChat.messages.length === 0) return;
    const lastMsg = roomChat.messages[roomChat.messages.length - 1];
    if (lastMsg.text === "__NEXT_SCENE__" && !lastMsg.isMine) {
      goNext();
    }
  }, [roomChat.messages, isMultiplayer, goNext]);

  // 多人模式：点击选项 → 翻译 → 发到房间
  const handleMpChoose = async (opt: typeof state.options extends (infer T)[] | null ? T : never) => {
    if (!opt || mpBusy) return;
    const scene = state.scene;
    if (!scene) return;

    setMpBusy(true);

    try {
      let spokenLine = opt.text;
      if (opt._prism?.hook) {
        spokenLine = await translateIntent(
          {
            sceneId: scene.id,
            sceneTag: scene.sceneTag,
            sceneName: scene.sceneName,
            aiCharacter: scene.aiCharacter,
          },
          opt.text,
          opt._prism,
        );
      }
      await roomChat.sendMessage(spokenLine);
      // 选项保持可见，让双方可以持续对话
    } catch (err: any) {
      console.error("[MP] send failed", err);
    } finally {
      setMpBusy(false);
    }
  };

  // 多人模式：进入下一幕（同时通知对方）
  const handleMpGoNext = async () => {
    if (mpBusy) return;
    // 先发信号让对方也推进
    await roomChat.sendMessage("__NEXT_SCENE__");
    goNext();
  };

  const handleMpFreeInput = async () => {
    if (!freeInput.trim() || mpBusy) return;
    setMpBusy(true);
    try {
      await roomChat.sendMessage(freeInput);
      setFreeInput("");
    } catch (err: any) {
      console.error("[MP] send failed", err);
    } finally {
      setMpBusy(false);
    }
  };

  if (state.phase === "ending" && ending) {
    return (
      <EndingScreen
        ending={ending}
        numerics={state.numerics}
        decision={state.endingDecision}
        hookCount={state.hookLog.length}
        onRestart={() => {
          restart();
          setFreeInput("");
        }}
        onEnterMinigame={() => navigate({ to: "/minigame" })}
      />
    );
  }

  const scene = state.scene;

  return (
    <div className="relative h-full overflow-hidden bg-neutral-900 text-amber-50">
      <img src={sceneBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.04) 0%, transparent 50%)",
        }}
      />
      <BGMPlayer />

      <div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-3">
        <button
          onClick={() => navigate({ to: "/" })}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur active:scale-95"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="pointer-events-none absolute left-1/2 top-12 -translate-x-1/2 text-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
          <div className="text-[10px] tracking-[0.3em] text-white/75">
            {scene?.sceneTag || "重生之贵女难求"}
          </div>
          <div className="font-brush text-[16px] tracking-[0.2em]">
            {scene?.sceneName || "第五幕 · 离心时刻"}
          </div>
        </div>
        {/* 视角切换 */}
        {isMultiplayer ? (
          <div className="flex h-9 items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 text-[10px] tracking-wider text-emerald-100 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
            联机中
          </div>
        ) : (
          <button
            onClick={() => switchView(view === "hanyan" ? "fyx" : "hanyan")}
            className="flex h-9 items-center gap-1 rounded-full bg-black/40 px-3 text-[10px] tracking-wider text-amber-100 backdrop-blur active:scale-95"
            title="切换视角（会重启）"
          >
            {view === "hanyan" ? "👁 寒雁" : "❄ 云夕"}
          </button>
        )}
      </div>

      <div className="relative z-10 mx-4 mb-2 h-[3px] overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-amber-300/80 to-rose-300/80 transition-all duration-700"
          style={{ width: `${scene?.progress ?? 5}%` }}
        />
      </div>

      {state.hud && (
        <PrismHUD info={state.hud} numerics={state.numerics} lastChange={state.lastChange} />
      )}

      <div
        ref={scrollRef}
        className="absolute inset-x-0 bottom-[260px] top-[108px] z-10 overflow-y-auto px-4 pb-4"
      >
        {allMessages.map((m) => {
          const isLatestMessage = m.id === latestMId;
          if (m.kind === "narration") {
            return (
              <div
                key={m.id}
                ref={isLatestMessage ? latestMessageRef : undefined}
                className="my-3 rounded-lg border border-amber-200/15 bg-black/35 px-4 py-3 text-[13px] leading-[1.85] tracking-wide text-amber-50/80 backdrop-blur"
              >
                {m.text}
              </div>
            );
          }
          if (m.kind === "ai") {
            return (
              <div
                key={m.id}
                ref={isLatestMessage ? latestMessageRef : undefined}
                className="my-3 max-w-[85%]"
              >
                <div className="mb-1 text-[11px] tracking-wider text-amber-200/80">
                  {m.name}
                  <span className="ml-2 inline-flex items-center rounded-full border border-sky-300/40 bg-sky-500/15 px-1.5 py-[1px] text-[8px] leading-none tracking-wider text-sky-100">
                    AI
                  </span>
                </div>
                <div className="rounded-2xl rounded-tl-md bg-amber-50/95 px-4 py-2.5 text-[14px] leading-relaxed text-stone-800 shadow-md">
                  {m.text || (m.streaming ? " " : "")}
                  {m.streaming && <StreamCursor />}
                </div>
              </div>
            );
          }
          if (m.kind === "player") {
            return (
              <div
                key={m.id}
                ref={isLatestMessage ? latestMessageRef : undefined}
                className="my-3 max-w-[85%]"
              >
                <div className="mb-1 text-[11px] tracking-wider text-amber-200/80">
                  {m.name}
                  <span className="ml-2 inline-flex items-center rounded-full border border-emerald-300/40 bg-emerald-500/15 px-1.5 py-[1px] text-[8px] leading-none tracking-wider text-emerald-100">
                    真人
                  </span>
                </div>
                <div className="rounded-2xl rounded-tl-md bg-sky-50/95 px-4 py-2.5 text-[14px] leading-relaxed text-stone-800 shadow-md">
                  {m.text}
                </div>
              </div>
            );
          }
          if (m.kind === "me") {
            const myChar = isMultiplayer ? (getCharacter(role ?? "hanyan") ?? CHARACTERS[0]) : null;
            return (
              <div
                key={m.id}
                ref={isLatestMessage ? latestMessageRef : undefined}
                className="my-3 flex justify-end"
              >
                <div className="max-w-[85%]">
                  <div className="mb-1 text-right text-[11px] tracking-wider text-amber-100/80">
                    {myChar ? myChar.name : "庄寒雁"}
                  </div>
                  <div className="rounded-2xl rounded-tr-md bg-rose-900/70 px-4 py-2.5 text-[14px] leading-relaxed text-amber-50 shadow-md backdrop-blur">
                    {m.text}
                  </div>
                </div>
              </div>
            );
          }
          if (m.kind === "loading") {
            return (
              <div
                key={m.id}
                ref={isLatestMessage ? latestMessageRef : undefined}
                className="my-3 max-w-[60%]"
              >
                <div className="mb-1 text-[11px] tracking-wider text-amber-200/60">{m.name}</div>
                <div className="inline-flex rounded-2xl rounded-tl-md bg-amber-50/30 px-4 py-3 text-[14px] text-amber-50">
                  <Dot delay={0} />
                  <Dot delay={150} />
                  <Dot delay={300} />
                </div>
              </div>
            );
          }
          return (
            <div
              key={m.id}
              ref={isLatestMessage ? latestMessageRef : undefined}
              className="my-3 rounded-lg border border-rose-400/30 bg-rose-900/30 px-4 py-2 text-center text-[12px] text-rose-100"
            >
              {m.text}
            </div>
          );
        })}
        <div className="h-[55%] min-h-[180px]" aria-hidden="true" />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 max-h-[260px] overflow-y-auto border-t border-white/10 bg-black/60 px-4 py-3 backdrop-blur-md">
        {state.optionsLoading && (
          <div className="py-3 text-center text-[12px] text-amber-200/70">
            <Sparkles className="mr-1 inline h-3 w-3" />
            🔮 Prism 折射中…
          </div>
        )}

        {state.showContinue && (
          <button
            onClick={isMultiplayer ? handleMpGoNext : goNext}
            className="w-full rounded-xl border-2 border-amber-400/60 bg-amber-500/20 px-4 py-3 text-center text-[14px] tracking-wider text-amber-100 backdrop-blur transition-all hover:bg-amber-400/30 active:scale-95"
          >
            → 进入下一幕
          </button>
        )}

        {isMultiplayer && mpShowContinue && !state.showContinue && (
          <button
            onClick={handleMpGoNext}
            className="w-full rounded-xl border-2 border-amber-400/60 bg-amber-500/20 px-4 py-3 text-center text-[14px] tracking-wider text-amber-100 backdrop-blur transition-all hover:bg-amber-400/30 active:scale-95"
          >
            → 进入下一幕
          </button>
        )}

        {!state.showContinue &&
          !mpShowContinue &&
          !state.optionsLoading &&
          state.options &&
          state.options.length > 0 && (
            <>
              <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-amber-50/60">
                <span>
                  💬 第 <b className="text-amber-200">
                    {isMultiplayer ? mpRound + 1 : state.roundInScene + 1}
                  </b> /{" "}
                  {state.maxRoundsPerScene} 组
                  {state.currentBeatLabel && (
                    <span className="ml-1 text-amber-200/80">· {state.currentBeatLabel}</span>
                  )}
                </span>
                {(isMultiplayer ? mpRound >= 1 : state.roundInScene >= 1) && (
                  <button
                    onClick={isMultiplayer ? handleMpGoNext : skipScene}
                    className="shrink-0 text-amber-300 hover:text-amber-200"
                  >
                    够了，进入下一幕 →
                  </button>
                )}
              </div>

              {state.translating && (
                <div className="mb-2 rounded-lg bg-amber-500/15 px-3 py-2 text-center text-[11px] text-amber-200">
                  正在化作寒雁此刻会说的话…
                </div>
              )}

              <div className="space-y-2">
                {state.options.map((opt, i) => (
                  <button
                    key={i}
                    disabled={isMultiplayer ? mpBusy : (state.translating || state.busy)}
                    onClick={() => isMultiplayer ? handleMpChoose(opt) : chooseOption(opt)}
                    className={[
                      "block w-full rounded-xl border px-3.5 py-2.5 text-left text-[13px] leading-relaxed transition-all disabled:opacity-50 active:scale-[0.98]",
                      opt.cls === "recommended"
                        ? "border-amber-400/60 bg-amber-500/15 text-amber-100 hover:bg-amber-400/25"
                        : opt.cls === "danger"
                          ? "border-rose-400/60 bg-rose-900/30 text-rose-100 hover:bg-rose-800/40"
                          : opt.cls === "gentle"
                            ? "border-sky-300/40 bg-sky-900/25 text-sky-100 hover:bg-sky-800/35"
                            : "border-white/20 bg-black/35 text-amber-50/90 hover:bg-white/10",
                    ].join(" ")}
                  >
                    <span className="mr-2 inline-block rounded-full bg-white/10 px-2 py-[1px] text-[10px] tracking-wider text-amber-200/80">
                      {opt.tag}
                    </span>
                    {opt.text}
                  </button>
                ))}
              </div>

              {scene?.allowFreeInput && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/15 bg-black/40 px-2 py-1.5">
                  <input
                    value={freeInput}
                    disabled={isMultiplayer ? mpBusy : (state.translating || state.busy)}
                    placeholder={scene.freeInputHint || "自由发挥…"}
                    onChange={(e) => setFreeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (freeInput.trim()) {
                          if (isMultiplayer) handleMpFreeInput();
                          else {
                            submitFreeInput(freeInput);
                            setFreeInput("");
                          }
                        }
                      }
                    }}
                    className="flex-1 bg-transparent px-2 py-1 text-[13px] text-amber-50 placeholder:text-amber-50/35 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    disabled={isMultiplayer ? (mpBusy || !freeInput.trim()) : (state.translating || state.busy || !freeInput.trim())}
                    onClick={() => {
                      if (freeInput.trim()) {
                        if (isMultiplayer) handleMpFreeInput();
                        else {
                          submitFreeInput(freeInput);
                          setFreeInput("");
                        }
                      }
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/30 text-amber-100 disabled:opacity-30"
                  >
                    <Send size={14} />
                  </button>
                </div>
              )}
            </>
          )}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="mx-[2px] inline-block h-[6px] w-[6px] animate-bounce rounded-full bg-amber-100"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

function StreamCursor() {
  return (
    <>
      <span
        className="ml-[2px] inline-block h-[14px] w-[2px] -mb-[2px] bg-stone-700/85 align-middle"
        style={{ animation: "blink 1s steps(2, start) infinite" }}
      />
      <style>{`
        @keyframes blink {
          to { visibility: hidden; }
        }
      `}</style>
    </>
  );
}
