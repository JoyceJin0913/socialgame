/**
 * EndingScreen · 结局展示（朱墨信笺风，参考 /ending 的 UI）
 */

import { RotateCcw, Search, Sparkles, Target, ScrollText } from "lucide-react";
import type { EndingConfig } from "@/lib/story";
import {
  LINE_NAME,
  type NumericsState,
  type EndingDecision,
  type LineKey,
} from "@/lib/numerics";
import sceneBg from "@/assets/ending-bg.jpg";

interface Props {
  ending: EndingConfig;
  onRestart: () => void;
  numerics?: NumericsState;
  decision?: EndingDecision | null;
  hookCount?: number;
  onEnterMinigame?: () => void;
}

const LABEL: Record<keyof NumericsState, string> = {
  trust: "信任", courage: "勇气", ration: "理智", inner: "内在",
  publicSym: "民意", family: "家族", hidden: "隐蔽", intel: "情报",
  ally: "盟友", expose: "暴露", endure: "隐忍", danger: "风险",
};

export function EndingScreen({
  ending,
  onRestart,
  numerics,
  decision,
  hookCount = 0,
  onEnterMinigame,
}: Props) {
  return (
    <div className="relative h-full overflow-hidden">
      {/* background */}
      <img
        src={sceneBg}
        alt=""
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-md"
      />
      <div className="absolute inset-0 bg-black/25" />

      {/* main scroll */}
      <div className="relative z-10 h-full overflow-y-auto px-4 pt-16 pb-8">
        {/* paper card */}
        <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[28px] bg-[#fbf5ec] px-6 pt-9 pb-7 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]">
          {/* subtle inner border */}
          <div className="pointer-events-none absolute inset-2 rounded-[22px] ring-1 ring-[#7a2a2a]/5" />

          {/* title */}
          <h1 className="mt-2 text-center font-brush text-[28px] leading-tight tracking-wide text-[#2b1a14]">
            <span className="text-[#7a2a2a]">【结局】</span>
            {ending.title}
          </h1>

          {/* divider */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="h-px w-12 bg-[#7a2a2a]/30" />
            <span className="text-[10px] text-[#7a2a2a]/70">❀</span>
            <span className="h-px w-12 bg-[#7a2a2a]/30" />
          </div>

          {/* body */}
          <div className="mt-5 space-y-3 text-[14px] leading-[2] text-[#3a2a22]">
            {ending.desc.map((p, i) => (
              <p key={i} className="text-justify indent-[2em]">
                {p}
              </p>
            ))}
          </div>

          {/* closing 题跋 */}
          {ending.closing && (
            <p className="mt-5 text-right font-brush text-[15px] tracking-wide text-[#7a2a2a]">
              {ending.closing}
            </p>
          )}

          {/* hairline */}
          <div className="mx-auto mt-6 h-px w-full bg-[#7a2a2a]/10" />

          {/* 数值终局（暂时隐藏，内容保留） */}
          {false && numerics && (
            <div className="mt-5 rounded-xl border border-[#7a2a2a]/15 bg-white/60 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#7a2a2a]">
                <ScrollText size={12} /> 数值终局
              </div>
              <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 text-[11px]">
                {(Object.keys(numerics) as (keyof NumericsState)[]).map((k) => {
                  const v = numerics[k];
                  const tone =
                    v >= 70
                      ? "text-[#3f7a4a]"
                      : v >= 40
                        ? "text-[#7a2a2a]"
                        : "text-[#b06a45]";
                  return (
                    <div key={k} className="flex justify-between">
                      <span className="text-[#3a2a22]/55">{LABEL[k]}</span>
                      <b className={`font-mono ${tone}`}>{v}</b>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 结局依据（暂时隐藏，内容保留） */}
          {false && decision && (
            <div className="mt-3 rounded-xl border border-[#7a2a2a]/15 bg-white/60 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#7a2a2a]">
                <Target size={12} /> 结局依据 · 你的选择
              </div>

              {/* 三条心意线的票数 */}
              <div className="mt-3 flex gap-2">
                {(Object.keys(decision.lines) as LineKey[]).map((k) => {
                  const top =
                    decision.lines[k] ===
                    Math.max(...Object.values(decision.lines));
                  const hasVote = decision.lines[k] > 0;
                  return (
                    <div
                      key={k}
                      className={`flex-1 rounded-lg px-2 py-1.5 text-center ${
                        top && hasVote
                          ? "bg-gradient-to-b from-[#d4a373]/30 to-[#7a2a2a]/15 ring-1 ring-[#7a2a2a]/30"
                          : "bg-[#f3e8d4]/70"
                      }`}
                    >
                      <div className="text-[#3a2a22]/55">{LINE_NAME[k]}</div>
                      <b className="font-mono text-[#7a2a2a]">
                        {decision.lines[k]} 票
                      </b>
                    </div>
                  );
                })}
              </div>

              {/* 逐幕选择回顾 */}
              {decision.picks.length > 0 && (
                <div className="mt-3 space-y-1 text-[11px]">
                  {decision.picks.map((p, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-[#3a2a22]/60">第 {i + 1} 次抉择</span>
                      <span className="text-[#2b1a14]">
                        {p.label}
                        <span className="ml-1 text-[#7a2a2a]/60">
                          · {LINE_NAME[p.line]}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 border-t border-[#7a2a2a]/10 pt-2 text-[11px] italic leading-relaxed text-[#3a2a22]/85">
                {decision.reason}
              </div>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-[#3a2a22]/45">
                <Search size={10} /> 累积 hook 次数：{hookCount}
              </div>
            </div>
          )}

          {/* 身世之谜 · 后续小游戏入口 */}
          {onEnterMinigame && (
            <div className="mt-4 rounded-xl border border-[#7a2a2a]/20 bg-gradient-to-b from-[#d4a373]/20 to-[#7a2a2a]/[0.06] p-4 text-center">
              <div className="text-[10px] tracking-[0.3em] text-[#7a2a2a]/70">
                尾声 · 未解之谜
              </div>
              <p className="mt-2 text-[12.5px] leading-[1.85] text-[#3a2a22]/80">
                恩怨虽了，可你究竟是谁的孩子？娘亲的欲言又止、画像里的疑点、老仆口中的"侯爷"……
                <br />
                是时候，亲手揭开那段被掩埋的身世了。
              </p>
              <button
                onClick={onEnterMinigame}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#7a2a2a] py-2.5 text-[13px] font-medium tracking-[0.15em] text-white shadow-[0_6px_16px_-6px_rgba(122,42,42,0.6)] transition active:scale-[0.99]"
              >
                <Sparkles size={14} /> 揭开身世之谜
              </button>
            </div>
          )}

          {/* 再玩一次 */}
          <div className="mt-5">
            <button
              onClick={onRestart}
              className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[#7a2a2a]/40 bg-white py-2.5 text-[12px] tracking-[0.15em] text-[#7a2a2a] transition active:scale-[0.99] hover:bg-[#fbf5ec]"
            >
              <RotateCcw size={13} />
              再玩一次
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
