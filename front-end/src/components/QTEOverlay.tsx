/**
 * QTEOverlay · 暗巷追杀全屏覆盖层
 * Web Audio 麦克风分贝判定
 */

import { useEffect } from "react";
import { useQTE, DEFAULT_QTE_CONFIG } from "@/hooks/use-qte";

interface Props {
  onComplete: (endingKey: string) => void;
}

export function QTEOverlay({ onComplete }: Props) {
  const { state, start } = useQTE(DEFAULT_QTE_CONFIG);

  // 完成后路由结局
  useEffect(() => {
    if (state.finalScore) {
      const t = setTimeout(() => onComplete(state.finalScore!.result), 800);
      return () => clearTimeout(t);
    }
  }, [state.finalScore, onComplete]);

  const dbPct = Math.min(100, (state.db / 100) * 100);
  const hitPct = Math.min(100, (state.hitSeconds / 2) * 100);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 px-6 backdrop-blur-sm">
      {/* 雨幕 */}
      <RainBackdrop />

      <div className="relative z-10 mb-4 text-center">
        <div className="text-[12px] tracking-[0.4em] text-rose-300/80">⚔️ 暗 巷 追 杀</div>
        <div className="mt-2 max-w-sm text-[13px] leading-relaxed text-amber-50/85">
          {state.active
            ? "🎤 大声喊：救——命——！"
            : state.preparing
              ? "正在申请麦克风权限…"
              : "7 个御前侍卫从墙头跃下，刀光霍霍——"}
        </div>
      </div>

      {state.active && (
        <div className="relative z-10 w-full max-w-sm space-y-3">
          <Meter label={`分贝 ${state.db} dB`} pct={dbPct} barClass="bg-gradient-to-r from-amber-400 to-rose-400" />
          <Meter label={`持续呼救 ${state.hitSeconds.toFixed(1)} 秒`} pct={hitPct} barClass="bg-gradient-to-r from-emerald-400 to-amber-400" />
          <div className="text-center font-mono text-3xl text-amber-200">
            {state.remaining.toFixed(1)}
          </div>
        </div>
      )}

      {!state.active && !state.finalScore && (
        <button
          onClick={start}
          disabled={state.preparing}
          className="relative z-10 mt-6 rounded-full border-2 border-amber-400/70 bg-amber-500/15 px-8 py-3 text-[14px] tracking-[0.3em] text-amber-100 backdrop-blur-md transition-all hover:bg-amber-400/25 active:scale-95 disabled:opacity-50"
        >
          {state.preparing ? "申请权限中…" : "开始呼救"}
        </button>
      )}

      {!state.active && (
        <div className="relative z-10 mt-4 max-w-xs text-center text-[11px] leading-relaxed text-amber-50/55">
          {state.error
            ? `（麦克风不可用：${state.error}，自动判定为最低档结局）`
            : "点击按钮后请允许使用麦克风\n大声喊出：救命——！"}
        </div>
      )}

      {state.finalScore && (
        <div className="relative z-10 mt-6 text-center">
          <div className="text-3xl tracking-wider text-amber-300">{"⭐".repeat(state.finalScore.stars)}</div>
          <div className="mt-2 text-[12px] text-amber-50/70">
            峰值 {state.finalScore.db} dB · 持续 {state.finalScore.hit} 秒
          </div>
        </div>
      )}
    </div>
  );
}

function Meter({ label, pct, barClass }: { label: string; pct: number; barClass: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-amber-50/75">
        <span>{label}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full transition-all duration-100 ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RainBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 60 }).map((_, i) => {
        const left = (i * 17) % 100;
        const len = 8 + ((i * 11) % 14);
        const dur = 0.4 + ((i * 7) % 10) * 0.06;
        const delay = (i * 13) % 20 / 10;
        return (
          <i
            key={i}
            className="absolute block w-[1px] bg-gradient-to-b from-transparent to-amber-100/40"
            style={{
              left: `${left}%`,
              height: `${len}px`,
              animation: `rainFall ${dur}s linear ${delay}s infinite`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes rainFall {
          from { transform: translateY(-100vh); }
          to   { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
}
