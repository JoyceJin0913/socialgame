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
import sceneBg from "@/assets/scene-cijitang.png";
import type { ViewKey } from "@/lib/story";

type SceneSearch = { role?: string; resume?: string; battle?: string };

function roleToView(role?: string): ViewKey {
  return role === "moshen" ? "fyx" : "hanyan";
}

export const Route = createFileRoute("/scene")({
  validateSearch: (s: Record<string, unknown>): SceneSearch => ({
    role: typeof s.role === "string" ? s.role : undefined,
    resume: typeof s.resume === "string" ? s.resume : undefined,
    battle: typeof s.battle === "string" ? s.battle : undefined,
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

function Scene() {
  const navigate = useNavigate();
  const { role, resume, battle } = Route.useSearch();
  const initialView = roleToView(role);
  const {
    state,
    view,
    startGame,
    chooseOption,
    submitFreeInput,
    skipScene,
    goNext,
    continueMainAfterSideQuest,
    restart,
    switchView,
    ending,
  } = usePlay(initialView, resume);

  const scrollRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const [freeInput, setFreeInput] = useState("");
  const [battleTextDone, setBattleTextDone] = useState(false);
  const [battleText, setBattleText] = useState("");
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
            search: { from: "scene", returnTo: "/scene?role=hanyan&battle=won" },
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
        <button
          onClick={() => switchView(view === "hanyan" ? "fyx" : "hanyan")}
          className="flex h-9 items-center gap-1 rounded-full bg-black/40 px-3 text-[10px] tracking-wider text-amber-100 backdrop-blur active:scale-95"
          title="切换视角（会重启）"
        >
          {view === "hanyan" ? "👁 寒雁" : "❄ 云夕"}
        </button>
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
        {state.messages.map((m) => {
          const isLatestMessage = m.id === latestMessageId;
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
          if (m.kind === "me") {
            return (
              <div
                key={m.id}
                ref={isLatestMessage ? latestMessageRef : undefined}
                className="my-3 flex justify-end"
              >
                <div className="max-w-[85%]">
                  <div className="mb-1 text-right text-[11px] tracking-wider text-amber-100/80">
                    庄寒雁
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
                    search: { from: "scene", role: view, resume: "sidehall_confront" },
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
            onClick={goNext}
            className="w-full rounded-xl border-2 border-amber-400/60 bg-amber-500/20 px-4 py-3 text-center text-[14px] tracking-wider text-amber-100 backdrop-blur transition-all hover:bg-amber-400/30 active:scale-95"
          >
            → 进入下一幕
          </button>
        )}

        {!state.showContinue &&
          !state.optionsLoading &&
          state.options &&
          state.options.length > 0 && (
            <>
              <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-amber-50/60">
                <span>
                  💬 第 <b className="text-amber-200">{state.roundInScene + 1}</b> /{" "}
                  {state.maxRoundsPerScene} 组
                  {state.currentBeatLabel && (
                    <span className="ml-1 text-amber-200/80">· {state.currentBeatLabel}</span>
                  )}
                </span>
                {state.roundInScene >= 1 && (
                  <button onClick={skipScene} className="shrink-0 text-amber-300 hover:text-amber-200">
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
                    disabled={state.translating || state.busy}
                    onClick={() => chooseOption(opt)}
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
                    disabled={state.translating || state.busy}
                    placeholder={scene.freeInputHint || "自由发挥…"}
                    onChange={(e) => setFreeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (freeInput.trim()) {
                          submitFreeInput(freeInput);
                          setFreeInput("");
                        }
                      }
                    }}
                    className="flex-1 bg-transparent px-2 py-1 text-[13px] text-amber-50 placeholder:text-amber-50/35 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    disabled={state.translating || state.busy || !freeInput.trim()}
                    onClick={() => {
                      if (freeInput.trim()) {
                        submitFreeInput(freeInput);
                        setFreeInput("");
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
