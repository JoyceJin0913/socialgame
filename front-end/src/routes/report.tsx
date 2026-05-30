import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Share2, Sparkles, Trophy, Quote, Heart } from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";
import sceneBg from "@/assets/ending-bg.jpg";
import playerA from "@/assets/player-tingyu.png";
import peiyan from "@/assets/char-peiyan.jpg";
import wentang from "@/assets/char-wentang.jpg";

export const Route = createFileRoute("/report")({
  component: ReportPage,
  head: () => ({
    meta: [
      { title: "亲密关系报告 · 画堂春" },
      { name: "description", content: "和好友一起解锁的剧情结局报告。" },
    ],
  }),
});

function Report() {
  const navigate = useNavigate();
  return (
    <div className="relative h-full overflow-hidden">
      <img src={sceneBg} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover blur-md" />
      <button
        onClick={() => navigate({ to: "/ending" })}
        className="absolute left-4 top-12 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur active:scale-95"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="relative z-10 h-full overflow-y-auto px-4 pt-20 pb-6">
        <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[28px] bg-[#fbf5ec] px-5 pt-7 pb-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]">
          <div className="pointer-events-none absolute inset-2 rounded-[22px] ring-1 ring-[#7a2a2a]/5" />

          {/* header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-1 rounded-full bg-[#7a2a2a]/10 px-2.5 py-0.5 text-[10px] text-[#7a2a2a]">
              <Sparkles size={10} /> 亲密关系报告
            </div>
            <h1 className="mt-2 font-brush text-[24px] tracking-wide text-[#2b1a14]">
              《画堂春》
            </h1>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="h-px w-10 bg-[#7a2a2a]/30" />
              <span className="text-[10px] text-[#7a2a2a]/70">❀</span>
              <span className="h-px w-10 bg-[#7a2a2a]/30" />
            </div>
          </div>

          {/* duo */}
          <div className="mt-5 flex items-center justify-center gap-3">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-[#d4a373] to-[#7a2a2a]" />
                <img src={playerA} alt="听雨" className="relative h-16 w-16 rounded-full object-cover" />
              </div>
              <div className="mt-1.5 text-[11px] font-medium text-[#2b1a14]">知乎 · 听雨</div>
              <div className="mt-1 flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5">
                <img src={peiyan} alt="" className="h-3 w-3 rounded-full object-cover" />
                <span className="text-[9px] text-[#7a2a2a]">饰 裴琰</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <Heart size={18} className="text-[#7a2a2a]" fill="#7a2a2a" />
              <div className="mt-1 font-brush text-[18px] leading-none text-[#7a2a2a]">95%</div>
              <div className="text-[9px] text-[#3a2a22]/60">羁绊值</div>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-[#d4a373] to-[#7a2a2a]" />
                <img src={wentang} alt="温棠" className="relative h-16 w-16 rounded-full object-cover" />
              </div>
              <div className="mt-1.5 text-[11px] font-medium text-[#2b1a14]">知乎 · 棠梨煎雪</div>
              <div className="mt-1 flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5">
                <img src={wentang} alt="" className="h-3 w-3 rounded-full object-cover" />
                <span className="text-[9px] text-[#7a2a2a]">饰 温棠</span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-[12px] leading-[1.8] text-[#3a2a22]">
            <span className="font-medium text-[#7a2a2a]">听雨</span> 和{" "}
            <span className="font-medium text-[#7a2a2a]">棠梨煎雪</span> 在《画堂春》中
            <br />
            分别扮演了 <span className="text-[#7a2a2a]">裴琰</span> 与{" "}
            <span className="text-[#7a2a2a]">温棠</span>
          </p>

          {/* stats */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-[#f3e8d4]/70 py-2.5 text-center">
              <div className="font-brush text-[18px] leading-none text-[#7a2a2a]">7</div>
              <div className="mt-1 text-[10px] text-[#3a2a22]/70">解锁剧情</div>
            </div>
            <div className="rounded-xl bg-[#f3e8d4]/70 py-2.5 text-center">
              <div className="font-brush text-[14px] leading-none text-[#7a2a2a]">圆满</div>
              <div className="mt-1 text-[10px] text-[#3a2a22]/70">达成结局</div>
            </div>
            <div className="rounded-xl bg-[#f3e8d4]/70 py-2.5 text-center">
              <div className="font-brush text-[18px] leading-none text-[#7a2a2a]">3</div>
              <div className="mt-1 text-[10px] text-[#3a2a22]/70">隐藏成就</div>
            </div>
          </div>

          {/* achievements */}
          <div className="mt-4 rounded-xl border border-[#7a2a2a]/15 bg-white/60 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#7a2a2a]">
              <Trophy size={12} /> 共同成就
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["画堂知己", "雪夜执手", "认母圆满"].map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-gradient-to-r from-[#d4a373]/30 to-[#7a2a2a]/15 px-2.5 py-0.5 text-[10px] text-[#7a2a2a]"
                >
                  ✦ {t}
                </span>
              ))}
            </div>
          </div>

          {/* highlight moment */}
          <div className="mt-3 rounded-xl border border-[#7a2a2a]/15 bg-white/60 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#7a2a2a]">
              <Sparkles size={12} /> 高光时刻
            </div>
            <p className="mt-1.5 text-[12px] leading-[1.7] text-[#3a2a22]">
              冷殿春寒，画堂酥未化。少年三皇子在风雪中接过那盒糕点，红着眼眶应了一声"姐姐"——
              这一刻，宿命的齿轮悄然啮合。
            </p>
          </div>

          {/* highlight quote */}
          <div className="mt-3 rounded-xl bg-[#7a2a2a]/8 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#7a2a2a]">
              <Quote size={12} /> 高光发言
            </div>
            <p className="mt-1.5 font-brush text-[14px] leading-[1.8] text-[#2b1a14]">
              "若有一日山河崩，我执剑为你守这画堂春。"
            </p>
            <p className="mt-1 text-right text-[10px] text-[#3a2a22]/60">—— 听雨 饰 裴琰</p>
          </div>

          {/* CTA */}
          <p className="mt-4 text-center text-[12px] text-[#7a2a2a]">
            赶紧叫上你的好友，一起来玩吧 ✦
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => navigate({ to: "/lobby" })}
              className="flex-1 rounded-full border border-[#7a2a2a]/40 bg-white py-2.5 text-[12px] text-[#7a2a2a] active:scale-[0.99]"
            >
              再开一局
            </button>
            <button className="flex flex-[1.2] items-center justify-center gap-1.5 rounded-full bg-[#7a2a2a] py-2.5 text-[13px] font-medium text-white shadow-[0_6px_16px_-6px_rgba(122,42,42,0.6)] active:scale-[0.99]">
              <Share2 size={14} />
              转发分享
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportPage() {
  return (
    <PhoneMockup>
      <Report />
    </PhoneMockup>
  );
}
