import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PhoneMockup } from "@/components/PhoneMockup";
import bg from "@/assets/matching-bg.png";
import titleText from "@/assets/huatangchun-text.png";
import { CHARACTERS } from "@/lib/characters";

export const Route = createFileRoute("/matching")({
  component: MatchingPage,
  validateSearch: (s: Record<string, unknown>) => ({
    role: typeof s.role === "string" ? s.role : "hanyan",
  }),
  head: () => ({
    meta: [
      { title: "匹配中 · 重生之贵女难求" },
      { name: "description", content: "正在为你寻找入梦的旅人…" },
    ],
  }),
});

type Phase = "matching" | "found";

const MATCH_DURATION_MS = 3200;
const COUNTDOWN_SECONDS = 3;

function Matching() {
  const navigate = useNavigate();
  const { role: myRoleId } = Route.useSearch();

  const [phase, setPhase] = useState<Phase>("matching");
  const [dots, setDots] = useState("");
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const me = CHARACTERS.find((c) => c.id === myRoleId) ?? CHARACTERS[0];
  // 站内匹配的对手：玩女主配男主，反之配女主
  const partnerId = myRoleId === "moshen" ? "hanyan" : "moshen";
  const partner = CHARACTERS.find((c) => c.id === partnerId) ?? CHARACTERS[1];

  // 匹配中：点点点动画
  useEffect(() => {
    if (phase !== "matching") return;
    const i = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 450);
    return () => clearInterval(i);
  }, [phase]);

  // 自动从 matching → found
  useEffect(() => {
    if (phase !== "matching") return;
    const t = setTimeout(() => setPhase("found"), MATCH_DURATION_MS);
    return () => clearTimeout(t);
  }, [phase]);

  const enterScene = useCallback(() => {
    navigate({ to: "/scene", search: { role: myRoleId } });
  }, [navigate, myRoleId]);

  // found 阶段倒计时
  useEffect(() => {
    if (phase !== "found") return;
    if (countdown <= 0) {
      enterScene();
      return;
    }
    const t = setTimeout(() => setCountdown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, enterScene]);

  if (phase === "matching") {
    return (
      <div
        className="relative h-full overflow-hidden cursor-pointer"
        onClick={() => setPhase("found")}
      >
        <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate({ to: "/lobby" });
          }}
          className="absolute right-5 top-12 z-20 text-[12px] text-white/80 transition active:scale-95"
        >
          取消
        </button>

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-8">
          <div
            aria-label="重生之贵女难求"
            role="img"
            className="h-[240px] w-[200px]"
            style={{
              backgroundColor: "white",
              WebkitMaskImage: `url(${titleText})`,
              maskImage: `url(${titleText})`,
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.6))",
            }}
          />
          <div className="mt-10 flex flex-col items-center">
            <div className="font-brush text-[32px] tracking-[0.15em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              匹配中<span className="inline-block w-6 text-left">{dots}</span>
            </div>
            <div className="mt-2 text-[12px] tracking-[0.3em] text-white/80">正在寻找入梦的旅人</div>
          </div>
        </div>
      </div>
    );
  }

  // ── found 承接页 ──
  return (
    <div className="relative h-full overflow-hidden bg-neutral-950">
      <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col items-center justify-between px-6 pb-10 pt-14">
        <div className="text-center">
          <div className="text-[11px] tracking-[0.4em] text-amber-300/80">✨ 入梦旅人已寻得</div>
          <div className="mt-2 font-brush text-[24px] tracking-[0.2em] text-amber-100">
            缘 起 此 刻
          </div>
        </div>

        <div className="flex w-full items-center justify-center gap-3">
          <PlayerCard label="你" name={me.name} role={me.role} img={me.img} highlight />
          <div className="flex flex-col items-center gap-1">
            <div className="text-2xl text-amber-300/70">⚭</div>
            <div className="text-[10px] tracking-widest text-amber-200/60">对戏</div>
          </div>
          <PlayerCard label="对方" name={partner.name} role={partner.role} img={partner.img} ai />
        </div>

        <div className="w-full rounded-2xl border border-amber-300/25 bg-black/45 p-5 backdrop-blur-md">
          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] text-amber-300/70">本回剧本</div>
            <div className="mt-1 font-brush text-[18px] tracking-[0.15em] text-amber-100">
              第五幕 · 离心时刻
            </div>
            <div className="mt-2 text-[11px] text-amber-50/65">
              共 3 场戏 · 约 10 分钟 · 含暗巷追杀 QTE
            </div>
          </div>
          <div className="mt-4 border-t border-amber-200/15 pt-3 text-center">
            <div className="text-[11px] tracking-[0.2em] text-amber-200/55">第一幕</div>
            <div className="mt-1 text-[13px] text-amber-50/85">🌨 雪夜书房 · 一年之约</div>
            <div className="mt-2 text-[11px] italic text-amber-100/55">
              「等我一年。一年内不归，你便改嫁。」
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-3">
          <button
            onClick={enterScene}
            className="w-full rounded-full border-2 border-amber-400/60 bg-amber-500/20 py-3.5 text-[14px] tracking-[0.3em] text-amber-100 backdrop-blur transition-all hover:bg-amber-400/30 active:scale-95"
          >
            立 即 入 梦
          </button>
          <div className="text-[11px] text-amber-50/55">{countdown} 秒后自动进入…</div>
        </div>
      </div>
    </div>
  );
}

function PlayerCard({
  label,
  name,
  role,
  img,
  highlight,
  ai,
}: {
  label: string;
  name: string;
  role: string;
  img: string;
  highlight?: boolean;
  ai?: boolean;
}) {
  return (
    <div
      className={`flex w-32 flex-col items-center rounded-2xl border bg-black/40 p-3 backdrop-blur-md ${
        highlight ? "border-amber-300/60 shadow-[0_0_24px_rgba(251,191,36,0.15)]" : "border-white/15"
      }`}
    >
      <div className="text-[10px] tracking-[0.3em] text-amber-200/70">{label}</div>
      <div className="relative mt-2">
        <img
          src={img}
          alt={name}
          className="h-20 w-20 rounded-full border-2 border-amber-200/50 object-cover"
        />
        {ai && (
          <span className="absolute -bottom-1 -right-1 inline-flex items-center rounded-full border border-sky-300/40 bg-sky-500/20 px-1.5 py-[1px] text-[8px] tracking-wider text-sky-100 backdrop-blur">
            AI
          </span>
        )}
      </div>
      <div className="mt-2 font-brush text-[15px] tracking-wider text-amber-100">{name}</div>
      <div className="mt-1 text-center text-[10px] leading-tight text-amber-50/60">{role}</div>
    </div>
  );
}

function MatchingPage() {
  return (
    <PhoneMockup>
      <Matching />
    </PhoneMockup>
  );
}
