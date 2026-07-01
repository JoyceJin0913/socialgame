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
import { ChevronLeft, Send, Sparkles, Swords } from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";
import { PrismHUD } from "@/components/PrismHUD";
import { EndingScreen } from "@/components/EndingScreen";
import { BGMPlayer } from "@/components/BGMPlayer";
import { usePlay } from "@/hooks/use-play";
import { useRoomChat } from "@/hooks/use-room-chat";
import { CHARACTERS, getCharacter } from "@/lib/characters";
import { translateIntent } from "@/lib/chat";
import { resolveTone, type ToneSpec } from "@/lib/tone";
import sceneBg from "@/assets/scene-cijitang.png";
import type { ViewKey } from "@/lib/story";

type SceneSearch = {
  role?: string;
  tags?: string;
  resume?: string;
  battle?: string;
  room?: string;
  userId?: string;
};

function roleToView(role?: string): ViewKey {
  return role === "moshen" ? "fyx" : "hanyan";
}

export const Route = createFileRoute("/scene")({
  validateSearch: (s: Record<string, unknown>): SceneSearch => ({
    role: typeof s.role === "string" ? s.role : undefined,
    tags: typeof s.tags === "string" ? s.tags : undefined,
    resume: typeof s.resume === "string" ? s.resume : undefined,
    battle: typeof s.battle === "string" ? s.battle : undefined,
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

/**
 * Tag 语义系统 —— 让选项标签真正"会说话"
 * 把零散的 tag 文案归入 4 种倾向，配颜色 + 图标，
 * 玩家一眼就能看出这个选择偏向什么（不再只是装饰）。
 */
type TagTone = "affection" | "defiance" | "restraint" | "insight";

const TAG_TONE: Record<string, TagTone> = {
  // 情意线（暖橙）
  深情: "affection", 情意: "affection", 心软: "affection", 不放: "affection",
  坚持: "affection", 唤醒: "affection",
  // 锋芒线（赤红）
  反击: "defiance", 硬刚: "defiance", 决绝: "defiance", 对峙: "defiance",
  反抗: "defiance", 质问: "defiance", 追问: "defiance", 狠心: "defiance",
  断念: "defiance", 推拒: "defiance", 冰冷: "defiance",
  // 隐忍线（青灰）
  隐忍: "restraint", 克制: "restraint", 退避: "restraint", 体面: "restraint",
  观察: "restraint", 蓄势: "restraint", 自救: "restraint", 外援: "restraint",
  藏疾: "restraint", 强撑: "restraint", 回避: "restraint", 佯装: "restraint", 冷演: "restraint",
  // 洞察线（紫）—— 信息差解锁的关键选择
  看破: "insight", 暗察: "insight", 追查: "insight", 露真: "insight",
  破绽: "insight", 破功: "insight", 破防: "insight", 几乎破功: "insight",
  暗示: "insight", 留隙: "insight",
};

const TONE_STYLE: Record<TagTone, { cls: string; icon: string; label: string }> = {
  affection: { cls: "bg-amber-500/20 text-amber-200 border border-amber-400/30", icon: "♥", label: "情意" },
  defiance:  { cls: "bg-rose-500/20 text-rose-200 border border-rose-400/30", icon: "⚔", label: "锋芒" },
  restraint: { cls: "bg-sky-500/15 text-sky-200 border border-sky-400/25", icon: "◈", label: "隐忍" },
  insight:   { cls: "bg-violet-500/20 text-violet-200 border border-violet-400/35", icon: "✦", label: "洞察" },
};

function TagChip({ tag }: { tag: string }) {
  const tone = TAG_TONE[tag] ?? "restraint";
  const s = TONE_STYLE[tone];
  return (
    <span
      className={`mr-2 inline-flex items-center gap-1 rounded-full px-2 py-[1px] text-[10px] tracking-wider ${s.cls}`}
      title={`${s.label}倾向`}
    >
      <span className="text-[9px]">{s.icon}</span>
      {tag}
    </span>
  );
}

/**
 * 基调横幅 —— 让 lobby 选的标签（复仇/甜宠…）进游戏后"一眼可见"。
 * 两版样式，切 BANNER_VARIANT 看效果：
 *   "card" → 居中卡片，标签名大、副标题一行，仪式感强
 *   "bar"  → 顶部细长条幅，轻量不挡正文
 */
const BANNER_VARIANT: "card" | "bar" = "card";

const ACCENT_HEX: Record<string, string> = {
  rose: "#fb7185", red: "#f87171", amber: "#fbbf24", purple: "#c084fc",
  emerald: "#34d399", slate: "#cbd5e1", cyan: "#67e8f9", indigo: "#a5b4fc",
};

function ToneBanner({ tone, variant }: { tone: ToneSpec; variant: "card" | "bar" }) {
  const hex = ACCENT_HEX[tone.accent] ?? "#fbbf24";
  if (variant === "bar") {
    return (
      <div
        className="relative z-10 mx-4 mb-2 flex items-center gap-2 rounded-full border bg-black/45 px-3 py-1.5 backdrop-blur"
        style={{ borderColor: `${hex}55` }}
      >
        <span
          className="rounded-full px-2 py-[1px] text-[10px] font-bold tracking-wider"
          style={{ background: `${hex}26`, color: hex }}
        >
          {tone.label}
        </span>
        <span className="truncate text-[10.5px] tracking-wide text-white/65">{tone.bannerDesc}</span>
      </div>
    );
  }
  return (
    <div
      className="relative z-10 mx-4 mb-2 overflow-hidden rounded-xl border bg-black/45 px-4 py-2.5 text-center backdrop-blur"
      style={{ borderColor: `${hex}55`, boxShadow: `0 12px 36px -22px ${hex}` }}
    >
      <div className="flex items-center justify-center gap-2">
        <span className="h-px w-6" style={{ background: `${hex}99` }} />
        <span className="text-[10px] tracking-[0.34em] text-white/55">本局基调</span>
        <span className="h-px w-6" style={{ background: `${hex}99` }} />
      </div>
      <div
        className="mt-1 font-brush text-[20px] tracking-[0.22em]"
        style={{ color: hex }}
      >
        {tone.label}
      </div>
      <div className="mt-0.5 text-[11px] tracking-wide text-white/65">{tone.bannerDesc}</div>
    </div>
  );
}

function Scene() {
  const navigate = useNavigate();
  const { role, tags, resume, battle, room: roomCode, userId: paramUserId } = Route.useSearch();
  const initialView = roleToView(role);
  const tagList = tags ? tags.split(",").filter(Boolean) : [];
  const currentTone = resolveTone(tagList);

  // 多人模式：有 room 和 userId 参数时启用房间聊天
  const stableUserId = useRef(
    typeof window !== "undefined"
      ? (paramUserId || window.localStorage.getItem("ruxi.matchmaking.userId") || "")
      : "",
  ).current;

  const isMultiplayer = Boolean(roomCode && stableUserId);
  const roomChat = useRoomChat(isMultiplayer ? roomCode! : null, stableUserId);
  const buildSceneHref = (extra: Record<string, string>) => {
    const params = new URLSearchParams({ role: role || "hanyan" });
    if (tags) params.set("tags", tags);
    if (isMultiplayer && roomCode && stableUserId) {
      params.set("room", roomCode);
      params.set("userId", stableUserId);
    }
    Object.entries(extra).forEach(([key, value]) => params.set(key, value));
    return `/scene?${params.toString()}`;
  };

  const {
    state,
    view,
    startGame,
    chooseOption,
    submitFreeInput,
    skipScene,
    goNext,
    continueMainAfterSideQuest,
    recordChoiceMeta,
    restart,
    switchView,
    ending,
  } = usePlay(initialView, resume, tagList);

  // 前情提要视频：进第五幕前给观众引入（按视角男/女主各一版，看过不重播，可跳过）
  const introSeen = typeof window !== "undefined" && window.sessionStorage.getItem(`intro:${initialView}`) === "1";
  const [showIntro, setShowIntro] = useState(!resume && battle !== "won" && !introSeen);
  const dismissIntro = () => {
    if (typeof window !== "undefined") window.sessionStorage.setItem(`intro:${initialView}`, "1");
    setShowIntro(false);
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const [freeInput, setFreeInput] = useState("");
  const [battleTextDone, setBattleTextDone] = useState(false);
  const [battleText, setBattleText] = useState("");
  const [mpBusy, setMpBusy] = useState(false);
  const latestMessageId = state.messages.at(-1)?.id;

  const storedBattleEnding =
    battle === "won" && typeof window !== "undefined"
      ? window.sessionStorage.getItem("huatangchun:pendingEnding")
      : null;
  const battleEnding = storedBattleEnding ? JSON.parse(storedBattleEnding) : null;

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
  }, [battle, state.phase, startGame]);

  useEffect(() => {
    if (state.phase !== "battleIntro") return;
    setBattleText("");
    setBattleTextDone(false);

    const text =
      "偏殿灯火未熄，傅云夕终于撕开冷面：所谓和离，不过是替你挡下太后与七皇子的杀局。东侯旧案翻出水面，你的身世也随之惊动朝堂。有人怕你认祖归宗，有人怕傅云夕不再受制。夜色刚落，刺客便围住玄清王府，要在真相传入金銮殿前，将你们二人一并灭口。";
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setBattleText(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
        setBattleTextDone(true);
      }
    }, 28);

    return () => window.clearInterval(timer);
  }, [state.phase]);

  // 多人模式：检测对方发送的「推进场景」信号
  useEffect(() => {
    if (!isMultiplayer || roomChat.messages.length === 0) return;
    const lastMsg = roomChat.messages[roomChat.messages.length - 1];
    if (lastMsg.text === "__NEXT_SCENE__" && !lastMsg.isMine) {
      goNext();
    }
  }, [roomChat.messages, isMultiplayer, goNext]);

  useEffect(() => {
    if (!isMultiplayer) return;
    roomChat.messages.forEach((m) => {
      if (m.isMine || !m.meta?.hook) return;
      recordChoiceMeta(m.meta.sceneId || state.scene?.id || "remote", {
        id: m.id,
        hook: m.meta.hook,
        tag: m.meta.tag,
        delta: m.meta.delta,
      });
    });
  }, [isMultiplayer, recordChoiceMeta, roomChat.messages, state.scene?.id]);

  if (showIntro) {
    return <IntroVideo view={initialView} onDone={dismissIntro} />;
  }

  if (battleEnding) {
    return (
      <EndingScreen
        ending={battleEnding.ending}
        numerics={battleEnding.numerics}
        decision={battleEnding.decision}
        hookCount={battleEnding.hookCount}
        onRestart={() => {
          window.sessionStorage.removeItem("huatangchun:pendingEnding");
          restart();
          setFreeInput("");
          navigate({ to: "/scene", search: { role: role || "hanyan" } });
        }}
      />
    );
  }

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
      const sent = await roomChat.sendMessage(
        spokenLine,
        opt._prism?.hook
          ? {
              sceneId: scene.id,
              choiceId: opt._prism.id,
              tag: opt._prism.tag,
              hook: opt._prism.hook,
              delta: opt._prism.delta,
            }
          : undefined,
      );
      if (sent && opt._prism?.hook) {
        recordChoiceMeta(scene.id, { ...opt._prism, id: sent.id });
      }
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
      />
    );
  }

  if (state.phase === "battleIntro" && ending) {
    return (
      <BattleTransition
        text={battleText}
        ready={battleTextDone}
        onEnter={() => {
          window.sessionStorage.setItem(
            "huatangchun:pendingEnding",
            JSON.stringify({
              ending,
              numerics: state.numerics,
              decision: state.endingDecision,
              hookCount: state.hookLog.length,
            })
          );
          navigate({
            to: "/minigame2",
            search: { from: "scene", returnTo: buildSceneHref({ battle: "won" }) },
          });
        }}
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
          onClick={() => navigate({ to: "/huatangchun" })}
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

      {currentTone && <ToneBanner tone={currentTone} variant={BANNER_VARIANT} />}

      {state.hud && (
        <PrismHUD info={state.hud} numerics={state.numerics} lastChange={state.lastChange} />
      )}

      <div
        ref={scrollRef}
        className={`absolute inset-x-0 bottom-[260px] z-10 overflow-y-auto px-4 pb-4 ${currentTone ? "top-[170px]" : "top-[108px]"}`}
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

        {state.pendingSideQuest && (
          <div className="rounded-xl border border-amber-300/45 bg-amber-500/15 px-4 py-3 text-center shadow-[0_16px_40px_-24px_rgba(251,191,36,0.9)]">
            <div className="text-[10px] tracking-[0.28em] text-amber-200/75">
              {state.pendingSideQuest.eyebrow}
            </div>
            <div className="mt-1 font-brush text-[21px] tracking-[0.16em] text-amber-50">
              {state.pendingSideQuest.title}
            </div>
            <p className="mt-2 text-left text-[12.5px] leading-[1.8] text-amber-50/78">
              {state.pendingSideQuest.description}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  navigate({
                    to: "/minigame",
                    search: {
                      from: "scene",
                      role: view,
                      resume: "sidehall_confront",
                      room: isMultiplayer ? roomCode : undefined,
                      userId: isMultiplayer ? stableUserId : undefined,
                    },
                  })
                }
                className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300/70 bg-amber-400/25 px-3 py-2.5 text-[13px] tracking-wider text-amber-50 transition hover:bg-amber-300/30 active:scale-95"
              >
                <Sparkles size={14} />
                {state.pendingSideQuest.enterLabel}
              </button>
              <button
                onClick={continueMainAfterSideQuest}
                className="rounded-xl border border-white/18 bg-black/30 px-3 py-2.5 text-[13px] tracking-wider text-amber-100/80 transition hover:bg-white/10 active:scale-95"
              >
                {state.pendingSideQuest.skipLabel}
              </button>
            </div>
          </div>
        )}

        {state.showContinue && !state.pendingSideQuest && (
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

              {/* Tag 倾向图例 —— 让玩家看懂选项标签的含义 */}
              <div className="mb-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[9px] text-white/50">
                <span className="text-amber-300/80">♥ 情意</span>
                <span className="text-rose-300/80">⚔ 锋芒</span>
                <span className="text-sky-300/80">◈ 隐忍</span>
                <span className="text-violet-300/80">✦ 洞察</span>
              </div>

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
                    <TagChip tag={opt.tag} />
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

function IntroVideo({ view, onDone }: { view: ViewKey; onDone: () => void }) {
  const src = view === "fyx" ? "/intro/fyx.mp4" : "/intro/hanyan.mp4";
  const title = view === "fyx" ? "傅云夕 · 前情" : "庄寒雁 · 前情";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  // 浏览器只允许「静音」自动播放；先静音起播保证画面出来，再让用户一键开声
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {
      /* 若仍被拦截，画面停在首帧，用户可点「跳过」或点屏开声重播 */
    });
  }, []);

  const enableSound = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    setMuted(false);
    v.play().catch(() => undefined);
  };

  return (
    <div className="relative h-full overflow-hidden bg-black text-amber-50">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        playsInline
        preload="auto"
        controls={false}
        onEnded={onDone}
        onError={onDone}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/60 to-transparent px-5 pt-12 pb-8 text-center">
        <div className="text-[10px] tracking-[0.36em] text-amber-200/70">第五幕 · 前情提要</div>
        <div className="mt-1 font-brush text-[18px] tracking-[0.18em] text-amber-100">{title}</div>
      </div>
      {muted && (
        <button
          onClick={enableSound}
          className="absolute bottom-8 left-5 z-10 rounded-full border border-amber-300/50 bg-black/45 px-4 py-2 text-[12px] tracking-wider text-amber-100 backdrop-blur transition active:scale-95"
        >
          🔇 点击开声
        </button>
      )}
      <button
        onClick={onDone}
        className="absolute bottom-8 right-5 z-10 rounded-full border border-white/30 bg-black/45 px-4 py-2 text-[12px] tracking-wider text-amber-50 backdrop-blur transition active:scale-95"
      >
        跳过 ▶
      </button>
    </div>
  );
}

function BattleTransition({
  text,
  ready,
  onEnter,
}: {
  text: string;
  ready: boolean;
  onEnter: () => void;
}) {
  return (
    <div className="relative h-full overflow-hidden bg-neutral-950 text-amber-50">
      <img src={sceneBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-[#2a0d12]/50 to-black/90" />
      <BGMPlayer />
      <div className="relative z-10 flex h-full flex-col justify-end px-5 pb-10">
        <div className="mb-5 text-center">
          <div className="text-[10px] tracking-[0.36em] text-amber-200/70">第五幕之后</div>
          <h1 className="mt-2 font-brush text-[30px] tracking-[0.18em] text-amber-100">
            王府夜袭
          </h1>
        </div>
        <div className="rounded-xl border border-amber-300/35 bg-black/50 px-4 py-4 text-[14px] leading-[2] tracking-wide text-amber-50/88 shadow-[0_18px_50px_-28px_rgba(251,191,36,0.8)] backdrop-blur">
          {text}
          {!ready && <StreamCursor />}
        </div>
        <button
          disabled={!ready}
          onClick={onEnter}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300/65 bg-amber-500/20 px-4 py-3 text-[14px] tracking-[0.18em] text-amber-100 transition active:scale-95 disabled:opacity-45"
        >
          <Swords size={16} />
          王府御敌
        </button>
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
