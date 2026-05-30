import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ThumbsUp, ThumbsDown, MessageCircle, Sparkles, ChevronRight } from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";

export const Route = createFileRoute("/novel")({
  component: NovelPage,
  head: () => ({
    meta: [
      { title: "画堂春 · 知乎盐选小说" },
      { name: "description", content: "知乎盐选小说《画堂春》原著阅读。" },
    ],
  }),
});

const PARAGRAPHS = [
  "我入宫十年，始终是个无宠的贵人。",
  "没有争宠，也没有把亲生孩子养在身边的本事，只好随大流站队，以求保全一条性命。",
  "贵妃被废离宫，人人踩上一脚时，我也被迫欺负她的三皇子。",
  "可是在这宫里，从来都是旁人欺负我，我不知道怎么欺负人。",
  "我挠挠头，只好把我亲手做的枣花糕给了三皇子：",
  "「你只配吃这种下等点心！」",
  "九岁的三皇子攥着那块枣花糕，安安静静站在树影里，乌黑的眼珠直勾勾盯了我半晌，忽然低下头，咬了一口。",
  "他咬得很慢，很轻，像在含一口化不开的雪。我看见他眼睫颤了颤，一滴眼泪砸在糕点上，被他飞快地用袖子蹭掉。",
  "我心里咯噔一下，想说点什么，又怕被人瞧见，只好板着脸转身就走。",
  "走出去十几步，回头看了一眼——他还站在原处，把那块咬过的枣花糕，小心翼翼地揣进了怀里。",
];

function NovelPage() {
  const navigate = useNavigate();
  return (
    <PhoneMockup>
      <div className="relative flex h-full flex-col bg-white">
        {/* Top bar */}
        <header className="z-20 flex shrink-0 items-center justify-between border-b border-black/5 bg-white px-4 pb-3 pt-12">
          <div className="text-[22px] font-bold leading-none text-[#0084FF]">知乎</div>
          <button
            onClick={() => navigate({ to: "/", search: { entered: "1" } })}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium text-white shadow-[0_8px_20px_-8px_rgba(232,107,90,0.6)] active:scale-[0.98] transition"
            style={{ background: "var(--gradient-rouge)" }}
          >
            <Sparkles className="h-3 w-3" />
            <span>进入严选 · 互动文游</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pb-6 no-scrollbar">
          {/* Title */}
          <section className="px-6 pt-6">
            <h1 className="text-[26px] font-bold tracking-wide text-neutral-900">画堂春</h1>
            <div className="mt-5 flex items-center gap-1 text-[11px] text-neutral-400">
              <span>©</span>
              <span>本内容版权为知乎及版权方所有，正在受版权保护中</span>
              <span className="ml-0.5 grid h-3 w-3 place-items-center rounded-full border border-neutral-300 text-[8px]">?</span>
            </div>
          </section>

          {/* Body */}
          <article className="px-6 pt-5">
            <div className="space-y-5 text-[15px] leading-[1.95] text-neutral-800">
              {PARAGRAPHS.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* CTA — 改编为互动文游 */}
            <button
              onClick={() => navigate({ to: "/adapt" })}
              className="group mt-10 block w-full overflow-hidden rounded-2xl border border-black/5 bg-neutral-100 text-left transition hover:bg-neutral-200/70 active:scale-[0.99]"
            >
              <div className="relative px-5 py-4 text-neutral-900">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-neutral-500" />
                  <span className="text-[10px] tracking-[0.3em] text-neutral-500">AI · 互动文游</span>
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <div>
                    <div className="text-[17px] font-semibold leading-tight text-neutral-900">改编为互动文游</div>
                    <p className="mt-1 text-[11px] leading-5 text-neutral-500">让 AI 把这本小说变成你能代入主角的故事</p>
                  </div>
                  <span
                    className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium text-white shadow-[0_8px_20px_-8px_rgba(232,107,90,0.6)]"
                    style={{ background: "var(--gradient-rouge)" }}
                  >
                    立即改编 <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </button>
          </article>
        </div>

        {/* Bottom toolbar — always pinned */}
        <div className="z-20 flex shrink-0 items-center justify-between border-t border-black/5 bg-white px-5 py-3">
          <div className="flex items-center gap-2 rounded-full bg-[#EAF4FF] px-3 py-1.5 text-[12px] text-[#0084FF]">
            <ThumbsUp className="h-3.5 w-3.5" />
            <span className="font-medium">赞同 10.8 万</span>
            <span className="mx-1 h-3 w-px bg-[#0084FF]/30" />
            <ThumbsDown className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center gap-1 text-neutral-500">
            <MessageCircle className="h-5 w-5" />
            <span className="text-[11px]">4.4K</span>
          </div>
        </div>
      </div>
    </PhoneMockup>
  );
}
