/**
 * PrismHUD · 右上角调试浮窗
 * 实时显示当前剧本 / 视角 / 五轴 / 折射可见数 / 数值变化
 */

import type { HUDInfo } from "@/lib/prism";
import type { NumericsState } from "@/lib/numerics";
import { useState } from "react";

interface Props {
  info: HUDInfo;
  numerics?: NumericsState;
  lastChange?: string[];
}

export function PrismHUD({ info, numerics, lastChange }: Props) {
  const [showFiltered, setShowFiltered] = useState(false);
  const [showNumerics, setShowNumerics] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const axesLine = `S=${info.axes.S} · H=${info.axes.H} · N=[${info.axes.N.join(",")}] · T=${info.axes.T} · A=${info.axes.A.rumor}/${info.axes.A.reverb}`;

  // 折叠态：只露出「🔮 Prism」小标签，点击展开
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute right-3 top-3 z-30 rounded-full border border-amber-300/30 bg-black/65 px-3 py-1.5 text-[12px] tracking-widest text-amber-300 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:bg-black/80 hover:text-amber-200"
        title="展开 Prism 面板"
      >
        🔮 Prism
      </button>
    );
  }

  return (
    <div className="absolute right-3 top-3 z-30 w-[260px] rounded-xl border border-amber-300/30 bg-black/65 p-3 text-[11px] text-amber-50/90 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
      <div className="mb-1 flex items-center justify-between text-[12px] tracking-widest text-amber-300">
        <span>
          🔮 Prism · <b className="text-amber-200">{info.presetLabel}</b>
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="ml-2 rounded px-1.5 leading-none text-amber-200/70 hover:text-amber-100"
          title="折叠"
        >
          ✕
        </button>
      </div>
      <div className="flex justify-between">
        <span className="text-amber-50/60">剧本</span>
        <b className="text-amber-50">{info.scriptTitle}</b>
      </div>
      <div className="flex justify-between">
        <span className="text-amber-50/60">视角</span>
        <b className="text-amber-50">{info.view}</b>
      </div>
      <div className="my-2 border-t border-amber-200/15 pt-1.5 font-mono text-[10px] leading-snug text-amber-100/80">
        {axesLine}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-[2px] text-[10px] text-emerald-100">
          动态可见 {info.visibleCount}/{info.poolSize}
        </span>
        <span className="rounded-full border border-stone-500/40 bg-stone-500/15 px-2 py-[2px] text-[10px] text-stone-300">
          原写死 {info.legacyCount}
        </span>
      </div>

      {/* 数值小面板（最近一次变化飘字 + 可展开看全部）*/}
      {numerics && (
        <div className="mt-2 border-t border-amber-200/10 pt-2">
          {lastChange && lastChange.length > 0 && (
            <div className="mb-1.5 flex flex-wrap gap-1">
              {lastChange.map((c, i) => {
                const positive = !c.includes("-");
                return (
                  <span
                    key={i}
                    className={`rounded-full px-2 py-[2px] text-[10px] ${positive ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/20 text-rose-200"}`}
                  >
                    {c}
                  </span>
                );
              })}
            </div>
          )}
          <button
            onClick={() => setShowNumerics((s) => !s)}
            className="w-full text-left text-[11px] text-amber-100/70 hover:text-amber-200"
          >
            {showNumerics ? "▾" : "▸"} 数值（trust {numerics.trust} · courage {numerics.courage}）
          </button>
          {showNumerics && (
            <div className="mt-1 grid grid-cols-3 gap-x-2 gap-y-1 text-[10px] text-amber-100/70">
              <span>信任 <b className="font-mono text-amber-200">{numerics.trust}</b></span>
              <span>勇气 <b className="font-mono text-amber-200">{numerics.courage}</b></span>
              <span>理智 <b className="font-mono text-amber-200">{numerics.ration}</b></span>
              <span>民意 <b className="font-mono text-amber-200">{numerics.publicSym}</b></span>
              <span>家族 <b className="font-mono text-amber-200">{numerics.family}</b></span>
              <span>隐蔽 <b className="font-mono text-amber-200">{numerics.hidden}</b></span>
              <span>情报 <b className="font-mono text-amber-200">{numerics.intel}</b></span>
              <span>盟友 <b className="font-mono text-amber-200">{numerics.ally}</b></span>
              <span>暴露 <b className="font-mono text-amber-200">{numerics.expose}</b></span>
            </div>
          )}
        </div>
      )}

      {info.filteredOut.length > 0 && (
        <div className="mt-2 border-t border-amber-200/10 pt-2">
          <button
            onClick={() => setShowFiltered((s) => !s)}
            className="w-full text-left text-[11px] text-amber-100/70 hover:text-amber-200"
          >
            {showFiltered ? "▾" : "▸"} 已过滤 {info.filteredOut.length} 个
          </button>
          {showFiltered && (
            <ul className="mt-1.5 max-h-44 list-none space-y-1.5 overflow-y-auto pl-1 text-[10.5px] text-amber-100/60">
              {info.filteredOut.map((f, i) => (
                <li key={i}>
                  · {f.text}
                  <br />
                  <em className="text-rose-300/80 not-italic">{f.why}</em>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
