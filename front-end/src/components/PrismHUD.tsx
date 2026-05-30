/**
 * PrismHUD · 右上角调试浮窗
 * 实时显示当前剧本 / 视角 / 五轴 / 折射可见数
 */

import type { HUDInfo } from "@/lib/prism";
import { useState } from "react";

interface Props {
  info: HUDInfo;
}

export function PrismHUD({ info }: Props) {
  const [showFiltered, setShowFiltered] = useState(false);
  const axesLine = `S=${info.axes.S} · H=${info.axes.H} · N=[${info.axes.N.join(",")}] · T=${info.axes.T} · A=${info.axes.A.rumor}/${info.axes.A.reverb}`;

  return (
    <div className="absolute right-3 top-16 z-30 w-[260px] rounded-xl border border-amber-300/30 bg-black/65 p-3 text-[11px] text-amber-50/90 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
      <div className="mb-1 text-[12px] tracking-widest text-amber-300">
        🔮 Prism · <b className="text-amber-200">{info.presetLabel}</b>
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
      {info.filteredOut.length > 0 && (
        <div className="mt-2">
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
