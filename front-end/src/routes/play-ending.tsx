/**
 * /play-ending — 真实结局页
 * 从后端获取的 GameResult 渲染
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Share2, RotateCcw, Heart, Trophy, Sparkles } from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";
import sceneBg from "@/assets/ending-bg.jpg";
import { getCharacter } from "@/lib/characters";
import type { GameResult } from "@/lib/game-api";

type EndingSearch = { data?: string };

export const Route = createFileRoute("/play-ending")({
  validateSearch: (s: Record<string, unknown>): EndingSearch => ({
    data: typeof s.data === "string" ? s.data : undefined,
  }),
  component: PlayEndingPage,
  ssr: false,
  head: () => ({
    meta: [
      { title: "结局 · 画堂春" },
      { name: "description", content: "你的画堂春结局" },
    ],
  }),
});

const NAME_MAP: Record<string, string> = {
  peirong: "裴容",
  peiyan: "裴琰",
  peiyu: "裴瑜",
  empress: "皇后",
  mama: "陈嬷嬷",
  wentang: "温棠",
};

function PlayEnding() {
  const navigate = useNavigate();
  const { data } = Route.useSearch();

  let result: GameResult | null = null;
  try {
    result = data ? JSON.parse(data) : null;
  } catch {
    result = null;
  }

  if (!result) {
    return (
      <div className="grid h-full place-items-center bg-[#fbf5ec] text-neutral-600">
        <div className="text-center">
          <p>暂无结局数据</p>
          <button
            onClick={() => navigate({ to: "/play" })}
            className="mt-3 rounded-full bg-[#7a2a2a] px-4 py-2 text-white"
          >
            开始新游戏
          </button>
        </div>
      </div>
    );
  }

  const relationships = Object.entries(result.relationship_graph).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <div className="relative h-full overflow-hidden">
      <img
        src={sceneBg}
        alt=""
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-md"
      />

      <div className="relative z-10 h-full overflow-y-auto px-4 pt-20 pb-8">
        <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[28px] bg-[#fbf5ec] px-6 pt-9 pb-7 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]">
          <div className="pointer-events-none absolute inset-2 rounded-[22px] ring-1 ring-[#7a2a2a]/5" />

          {/* Title */}
          <h1 className="text-center font-brush text-[26px] leading-tight tracking-wide text-[#2b1a14]">
            <span className="text-[#7a2a2a]">【{result.ending_type}】</span>
            {result.ending_title}
          </h1>

          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="h-px w-12 bg-[#7a2a2a]/30" />
            <span className="text-[10px] text-[#7a2a2a]/70">❀</span>
            <span className="h-px w-12 bg-[#7a2a2a]/30" />
          </div>

          {/* Description */}
          <p className="mt-5 text-center text-[14px] leading-[2] text-[#3a2a22]">
            {result.ending_description}
          </p>

          {result.ending_closing && (
            <p className="mt-3 text-center text-[12px] italic text-[#3a2a22]/70">
              {result.ending_closing}
            </p>
          )}

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-[#f3e8d4]/70 py-2.5 text-center">
              <div className="font-brush text-[18px] leading-none text-[#7a2a2a]">
                {result.stats.choices_made}
              </div>
              <div className="mt-1 text-[10px] text-[#3a2a22]/70">选择次数</div>
            </div>
            <div className="rounded-xl bg-[#f3e8d4]/70 py-2.5 text-center">
              <div className="font-brush text-[18px] leading-none text-[#7a2a2a]">
                {result.stats.free_count_used}
              </div>
              <div className="mt-1 text-[10px] text-[#3a2a22]/70">自由对话</div>
            </div>
            <div className="rounded-xl bg-[#f3e8d4]/70 py-2.5 text-center">
              <div className="font-brush text-[18px] leading-none text-[#7a2a2a]">
                {result.stats.flags_unlocked}
              </div>
              <div className="mt-1 text-[10px] text-[#3a2a22]/70">解锁剧情</div>
            </div>
          </div>

          {/* Relationship Graph */}
          {relationships.length > 0 && (
            <div className="mt-5 rounded-xl border border-[#7a2a2a]/15 bg-white/60 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#7a2a2a]">
                <Heart size={12} /> 关系图谱
              </div>
              <div className="mt-3 space-y-2">
                {relationships.map(([roleId, value]) => {
                  const c = getCharacter(roleId);
                  const name = NAME_MAP[roleId] || roleId;
                  return (
                    <div key={roleId} className="flex items-center gap-3">
                      {c && (
                        <img
                          src={c.img}
                          alt={name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-[#2b1a14]">{name}</span>
                          <span className="font-mono text-[11px] text-[#7a2a2a]">
                            {value > 0 ? "+" : ""}
                            {value}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-[#f3e8d4]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#d4a373] to-[#7a2a2a]"
                            style={{ width: `${Math.min(100, Math.max(5, (value + 50)))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Highlights */}
          {result.highlights.length > 0 && (
            <div className="mt-4 rounded-xl border border-[#7a2a2a]/15 bg-white/60 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#7a2a2a]">
                <Trophy size={12} /> 高光时刻
              </div>
              <div className="mt-2 space-y-1.5">
                {result.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12px] text-[#3a2a22]">
                    <Sparkles size={10} className="mt-1 text-[#7a2a2a] flex-shrink-0" />
                    <span>{h.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => navigate({ to: "/play" })}
              className="flex flex-1 items-center justify-center gap-1 rounded-full border border-[#7a2a2a]/40 bg-white py-2.5 text-[12px] text-[#7a2a2a] active:scale-[0.99]"
            >
              <RotateCcw size={13} />
              再玩一次
            </button>
            <button className="flex flex-[1.2] items-center justify-center gap-1.5 rounded-full bg-[#7a2a2a] py-2.5 text-[13px] font-medium text-white shadow-[0_6px_16px_-6px_rgba(122,42,42,0.6)] active:scale-[0.99]">
              <Share2 size={14} />
              分享
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayEndingPage() {
  return (
    <PhoneMockup>
      <PlayEnding />
    </PhoneMockup>
  );
}
