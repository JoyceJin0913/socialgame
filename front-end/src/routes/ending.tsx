import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Share2, RotateCcw, ChevronLeft, Heart, Search } from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";
import sceneBg from "@/assets/ending-bg.jpg";
import playerAvatar from "@/assets/player-tingyu.png";
import { getCharacter } from "@/lib/characters";

export const Route = createFileRoute("/ending")({
  component: EndingPage,
  head: () => ({
    meta: [
      { title: "圆满结局 · 后宫净土" },
      { name: "description", content: "采桑宫成为后宫净土，圆满结局。" },
    ],
  }),
});

const PLAYER_ID = "wentang";

// 与主角的关系数据
const RELATIONS: Record<string, { desc: string; intimacy: number; clues: number; tag: string }> = {
  peiyan: { desc: "宫中知己，互为依靠的少年与贵妃。", intimacy: 95, clues: 12, tag: "知己" },
  peiyu: { desc: "表面恭敬，暗藏机锋的君臣之谊。", intimacy: 62, clues: 7, tag: "认母成功" },
  mama: { desc: "自幼相伴，唯一可以托付秘密的人。", intimacy: 99, clues: 9, tag: "心腹" },
  empress: { desc: "凤位之下，宫规之内的微妙制衡。", intimacy: 48, clues: 5, tag: "母仪天下" },
  peirong: { desc: "君妃名分，恩宠与猜忌并存。", intimacy: 70, clues: 8, tag: "勤政爱民" },
};

const OTHERS = ["peiyan", "peiyu", "mama", "empress", "peirong"];



function Ending() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>("peiyan");
  const player = getCharacter(PLAYER_ID);
  const target = getCharacter(selected);
  const rel = RELATIONS[selected];

  return (
    <div className="relative h-full overflow-hidden">
      {/* background */}
      <img
        src={sceneBg}
        alt=""
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-md"
      />

      {/* back */}
      <button
        onClick={() => navigate({ to: "/scene" })}
        className="absolute left-4 top-12 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur active:scale-95"
      >
        <ChevronLeft size={18} />
      </button>

      {/* main scroll */}
      <div className="relative z-10 h-full overflow-y-auto px-4 pt-32 pb-8">
        {/* paper card */}
        <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[28px] bg-[#fbf5ec] px-6 pt-9 pb-7 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]">
          {/* subtle inner border */}
          <div className="pointer-events-none absolute inset-2 rounded-[22px] ring-1 ring-[#7a2a2a]/5" />

          {/* title */}
          <h1 className="text-center font-brush text-[26px] leading-tight tracking-wide text-[#2b1a14]">
            <span className="text-[#7a2a2a]">【圆满结局】</span>后宫净土
          </h1>

          {/* divider */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="h-px w-12 bg-[#7a2a2a]/30" />
            <span className="text-[10px] text-[#7a2a2a]/70">❀</span>
            <span className="h-px w-12 bg-[#7a2a2a]/30" />
          </div>

          {/* body */}
          <p className="mt-5 text-center text-[14px] leading-[2] text-[#3a2a22]">
            温棠封妃，裴琰健康成长，<br />
            瑜儿终认生母，<br />
            采桑宫成为后宫净土。
          </p>

          {/* hairline */}
          <div className="mx-auto mt-6 h-px w-full bg-[#7a2a2a]/10" />

          {/* relationship graph */}
          <div className="mt-6 flex flex-col items-center">
            {/* player avatar (large) */}
            <div className="relative">
              <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-[#d4a373] to-[#7a2a2a]" />
              <img
                src={player?.img}
                alt={player?.name}
                className="relative h-20 w-20 rounded-full object-cover"
              />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#7a2a2a] px-2 py-[2px] text-[9px] leading-none text-white">
                我 · {player?.name}
              </div>
            </div>

            {/* connector */}
            <div className="my-4 flex w-full items-center justify-center">
              <span className="h-px flex-1 bg-[#7a2a2a]/15" />
              <span className="mx-2 rounded-full border border-[#7a2a2a]/30 bg-[#fbf5ec] px-2 py-[2px] text-[10px] text-[#7a2a2a]">
                {rel?.tag ?? "关系"}
              </span>
              <span className="h-px flex-1 bg-[#7a2a2a]/15" />
            </div>

            {/* others row */}
            <div className="grid w-full grid-cols-5 gap-1">
              {OTHERS.map((id) => {
                const ch = getCharacter(id);
                const active = id === selected;
                return (
                  <button
                    key={id}
                    onClick={() => setSelected(id)}
                    className="flex flex-col items-center gap-1 active:scale-95"
                  >
                    <div className="relative">
                      <div
                        className={`absolute -inset-[2px] rounded-full ${
                          active
                            ? "bg-gradient-to-br from-[#d4a373] to-[#7a2a2a]"
                            : "bg-[#7a2a2a]/15"
                        }`}
                      />
                      <img
                        src={ch?.img}
                        alt={ch?.name}
                        className={`relative h-12 w-12 rounded-full object-cover transition ${
                          active ? "" : "opacity-70 grayscale-[40%]"
                        }`}
                      />
                    </div>
                    <div
                      className={`text-[11px] ${
                        active ? "font-medium text-[#7a2a2a]" : "text-[#3a2a22]/70"
                      }`}
                    >
                      {ch?.name}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* relation info */}
            <div className="mt-4 w-full rounded-xl bg-[#f3e8d4]/70 p-3">
              <p className="text-center text-[12px] leading-[1.7] text-[#3a2a22]">
                {rel?.desc}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center justify-center gap-1.5 rounded-lg bg-white/70 py-2">
                  <Heart size={12} className="text-[#7a2a2a]" />
                  <span className="text-[10px] text-[#3a2a22]/70">亲密度</span>
                  <span className="font-brush text-[16px] leading-none text-[#7a2a2a]">
                    {rel?.intimacy}
                    <span className="text-[10px]">%</span>
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1.5 rounded-lg bg-white/70 py-2">
                  <Search size={12} className="text-[#7a2a2a]" />
                  <span className="text-[10px] text-[#3a2a22]/70">线索</span>
                  <span className="font-brush text-[16px] leading-none text-[#7a2a2a]">
                    {rel?.clues}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* real player module - only for peiyan */}
          {selected === "peiyan" && (
            <div className="mt-4 rounded-xl border border-[#7a2a2a]/15 bg-white/60 p-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-[2px] rounded-full bg-gradient-to-br from-[#d4a373] to-[#7a2a2a]" />
                  <img
                    src={playerAvatar}
                    alt="真人玩家"
                    className="relative h-10 w-10 rounded-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[#3a2a22]/60">扮演者</div>
                  <div className="text-[13px] font-medium text-[#2b1a14] truncate">真人玩家 · 听雨</div>
                  <div className="text-[10px] text-[#3a2a22]/60">ID: 88231 · 已扮演 3 场</div>
                </div>
                <button
                  onClick={() => navigate({ to: "/report" })}
                  className="shrink-0 rounded-full bg-[#7a2a2a]/10 px-3 py-1.5 text-[11px] text-[#7a2a2a] active:scale-95"
                >
                  亲密关系报告 →
                </button>
              </div>
            </div>
          )}

          {/* buttons */}
          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={() => navigate({ to: "/lobby" })}
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

function EndingPage() {
  return (
    <PhoneMockup>
      <Ending />
    </PhoneMockup>
  );
}
