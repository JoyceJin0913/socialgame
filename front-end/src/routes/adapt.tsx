import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Sparkles, Check, Loader2, Wand2 } from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";
import heroImg from "@/assets/hero-huatangchun.jpg";

export const Route = createFileRoute("/adapt")({
  component: AdaptPage,
  head: () => ({
    meta: [{ title: "改编工作台 · 画堂春" }],
  }),
});

const STEPS = [
  { label: "解析小说章节结构", detail: "提取 6 个关键场景" },
  { label: "拆解人物关系网", detail: "温棠 · 裴容 · 裴琰 · 裴瑜 · 皇后 · 陈嬷嬷" },
  { label: "构建世界观与时间线", detail: "大梁开元年间 · 采桑宫" },
  { label: "生成可代入角色卡", detail: "6 位可玩角色档案" },
  { label: "铺设分支剧情与结局", detail: "AI 实时改编中" },
  { label: "完成互动文游打包", detail: "《画堂春》已就绪" },
];

function AdaptPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (step >= STEPS.length) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 600 : 900);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <PhoneMockup>
      <div className="relative h-full overflow-y-auto bg-[#0d0b14] pb-10 no-scrollbar">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between bg-gradient-to-b from-[#0d0b14] to-transparent px-4 pb-3 pt-12">
          <button
            onClick={() => navigate({ to: "/novel" })}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 backdrop-blur-md"
            aria-label="返回"
          >
            <ChevronLeft className="h-4 w-4 text-white" />
          </button>
          <div className="text-[14px] tracking-[0.3em] text-white/80">AI 改编工作台</div>
          <div className="h-9 w-9" />
        </header>

        {/* Hero cover with shimmer */}
        <section className="px-5">
          <div className="relative overflow-hidden rounded-3xl">
            <img src={heroImg} alt="画堂春" className="h-[200px] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b14] via-[#0d0b14]/30 to-transparent" />
            {!done && (
              <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2.4s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            )}
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="flex items-center gap-1.5 text-white/80">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-[10px] tracking-[0.3em]">知乎 · 盐言 AI</span>
              </div>
              <h1 className="font-brush text-3xl text-white drop-shadow">画堂春 · 改编中</h1>
            </div>
          </div>
        </section>

        {/* Progress steps */}
        <section className="mt-6 px-5">
          <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Wand2 className="h-4 w-4" style={{ color: "var(--gold)" }} />
                <span className="text-[13px] font-medium">改编进度</span>
              </div>
              <span className="text-[11px] text-white/50">
                {Math.min(step, STEPS.length)} / {STEPS.length}
              </span>
            </div>

            <ul className="space-y-3.5">
              {STEPS.map((s, i) => {
                const state = i < step ? "done" : i === step ? "active" : "todo";
                return (
                  <li key={s.label} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full transition ${
                        state === "done"
                          ? "bg-[color:var(--gold)] text-neutral-900"
                          : state === "active"
                          ? "bg-white/10 text-white"
                          : "bg-white/5 text-white/30"
                      }`}
                    >
                      {state === "done" ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : state === "active" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span className="text-[10px]">{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-[13px] ${
                          state === "todo" ? "text-white/40" : "text-white"
                        }`}
                      >
                        {s.label}
                      </div>
                      <div className="mt-0.5 text-[11px] text-white/40">{s.detail}</div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Progress bar */}
            <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${(Math.min(step, STEPS.length) / STEPS.length) * 100}%`,
                  background: "var(--gradient-rouge)",
                }}
              />
            </div>
          </div>
        </section>

        {/* CTA after done */}
        <section className="mt-6 px-5">
          {done ? (
            <button
              onClick={() => navigate({ to: "/adapt-preview" })}
              className="group block w-full overflow-hidden rounded-2xl text-left shadow-[0_18px_40px_-12px_rgba(232,107,90,0.5)] active:scale-[0.99] transition"
              style={{ background: "var(--gradient-rouge)" }}
            >
              <div className="flex items-center justify-between px-5 py-4 text-white">
                <div>
                  <div className="text-[10px] tracking-[0.3em] text-white/80">改编完成</div>
                  <div className="mt-1 text-[16px] font-semibold">查看互动文游</div>
                </div>
                <span className="rounded-full bg-white/15 px-4 py-1.5 text-[12px] backdrop-blur-md">
                  查看 →
                </span>
              </div>
            </button>
          ) : (
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 text-center text-[12px] text-white/50">
              AI 正在为你重新雕琢这本书……
            </div>
          )}
        </section>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </PhoneMockup>
  );
}
