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
import { usePlay } from "@/hooks/use-play";
import sceneBg from "@/assets/scene-cijitang.png";

export const Route = createFileRoute("/scene")({
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
  } = usePlay();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [freeInput, setFreeInput] = useState("");

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [state.messages, state.options]);

  useEffect(() => {
    if (state.phase === "intro") {
      startGame();
    }
  }, [state.phase, startGame]);

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
        className="relative z-10 h-[calc(100%-260px)] overflow-y-auto px-4 pb-4"
      >
        {state.messages.map((m) => {
          if (m.kind === "narration") {
            return (
              <div
                key={m.id}
                className="my-3 rounded-lg border border-amber-200/15 bg-black/35 px-4 py-3 text-[13px] leading-[1.85] tracking-wide text-amber-50/80 backdrop-blur"
              >
                {m.text}
              </div>
            );
          }
          if (m.kind === "ai") {
            return (
              <div key={m.id} className="my-3 max-w-[85%]">
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
              <div key={m.id} className="my-3 flex justify-end">
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
              <div key={m.id} className="my-3 max-w-[60%]">
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
              className="my-3 rounded-lg border border-rose-400/30 bg-rose-900/30 px-4 py-2 text-center text-[12px] text-rose-100"
            >
              {m.text}
            </div>
          );
        })}
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
              {state.translating && (
                <div className="mb-2 rounded-lg bg-amber-500/15 px-3 py-2 text-center text-[11px] text-amber-200">
                  正在化作寒雁此刻会说的话…
                </div>
              )}

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

              {state.roundInScene >= 1 && (
                <div className="mt-2 flex justify-between text-[11px] text-amber-50/55">
                  <span>
                    💬 第 <b className="text-amber-200">{state.roundInScene + 1}</b> /{" "}
                    {state.maxRoundsPerScene} 轮
                  </span>
                  <button onClick={skipScene} className="text-amber-300 hover:text-amber-200">
                    够了，进入下一幕 →
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
