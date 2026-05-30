/**
 * EndingScreen · 结局展示
 */

import type { EndingConfig } from "@/lib/story";

interface Props {
  ending: EndingConfig;
  onRestart: () => void;
}

export function EndingScreen({ ending, onRestart }: Props) {
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
