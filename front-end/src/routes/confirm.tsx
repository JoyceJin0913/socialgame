import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Users, Clock, Mountain } from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";
import { CHARACTERS } from "@/lib/characters";
import heroImg from "@/assets/hero-huatangchun.jpg";

export const Route = createFileRoute("/confirm")({
  component: ConfirmPage,
  head: () => ({
    meta: [
      { title: "确认信息 · 画堂春" },
      { name: "description", content: "确认队友与剧本，准备开始游戏。" },
    ],
  }),
});

function Confirm() {
  const navigate = useNavigate();
  const players = [
    { id: "peiyan", label: "你", host: true },
    { id: "wentang" },
    { id: "peirong", label: "玩家A" },
    { id: "peiyu", label: "玩家B" },
    { id: "empress", label: "玩家C" },
    { id: "mama", label: "玩家D" },
  ] as { id: string; label?: string; host?: boolean }[];

  return (
    <div className="relative h-full overflow-y-auto bg-white px-6 pt-12 pb-6 no-scrollbar">
      <h1 className="font-brush text-[26px] text-neutral-900">确认信息</h1>
      <p className="mt-1 text-[12px] text-neutral-500">请确认以下信息，准备开始游戏</p>

      {/* Script card */}
      <div className="mt-4 flex gap-3 rounded-2xl border border-black/10 bg-neutral-50 p-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
          <img src={heroImg} alt="画堂春" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-brush text-[18px] text-neutral-900">画堂春</span>
            <span
              className="rounded-md px-1.5 py-0.5 text-[9px] text-white"
              style={{ background: "var(--gradient-rouge)" }}
            >
              经典剧本
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-neutral-500">
            大顺年间，画堂之中突发命案，众人各怀心思，谁是凶手？
          </p>
          <div className="mt-2 flex items-center gap-3 text-[10px] text-neutral-500">
            <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />6人本</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />中等时长</span>
            <span className="inline-flex items-center gap-1"><Mountain className="h-3 w-3" />古风</span>
          </div>
        </div>
      </div>

      {/* Player list */}
      <div className="mt-5">
        <div className="text-[12px] text-neutral-700">
          玩家列表 <span className="text-neutral-400">({players.length}/6)</span>
        </div>
        <ul className="mt-2 divide-y divide-black/[0.06] rounded-2xl border border-black/10 bg-white">
          {players.map((p) => {
            const c = CHARACTERS.find((x) => x.id === p.id)!;
            return (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                <img src={c.img} alt={c.name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] text-neutral-900">{p.label ?? c.name}</span>
                    {p.host && (
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[9px] text-white"
                        style={{ background: "var(--rouge)" }}
                      >
                        房主
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-400">{c.name}</div>
                </div>
                <span className="text-[11px] text-emerald-600">已准备</span>
                <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-3 w-3" />
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => navigate({ to: "/invite" })}
          className="h-12 flex-1 rounded-full border border-black/15 bg-white text-[13px] text-neutral-700 transition active:scale-[0.98]"
        >
          上一步
        </button>
        <button
          onClick={() => navigate({ to: "/matching" })}
          className="h-12 flex-1 rounded-full text-white shadow-[var(--shadow-card)] transition active:scale-[0.98]"
          style={{ background: "var(--gradient-rouge)" }}
        >
          <span className="font-brush text-base tracking-wider">开始游戏</span>
        </button>
      </div>
    </div>
  );
}

function ConfirmPage() {
  return (
    <PhoneMockup>
      <Confirm />
    </PhoneMockup>
  );
}
