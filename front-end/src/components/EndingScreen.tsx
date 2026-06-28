/**
 * EndingScreen · 结局展示（朱墨信笺风，参考 /ending 的 UI）
 */

import { useState } from "react";
import {
  RotateCcw,
  Search,
  Target,
  ScrollText,
  Heart,
  Trophy,
  Quote,
  X,
} from "lucide-react";
import type { EndingConfig } from "@/lib/story";
import {
  LINE_NAME,
  type NumericsState,
  type EndingDecision,
  type LineKey,
} from "@/lib/numerics";
import sceneBg from "@/assets/ending-bg.jpg";
import playerAvatar from "@/assets/player-tingyu.png";
import { BGMPlayer } from "@/components/BGMPlayer";
import { getCharacter } from "@/lib/characters";

interface Props {
  ending: EndingConfig;
  onRestart: () => void;
  numerics?: NumericsState;
  decision?: EndingDecision | null;
  hookCount?: number;
}

const LABEL: Record<keyof NumericsState, string> = {
  trust: "信任", courage: "勇气", ration: "理智", inner: "内在",
  publicSym: "民意", family: "家族", hidden: "隐蔽", intel: "情报",
  ally: "盟友", expose: "暴露", endure: "隐忍", danger: "风险",
};

/* ===== 以下为写死的展示数据（搬自 /ending） ===== */

const PLAYER_ID = "hanyan";

// 与庄寒雁的关系
const RELATIONS: Record<
  string,
  { desc: string; intimacy: number; clues: number; tag: string }
> = {
  moshen: {
    desc: "钻狗洞那日的惊鸿一瞥，从此一生一世一双人。",
    intimacy: 98,
    clues: 14,
    tag: "一生一世",
  },
  zhouyi: {
    desc: "笑里藏刀的继母，终被亲手送进牢狱。",
    intimacy: 8,
    clues: 11,
    tag: "宿敌伏法",
  },
  zhuangsy: {
    desc: "凉薄寡情的父亲，迟来的悔意已无人在意。",
    intimacy: 32,
    clues: 7,
    tag: "形同陌路",
  },
  yushan: {
    desc: "假姐妹反目，她游街疯死，尘归尘土归土。",
    intimacy: 5,
    clues: 9,
    tag: "因果自负",
  },
};

// 亲密关系报告（按角色）
type IntimacyReport = {
  partnerNick: string; // 对方玩家昵称
  partnerRole: string; // 对方扮演角色名（= 角色名）
  bond: number; // 羁绊值
  bondLabel: string; // 羁绊关系
  unlocked: number; // 解锁剧情
  ending: string; // 达成结局
  hidden: number; // 隐藏成就
  achievements: string[];
  moment: string; // 高光时刻
  quote: string; // 高光发言
  quoteFrom: string; // 发言来源
};

const REPORTS: Record<string, IntimacyReport> = {
  moshen: {
    partnerNick: "墙外有故人",
    partnerRole: "傅云夕",
    bond: 98,
    bondLabel: "一生一世",
    unlocked: 9,
    ending: "凤凰归位",
    hidden: 4,
    achievements: ["狗洞之缘", "雪夜递伞", "十里红妆"],
    moment:
      "庄府西墙下，她从狗洞里钻出来拍裙摆，抬头撞上他含笑的眼。那一刻，他叼着的草梗轻轻一颤——这京里高门贵女他见得太多，唯独没见过会钻狗洞的姑娘。",
    quote: "「庄府上的丫头真奇怪，放着好好的大门不走，偏爱钻狗洞。」",
    quoteFrom: "墙外有故人 饰 傅云夕",
  },
  zhouyi: {
    partnerNick: "桃花酿三两",
    partnerRole: "周氏",
    bond: 8,
    bondLabel: "宿敌伏法",
    unlocked: 8,
    ending: "周氏入狱",
    hidden: 2,
    achievements: ["识破伪善", "灵堂对峙", "夺回中馈"],
    moment:
      "她一身桃色衣裙踏进庄府灵堂，本以为三言两语就能拿捏这个新丧母的小姑娘。却被庄寒雁一句「母亲尸骨未寒」逼得当场失了颜色，连鬓边那支红宝石都晃得刺眼。",
    quote: "「妾身也是心疼雁姐儿，这孩子就是心善。」",
    quoteFrom: "桃花酿三两 饰 周氏",
  },
  zhuangsy: {
    partnerNick: "侯门一盏灯",
    partnerRole: "庄仕洋",
    bond: 32,
    bondLabel: "形同陌路",
    unlocked: 6,
    ending: "迟来悔意",
    hidden: 1,
    achievements: ["针锋相对", "夺回弟弟", "父女离心"],
    moment:
      "他一拍桌子说「这里没你说话的地步」，却没料到嫡女抬眼回看，那双眼睛冷得像她母亲临终前的样子。多年以后他才明白，那一刻他失去的不止是一个女儿。",
    quote: "「这里没你说话的地步。」",
    quoteFrom: "侯门一盏灯 饰 庄仕洋",
  },
  yushan: {
    partnerNick: "桃枝压新雪",
    partnerRole: "庄语山",
    bond: 5,
    bondLabel: "因果自负",
    unlocked: 7,
    ending: "游街疯死",
    hidden: 2,
    achievements: ["香粉破绽", "假千金现形", "众目睽睽"],
    moment:
      "她穿着母亲精挑的桃色衣裳进府，本以为这把千金交椅手到擒来。却被寒雁一句「这香粉味儿，倒像是青楼里熏出来的」当众戳破，跪也不是、笑也不是。",
    quote: "「总有一天，这府里千金的位置，会是我庄语山的。」",
    quoteFrom: "桃枝压新雪 饰 庄语山",
  },
};

const OTHERS = ["moshen"];

export function EndingScreen({
  ending,
  onRestart,
  numerics,
  decision,
  hookCount = 0,
}: Props) {
  const [selected, setSelected] = useState<string>("moshen");
  const [showReport, setShowReport] = useState(false);
  const player = getCharacter(PLAYER_ID);
  const target = getCharacter(selected);
  const rel = RELATIONS[selected];
  const report = REPORTS[selected];

  return (
    <div className="relative h-full overflow-hidden">
      {/* background */}
      <img
        src={sceneBg}
        alt=""
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-md"
      />
      <div className="absolute inset-0 bg-black/25" />
      <BGMPlayer />

      {/* main scroll */}
      <div className="relative z-10 h-full overflow-y-auto px-4 pt-16 pb-8">
        {/* paper card */}
        <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[28px] bg-[#fbf5ec] px-6 pt-9 pb-7 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]">
          {/* subtle inner border */}
          <div className="pointer-events-none absolute inset-2 rounded-[22px] ring-1 ring-[#7a2a2a]/5" />

          {/* title */}
          <h1 className="mt-2 text-center font-brush text-[28px] leading-tight tracking-wide text-[#2b1a14]">
            <span className="text-[#7a2a2a]">【结局】</span>
            {ending.title}
          </h1>

          {/* divider */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="h-px w-12 bg-[#7a2a2a]/30" />
            <span className="text-[10px] text-[#7a2a2a]/70">❀</span>
            <span className="h-px w-12 bg-[#7a2a2a]/30" />
          </div>

          {/* body */}
          <div className="mt-5 space-y-3 text-[14px] leading-[2] text-[#3a2a22]">
            {ending.desc.map((p, i) => (
              <p key={i} className="text-justify indent-[2em]">
                {p}
              </p>
            ))}
          </div>

          {/* closing 题跋 */}
          {ending.closing && (
            <p className="mt-5 text-right font-brush text-[15px] tracking-wide text-[#7a2a2a]">
              {ending.closing}
            </p>
          )}

          {/* hairline */}
          <div className="mx-auto mt-6 h-px w-full bg-[#7a2a2a]/10" />

          {/* relationship graph（写死） */}
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
            <div className="grid w-full grid-cols-4 gap-2">
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
                <button
                  onClick={() => setShowReport(true)}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-white/70 py-2 transition active:scale-95 hover:bg-white"
                >
                  <Heart size={12} className="text-[#7a2a2a]" />
                  <span className="text-[10px] text-[#3a2a22]/70">亲密度</span>
                  <span className="font-brush text-[16px] leading-none text-[#7a2a2a]">
                    {rel?.intimacy}
                    <span className="text-[10px]">%</span>
                  </span>
                  <span className="ml-0.5 text-[9px] text-[#7a2a2a]/70">›</span>
                </button>

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

          {/* real player module - only for moshen（写死） */}
          {selected === "moshen" && (
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
                  <div className="text-[13px] font-medium text-[#2b1a14] truncate">
                    真人玩家 · 听雨
                  </div>
                  <div className="text-[10px] text-[#3a2a22]/60">
                    ID: 88231 · 已扮演 3 场
                  </div>
                </div>
                <button
                  onClick={() => setShowReport(true)}
                  className="shrink-0 rounded-full bg-[#7a2a2a]/10 px-3 py-1.5 text-[11px] text-[#7a2a2a] active:scale-95"
                >
                  亲密关系报告 →
                </button>
              </div>
            </div>
          )}

          {/* 数值终局（暂时隐藏，内容保留） */}
          {false && numerics ? (
            <div className="mt-5 rounded-xl border border-[#7a2a2a]/15 bg-white/60 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#7a2a2a]">
                <ScrollText size={12} /> 数值终局
              </div>
              <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 text-[11px]">
                {(Object.keys(numerics!) as (keyof NumericsState)[]).map((k) => {
                  const v = numerics![k];
                  const tone =
                    v >= 70
                      ? "text-[#3f7a4a]"
                      : v >= 40
                        ? "text-[#7a2a2a]"
                        : "text-[#b06a45]";
                  return (
                    <div key={k} className="flex justify-between">
                      <span className="text-[#3a2a22]/55">{LABEL[k]}</span>
                      <b className={`font-mono ${tone}`}>{v}</b>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* 结局依据（暂时隐藏，内容保留） */}
          {false && decision ? (
            <div className="mt-3 rounded-xl border border-[#7a2a2a]/15 bg-white/60 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#7a2a2a]">
                <Target size={12} /> 结局依据 · 你的选择
              </div>

              {/* 三条心意线的票数 */}
              <div className="mt-3 flex gap-2">
                {(Object.keys(decision!.lines) as LineKey[]).map((k) => {
                  const top =
                    decision!.lines[k] ===
                    Math.max(...Object.values(decision!.lines));
                  const hasVote = decision!.lines[k] > 0;
                  return (
                    <div
                      key={k}
                      className={`flex-1 rounded-lg px-2 py-1.5 text-center ${
                        top && hasVote
                          ? "bg-gradient-to-b from-[#d4a373]/30 to-[#7a2a2a]/15 ring-1 ring-[#7a2a2a]/30"
                          : "bg-[#f3e8d4]/70"
                      }`}
                    >
                      <div className="text-[#3a2a22]/55">{LINE_NAME[k]}</div>
                      <b className="font-mono text-[#7a2a2a]">
                        {decision!.lines[k]} 票
                      </b>
                    </div>
                  );
                })}
              </div>

              {/* 逐幕选择回顾 */}
              {decision!.picks.length > 0 && (
                <div className="mt-3 space-y-1 text-[11px]">
                  {decision!.picks.map((p, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-[#3a2a22]/60">第 {i + 1} 次抉择</span>
                      <span className="text-[#2b1a14]">
                        {p.label}
                        <span className="ml-1 text-[#7a2a2a]/60">
                          · {LINE_NAME[p.line]}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 border-t border-[#7a2a2a]/10 pt-2 text-[11px] italic leading-relaxed text-[#3a2a22]/85">
                {decision!.reason}
              </div>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-[#3a2a22]/45">
                <Search size={10} /> 累积 hook 次数：{hookCount}
              </div>
            </div>
          ) : null}

          {/* 再玩一次 */}
          <div className="mt-5">
            <button
              onClick={onRestart}
              className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[#7a2a2a]/40 bg-white py-2.5 text-[12px] tracking-[0.15em] text-[#7a2a2a] transition active:scale-[0.99] hover:bg-[#fbf5ec]"
            >
              <RotateCcw size={13} />
              再玩一次
            </button>
          </div>
        </div>
      </div>

      {/* 亲密关系报告 overlay（写死） */}
      {showReport && report && (
        <div className="absolute inset-0 z-30 animate-in fade-in duration-200">
          <img
            src={sceneBg}
            alt=""
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-md"
          />
          <div className="absolute inset-0 bg-black/30" />

          <button
            onClick={() => setShowReport(false)}
            className="absolute left-4 top-12 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur active:scale-95"
          >
            <X size={18} />
          </button>

          <div className="relative z-10 h-full overflow-y-auto px-4 pt-16 pb-6">
            <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[28px] bg-[#fbf5ec] px-5 pt-7 pb-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]">
              <div className="pointer-events-none absolute inset-2 rounded-[22px] ring-1 ring-[#7a2a2a]/5" />

              {/* header */}
              <div className="text-center">
                <div className="inline-flex items-center gap-1 rounded-full bg-[#7a2a2a]/10 px-2.5 py-0.5 text-[10px] text-[#7a2a2a]">
                  <Sparkles size={10} /> 亲密关系报告
                </div>
                <h1 className="mt-2 font-brush text-[24px] tracking-wide text-[#2b1a14]">
                  《重生之贵女难求》
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
                    <img
                      src={playerAvatar}
                      alt="听雨"
                      className="relative h-16 w-16 rounded-full object-cover"
                    />
                  </div>
                  <div className="mt-1.5 text-[11px] font-medium text-[#2b1a14]">
                    听雨
                  </div>
                  <div className="mt-1 flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5">
                    <img
                      src={player?.img}
                      alt=""
                      className="h-3 w-3 rounded-full object-cover"
                    />
                    <span className="text-[9px] text-[#7a2a2a]">
                      饰 {player?.name}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <Heart size={18} className="text-[#7a2a2a]" fill="#7a2a2a" />
                  <div className="mt-1 font-brush text-[18px] leading-none text-[#7a2a2a]">
                    {report.bond}%
                  </div>
                  <div className="text-[9px] text-[#3a2a22]/60">羁绊值</div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-[#d4a373] to-[#7a2a2a]" />
                    <img
                      src={target?.img}
                      alt={target?.name}
                      className="relative h-16 w-16 rounded-full object-cover"
                    />
                  </div>
                  <div className="mt-1.5 text-[11px] font-medium text-[#2b1a14]">
                    {report.partnerNick}
                  </div>
                  <div className="mt-1 flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5">
                    <img
                      src={target?.img}
                      alt=""
                      className="h-3 w-3 rounded-full object-cover"
                    />
                    <span className="text-[9px] text-[#7a2a2a]">
                      饰 {report.partnerRole}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center text-[12px] leading-[1.8] text-[#3a2a22]">
                <span className="font-medium text-[#7a2a2a]">听雨</span> 和{" "}
                <span className="font-medium text-[#7a2a2a]">
                  {report.partnerNick}
                </span>{" "}
                在《重生之贵女难求》中
                <br />
                分别扮演了{" "}
                <span className="text-[#7a2a2a]">{player?.name}</span> 与{" "}
                <span className="text-[#7a2a2a]">{report.partnerRole}</span>
              </p>

              {/* stats */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-[#f3e8d4]/70 py-2.5 text-center">
                  <div className="font-brush text-[18px] leading-none text-[#7a2a2a]">
                    {report.unlocked}
                  </div>
                  <div className="mt-1 text-[10px] text-[#3a2a22]/70">解锁剧情</div>
                </div>
                <div className="rounded-xl bg-[#f3e8d4]/70 py-2.5 text-center">
                  <div className="font-brush text-[14px] leading-none text-[#7a2a2a]">
                    {report.ending}
                  </div>
                  <div className="mt-1 text-[10px] text-[#3a2a22]/70">达成结局</div>
                </div>
                <div className="rounded-xl bg-[#f3e8d4]/70 py-2.5 text-center">
                  <div className="font-brush text-[18px] leading-none text-[#7a2a2a]">
                    {report.hidden}
                  </div>
                  <div className="mt-1 text-[10px] text-[#3a2a22]/70">隐藏成就</div>
                </div>
              </div>

              {/* achievements */}
              <div className="mt-4 rounded-xl border border-[#7a2a2a]/15 bg-white/60 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#7a2a2a]">
                  <Trophy size={12} /> 共同成就
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {report.achievements.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-gradient-to-r from-[#d4a373]/30 to-[#7a2a2a]/15 px-2.5 py-0.5 text-[10px] text-[#7a2a2a]"
                    >
                      ✦ {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* moment */}
              <div className="mt-3 rounded-xl border border-[#7a2a2a]/15 bg-white/60 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#7a2a2a]">
                  <Sparkles size={12} /> 高光时刻
                </div>
                <p className="mt-1.5 text-[12px] leading-[1.7] text-[#3a2a22]">
                  {report.moment}
                </p>
              </div>

              {/* quote */}
              <div className="mt-3 rounded-xl bg-[#7a2a2a]/[0.08] p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#7a2a2a]">
                  <Quote size={12} /> 高光发言
                </div>
                <p className="mt-1.5 font-brush text-[14px] leading-[1.8] text-[#2b1a14]">
                  {report.quote}
                </p>
                <p className="mt-1 text-right text-[10px] text-[#3a2a22]/60">
                  —— {report.quoteFrom}
                </p>
              </div>

              <p className="mt-4 text-center text-[12px] text-[#7a2a2a]">
                赶紧叫上你的好友，一起来玩吧 ✦
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => setShowReport(false)}
                  className="flex-1 rounded-full border border-[#7a2a2a]/40 bg-white py-2.5 text-[12px] text-[#7a2a2a] active:scale-[0.99]"
                >
                  返回结局
                </button>
                <button className="flex flex-[1.2] items-center justify-center gap-1.5 rounded-full bg-[#7a2a2a] py-2.5 text-[13px] font-medium text-white shadow-[0_6px_16px_-6px_rgba(122,42,42,0.6)] active:scale-[0.99]">
                  转发分享
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
