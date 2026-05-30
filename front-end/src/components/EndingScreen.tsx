/**
 * EndingScreen · 结局展示
 */

import type { EndingConfig } from "@/lib/story";
import type { NumericsState, EndingDecision } from "@/lib/numerics";

interface Props {
  ending: EndingConfig;
  onRestart: () => void;
  numerics?: NumericsState;
  decision?: EndingDecision | null;
  hookCount?: number;
}

const LABEL: Record<keyof NumericsState, string> = {
  trust: "信任", courage: "勇气", ration: "理智", inner: "内在",
  publicSym: "民意", family: "家族", hidden: "隐蔽", intel: "情报",
  ally: "盟友", expose: "暴露", endure: "隐忍", danger: "风险",
};

export function EndingScreen({ ending, onRestart, numerics, decision, hookCount = 0 }: Props) {
  return (
    <div className="relative h-full w-full overflow-y-auto bg-neutral-950 px-6 pt-16 pb-10 text-amber-50">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-3 text-4xl tracking-wider">{ending.stars}</div>
        <div className="text-[12px] tracking-[0.3em] text-amber-300/70">{ending.epName}</div>
        <h1 className="mt-2 font-brush text-[28px] tracking-[0.15em] text-amber-100">
          {ending.title}
        </h1>

        <div className="mt-8 space-y-3 text-left text-[13.5px] leading-[1.85] text-amber-50/85">
          {ending.desc.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {/* 数值面板 */}
        {numerics && (
          <div className="mt-8 rounded-xl border border-amber-200/15 bg-black/40 p-4 text-left backdrop-blur">
            <div className="mb-3 text-[10px] tracking-[0.25em] text-amber-300/70">
              📊 数值终局 · NUMERICS
            </div>
            <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-[11px]">
              {(Object.keys(numerics) as (keyof NumericsState)[]).map((k) => {
                const v = numerics[k];
                const tone =
                  v >= 70 ? "text-emerald-300"
                  : v >= 40 ? "text-amber-100"
                  : "text-rose-300/80";
                return (
                  <div key={k} className="flex justify-between">
                    <span className="text-amber-50/55">{LABEL[k]}</span>
                    <b className={`font-mono ${tone}`}>{v}</b>
                  </div>
                );
              })}
            </div>
            {decision && (
              <div className="mt-3 border-t border-amber-200/10 pt-3 text-[11px] text-amber-100/70 leading-relaxed">
                <div className="mb-1 text-amber-300/80">🎯 结局路由依据</div>
                <div>QTE 原始：<span className="font-mono text-amber-100">{decision.qteContribution}</span></div>
                <div>数值贡献：<span className="font-mono text-amber-100">{decision.numericContribution}</span></div>
                <div className="mt-1 italic text-amber-100/85">{decision.reason}</div>
              </div>
            )}
            <div className="mt-3 border-t border-amber-200/10 pt-2 text-[10px] text-amber-100/45">
              累积 hook 次数：{hookCount}
            </div>
          </div>
        )}

        <button
          onClick={onRestart}
          className="mt-10 rounded-full border border-amber-300/40 bg-amber-500/10 px-8 py-2.5 text-[13px] tracking-[0.2em] text-amber-100 backdrop-blur transition-all hover:bg-amber-400/20 active:scale-95"
        >
          ↺ 再玩一次
        </button>
      </div>
    </div>
  );
}
