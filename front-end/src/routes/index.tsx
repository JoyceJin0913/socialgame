import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Bell, Sparkles, Flame, Lock, ChevronRight, Users, Clock } from "lucide-react";
import heroHuatang from "@/assets/hero-huatangchun.jpg";
import coverJiu from "@/assets/cover-jiuchongxue.jpg";
import coverWu from "@/assets/cover-wugang.jpg";
import coverChangan from "@/assets/cover-changan.jpg";
import coverXing from "@/assets/cover-xinghai.jpg";
import { PhoneMockup } from "@/components/PhoneMockup";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/huatangchun" });
  },
  component: HomePage,
  head: () => ({
    meta: [
      { title: "画堂春 · 互动文游" },
      { name: "description", content: "AI 互动文游《画堂春》，自由代入角色，每个选择都改写故事。" },
    ],
  }),
});

type Game = {
  id: string;
  title: string;
  subtitle: string;
  cover: string;
  tags: string[];
  players: string;
  duration: string;
  hot?: boolean;
  locked?: boolean;
  to?: string;
};

const FEATURED: Game = {
  id: "huatangchun",
  title: "画堂春",
  subtitle: "一卷画堂春，半阙血色词。深宫之中，谁是故人，谁是劫数。",
  cover: heroHuatang,
  tags: ["古风", "宫廷", "悬疑"],
  players: "34,221",
  duration: "约 90 分钟",
  hot: true,
  to: "/huatangchun",
};

const GAMES: Game[] = [
  { id: "jiu", title: "九重雪", subtitle: "雪山之巅，剑出无回。", cover: coverJiu, tags: ["仙侠", "成长"], players: "12,408", duration: "60 分钟", locked: true },
  { id: "changan", title: "长安花事", subtitle: "盛唐市井，一袭红衣穿过千年。", cover: coverChangan, tags: ["唐风", "言情"], players: "8,772", duration: "75 分钟", locked: true },
  { id: "wu", title: "雾港谜案", subtitle: "1937 上海，一桩没有尸体的命案。", cover: coverWu, tags: ["民国", "推理"], players: "6,915", duration: "80 分钟", locked: true },
  { id: "xing", title: "星海回声", subtitle: "宇宙深处，一段未发出的回信。", cover: coverXing, tags: ["科幻", "孤独"], players: "3,204", duration: "50 分钟", locked: true },
];

const CATEGORIES = ["全部", "古风", "悬疑", "言情", "科幻", "民国", "仙侠"];

function GameHub() {
  const navigate = useNavigate();

  const openGame = (g: Game) => {
    if (g.locked || !g.to) return;
    navigate({ to: g.to });
  };

  return (
    <div className="relative h-full overflow-y-auto bg-[#fbf7ef] pb-10 no-scrollbar">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-[#fbf7ef]/90 px-5 pb-3 pt-12 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate({ to: "/novel" })}
              className="-ml-1 grid h-8 w-8 place-items-center"
              aria-label="返回画堂春"
            >
              <ChevronLeft className="h-5 w-5 text-neutral-700" />
            </button>
            <div>
              <div className="text-[10px] tracking-[0.3em] text-neutral-500">互动故事</div>
              <h1 className="font-brush text-2xl text-neutral-900">互动文游</h1>
            </div>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-full bg-black/[0.05]" aria-label="通知">
            <Bell className="h-4 w-4 text-neutral-700" />
          </button>
        </div>

        {/* Category chips */}
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c, i) => (
            <button
              key={c}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] transition ${
                i === 0
                  ? "bg-neutral-900 text-white"
                  : "bg-black/[0.05] text-neutral-600"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      {/* Featured banner — 画堂春 */}
      <section className="px-5 pt-2">
        <div className="mb-2 flex items-center gap-1.5">
          <Flame className="h-4 w-4" style={{ color: "var(--rouge)" }} />
          <span className="text-[12px] font-medium text-neutral-900">本周主打</span>
        </div>
        <button
          onClick={() => openGame(FEATURED)}
          className="group relative block h-[260px] w-full overflow-hidden rounded-3xl text-left shadow-[0_20px_50px_-20px_rgba(0,0,0,0.4)] active:scale-[0.99] transition"
        >
          <img src={FEATURED.cover} alt={FEATURED.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
          <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-white" />
            <span className="text-[10px] tracking-widest text-white">AI 实时改编</span>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <h2 className="font-brush text-4xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">{FEATURED.title}</h2>
            <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-white/85">{FEATURED.subtitle}</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[11px] text-white/80">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{FEATURED.players}</span>
                <span className="h-3 w-px bg-white/30" />
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{FEATURED.duration}</span>
              </div>
              <span
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium text-white"
                style={{ background: "var(--gradient-rouge)" }}
              >
                立即进入 <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </button>
      </section>

      {/* Game list */}
      <section className="mt-8 px-5">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h3 className="font-brush text-xl text-neutral-900">精选文游</h3>
            <p className="text-[11px] text-neutral-400">每一个故事，都是另一种人生</p>
          </div>
          <button className="text-[11px] text-neutral-400">全部 ›</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {GAMES.map((g) => (
            <button
              key={g.id}
              onClick={() => openGame(g)}
              className="group relative overflow-hidden rounded-2xl bg-black/[0.04] text-left transition active:scale-[0.98]"
            >
              <div className="relative h-[180px] w-full overflow-hidden">
                <img
                  src={g.cover}
                  alt={g.title}
                  loading="lazy"
                  className={`h-full w-full object-cover transition ${g.locked ? "blur-[2px] grayscale-[40%]" : ""}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                {g.locked && (
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 backdrop-blur-md">
                    <Lock className="h-3 w-3 text-white" />
                    <span className="text-[10px] text-white">敬请期待</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <div className="font-brush text-xl text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">{g.title}</div>
                </div>
              </div>
              <div className="px-3 py-2.5">
                <p className="line-clamp-1 text-[11px] text-neutral-600">{g.subtitle}</p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex gap-1">
                    {g.tags.slice(0, 2).map((t) => (
                      <span key={t} className="rounded-sm bg-black/[0.06] px-1.5 py-0.5 text-[9px] text-neutral-500">
                        {t}
                      </span>
                    ))}
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-neutral-400">
                    <Users className="h-2.5 w-2.5" />
                    {g.players}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Footer hint */}
      <section className="mt-8 px-5">
        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "var(--rouge)" }} />
            <span className="text-[12px] font-medium text-neutral-900">什么是 AI 互动文游？</span>
          </div>
          <p className="mt-2 text-[12px] leading-6 text-neutral-600">
            互动文游基于长篇故事改编，由 AI 实时生成剧情走向。你可以自由代入任意角色，每一次选择都将塑造一个独属于你的结局。
          </p>
        </div>
      </section>
    </div>
  );
}

function HomePage() {
  return (
    <PhoneMockup>
      <GameHub />
    </PhoneMockup>
  );
}
