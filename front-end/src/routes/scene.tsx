import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, MoreHorizontal, Send, Sparkles, Mic, BookOpen, Feather, Lightbulb, Volume2, Asterisk, Clock, X, UserPlus, Check, ScrollText, Eye, EyeOff, Lock, History, Gauge, Heart, Eye as EyeIcon, MessageCircle, Swords, Brain, Crown } from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";
import sceneBg from "@/assets/scene-cijitang.png";
import actorAvatar from "@/assets/actor-avatar.png";
import { CHARACTERS, getCharacter } from "@/lib/characters";

export const Route = createFileRoute("/scene")({
  component: ScenePage,
  head: () => ({
    meta: [
      { title: "第一幕 · 画堂春" },
      { name: "description", content: "入梦画堂，开启你的角色对话。" },
    ],
  }),
});

type Msg =
  | { kind: "narration"; text: string }
  | { kind: "dialog"; charId: string; text: string }
  | { kind: "action"; charId: string; text: string }
  | { kind: "prompt"; text: string }
  | { kind: "me"; text: string; mode: "say" | "do" }
  | { kind: "reward"; affinities: { charId: string; delta: number }[]; unlock?: string }
  | { kind: "notice"; text: string };

const INITIAL: Msg[] = [
  {
    kind: "narration",
    text: "母亲新丧，庄寒雁一觉醒来，竟回到了十三岁那年。窗外阴云未散，府里却已是另一番热闹——周氏带着庄语山，正抬着箱笼，浩浩荡荡地踏进庄府大门。",
  },
  { kind: "dialog", charId: "zhouyi", text: "雁姐儿，姨娘以后就是你母亲了，往后咱们一家人，可要好好亲香。" },
  { kind: "dialog", charId: "zhuangsy", text: "寒雁，你母亲走了，府里以后由周氏打理，你这做姐姐的，要懂事。" },
  { kind: "prompt", text: "听到这番话，你心里……" },
];

const ACTORS: Record<string, string> = {
  zhuangsy: "@玄夜听雪",
  moshen: "@少年执灯人",
  yushan: "@玉折",
  zhouyi: "@凤栖梧",
  hanyan: "@沐雨",
};

// 区分 AI Agent 与真人玩家
const IS_HUMAN: Record<string, boolean> = {
  hanyan: true,
  zhuangsy: true,
  moshen: true,
  // 其余角色默认 AI
};

function ActorTag({ human }: { human: boolean }) {
  if (human) return null;
  return (
    <span className="mt-1 inline-flex items-center justify-center rounded-full border border-sky-300/40 bg-sky-500/15 px-1.5 py-[1px] text-[8px] leading-none tracking-wider text-sky-100 backdrop-blur-md">
      AI
    </span>
  );
}

export function Scene() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [input, setInput] = useState("");
  const [pickedPromptIdx, setPickedPromptIdx] = useState<number | null>(null);
  const [panelCharId, setPanelCharId] = useState<string | null>(null);
  const [secretOpen, setSecretOpen] = useState(true);
  const [secretRevealed, setSecretRevealed] = useState(false);
  const [recapOpen, setRecapOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 剩余时间：单人无限制，双人/多人每幕 ≤ 20 分钟
  const mode = "multi" as "solo" | "multi";
  const ACT_SECONDS = 20 * 60;
  const [remaining, setRemaining] = useState(ACT_SECONDS);
  useEffect(() => {
    if (mode === "solo") return;
    const t = setInterval(() => setRemaining((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [mode]);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const lowTime = mode !== "solo" && remaining <= 60;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Detect action mode from `（…）` wrapping
  const detectMode = (raw: string): { mode: "say" | "do"; text: string } => {
    const t = raw.trim();
    const m = t.match(/^（([\s\S]+)）$/);
    if (m) return { mode: "do", text: m[1].trim() };
    return { mode: "say", text: t };
  };

  const insertActionMarkers = () => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    const before = input.slice(0, start);
    const selected = input.slice(start, end);
    const after = input.slice(end);
    const next = `${before}（${selected}）${after}`;
    setInput(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = before.length + 1 + selected.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const send = () => {
    const { mode, text } = detectMode(input);
    if (!text) return;
    if (text === "结局" || text === "结局。") {
      setInput("");
      navigate({ to: "/ending" });
      return;
    }
    if (text === "小游戏" || text === "小游戏。") {
      setInput("");
      navigate({ to: "/minigame" });
      return;
    }
    if (text === "真人扮演") {
      setInput("");
      setMessages((prev) => [
        ...prev,
        { kind: "notice", text: "下 面 进 入 真 人 扮 演 环 节 · 皇 上 / 温 棠" },
      ]);
      setTimeout(() => {
        setMessages((m) => [
          ...m,
          { kind: "action", charId: "zhuangsy", text: "缓步上前，指尖挑起她的下颌，眸光深沉。" },
          { kind: "dialog", charId: "zhuangsy", text: "抬起头来，让朕好好看看你。" },
        ]);
      }, 700);
      return;
    }
    setMessages((prev) => {
      // if a prompt was picked, drop that prompt block when sending
      const filtered =
        pickedPromptIdx !== null
          ? prev.filter((_, i) => i !== pickedPromptIdx)
          : prev;
      return [...filtered, { kind: "me", text, mode }];
    });
    setInput("");
    setPickedPromptIdx(null);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { kind: "dialog", charId: "zhuangsy", text: "嗯……你倒是比朕想的更沉得住气。" },
      ]);
      setTimeout(() => {
        setMessages((m) => [
          ...m,
          {
            kind: "reward",
            affinities: [
              { charId: "zhuangsy", delta: 10 },
              { charId: "moshen", delta: 15 },
            ],
            unlock: "采桑宫温居",
          },
        ]);
      }, 700);
    }, 900);
  };

  const pickHint = (promptIndex: number, text: string) => {
    const wrapped = /^（[\s\S]+）/.test(text) ? text : `（${text}）`;
    setInput(wrapped);
    setPickedPromptIdx(promptIndex);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(wrapped.length, wrapped.length);
    });
  };



  return (
    <div className="relative h-full overflow-hidden bg-neutral-900 text-white">
      {/* full-bleed scene background */}
      <img src={sceneBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {/* 背景蒙层 */}
      <div className="absolute inset-0 bg-black/20" />
      {/* soft top + bottom vignette only — keep image clear */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(20,16,24,0.55) 0%, rgba(20,16,24,0) 18%, rgba(20,16,24,0) 60%, rgba(20,16,24,0.7) 100%)",
        }}
      />

      {/* header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-3">
        <button
          onClick={() => navigate({ to: "/lobby" })}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur active:scale-95"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="pointer-events-none absolute left-1/2 top-12 -translate-x-1/2 text-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
          <div className="text-[11px] tracking-[0.3em] text-white/80">第二幕</div>
          <div className="font-brush text-[18px] tracking-[0.2em]">暗 流 涌 动</div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStatsOpen(true)}
            aria-label="玩家数值"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur active:scale-95"
          >
            <Gauge size={16} />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur active:scale-95">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* 剩余时间 + 幕进度 */}
      <div className="relative z-10 mx-4 mb-2 flex items-center justify-center">
        <div
          className="flex items-center gap-2.5 rounded-full bg-black/40 px-3 py-1 text-[11px] text-white/85 backdrop-blur-md drop-shadow"
          title="单人无时间限制；双人 / 多人每幕 ≤ 20 分钟"
        >
          <span className={`flex items-center gap-1.5 ${lowTime ? "text-rose-300" : ""}`}>
            <Clock size={11} />
            {mode === "solo" ? (
              <span>本幕剩余　不限时</span>
            ) : (
              <span>
                本幕剩余 <span className="font-mono tabular-nums">{mm}:{ss}</span>
              </span>
            )}
          </span>
          <span className="h-3 w-px bg-white/25" />
          <span className="flex items-center gap-1.5">
            <BookOpen size={11} className="opacity-80" />
            <span className="flex items-center gap-[3px]">
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1 w-1 rounded-full ${
                    i === 0
                      ? "bg-gradient-to-r from-amber-200 to-rose-200"
                      : "bg-white/30"
                  }`}
                />
              ))}
            </span>
            <span className="font-mono tabular-nums text-white/80">1/6</span>
          </span>
        </div>
      </div>

      {/* 秘密任务已移除 */}


      <div
        ref={scrollRef}
        className="relative z-10 flex-1 overflow-y-auto px-4 pb-32"
        style={{ height: "calc(100% - 200px)" }}
      >
        <div className="space-y-6 py-2">
          {messages.map((m, i) => (
            <Bubble
              key={i}
              m={m}
              picked={pickedPromptIdx === i}
              onPickHint={(text) => pickHint(i, text)}
              onAvatarClick={(id) => setPanelCharId(id)}
            />
          ))}

        </div>
      </div>

      {/* 小游戏入口（悬浮在输入栏上方,透明背景） */}
      <div className="absolute bottom-20 left-3 z-20 flex items-center gap-2">
        <button
          onClick={() => navigate({ to: "/minigame" })}
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] text-amber-200/90 backdrop-blur-md active:scale-95"
        >
          <Sparkles size={11} />
          <span>小游戏</span>
        </button>
        <button
          onClick={() => navigate({ to: "/minigame2" })}
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] text-amber-200/90 backdrop-blur-md active:scale-95"
        >
          <Sparkles size={11} />
          <span>小游戏2</span>
        </button>
      </div>


      {/* input bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/55 px-3 pb-6 pt-3 backdrop-blur-xl">
        <div className="flex items-center gap-2 w-full min-w-0">
          {/* voice input button (replaces 说/动作 toggle) */}
          <button
            aria-label="语音输入"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white/85 active:scale-95"
          >
            <Mic size={17} />
          </button>

          <div className="flex flex-1 min-w-0 items-center gap-2 rounded-full bg-white/15 px-3 py-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="以庄寒雁的身份开口，或点（）输入动作"
              className="flex-1 min-w-0 bg-transparent text-[13px] outline-none placeholder:text-white/50"
            />
            <button
              onClick={insertActionMarkers}
              aria-label="输入动作"
              title="输入动作（包在（）之间）"
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white/70 hover:text-white active:scale-95"
            >
              <Asterisk size={15} />
            </button>
          </div>
          <button
            onClick={send}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7a2a2a] text-white shadow-[0_2px_10px_rgba(0,0,0,0.35)] active:scale-95"
          >
            <Send size={15} />
          </button>
        </div>
      </div>

      {/* 角色面板 */}
      {panelCharId && (
        <CharacterPanel charId={panelCharId} onClose={() => setPanelCharId(null)} />
      )}

      {/* 剧情回溯 */}
      {recapOpen && <RecapPanel onClose={() => setRecapOpen(false)} />}

      {/* 玩家数值 */}
      {statsOpen && <StatsPanel onClose={() => setStatsOpen(false)} /> }
    </div>
  );
}

/* shared cream bubble used by both characters and the player */
const CREAM_BUBBLE =
  "relative rounded-2xl bg-white/80 px-4 py-2.5 text-[14px] leading-relaxed text-neutral-800 shadow-[0_2px_10px_rgba(0,0,0,0.18)] backdrop-blur-sm";

function Bubble({ m, picked, onPickHint, onAvatarClick }: { m: Msg; picked?: boolean; onPickHint?: (text: string) => void; onAvatarClick?: (id: string) => void }) {
  if (m.kind === "narration") {
    return (
      <div className="mx-auto max-w-[88%] text-center">
        <div className="mx-auto mb-2 h-px w-10 bg-white/40" />
        <p className="font-brush text-[13px] leading-relaxed tracking-wider text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          {m.text}
        </p>
        <div className="mx-auto mt-2 h-px w-10 bg-white/40" />
      </div>
    );
  }

  if (m.kind === "me") {
    const me = getCharacter("hanyan")!;
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[78%]">
          {m.mode === "do" ? (
            <div className="rounded-2xl rounded-tr-md bg-black/50 px-4 py-2.5 text-[13px] italic text-white/65 shadow-[0_2px_10px_rgba(0,0,0,0.25)] backdrop-blur-sm">
              （{m.text}）
            </div>
          ) : (
            <div className="rounded-2xl rounded-tr-md bg-black/50 px-4 py-2.5 text-[14px] leading-relaxed text-white shadow-[0_2px_10px_rgba(0,0,0,0.25)] backdrop-blur-sm">
              {m.text}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center">
          <img
            src={me.img}
            alt={me.name}
            className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
          />
          <ActorTag human={IS_HUMAN[me.id] ?? false} />
        </div>
      </div>
    );
  }

  if (m.kind === "prompt") {
    const [open, setOpen] = useState(false);
    const hints = [
      "（欣然应允）臣妾愿悉心照料琰儿。",
      "（犹豫试探）陛下，琰儿乃皇子，臣妾恐难当此任。",
      "（婉言拒绝）臣妾只想盼着瑜儿回心转意。",
    ];
    return (
      <div className="-mx-4 my-5 animate-fade-up">
        <div className="relative w-full overflow-hidden bg-black/55 backdrop-blur-md">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/10" />

          <div className="relative z-10 flex items-center gap-3 px-5 py-7">
            <div className="flex-1">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Feather size={10} className="text-amber-200/90" />
                <span className="text-[9px] tracking-[0.35em] text-amber-200/80">剧 情 提 示</span>
              </div>
              <p className="text-[14px] font-medium leading-snug text-white">
                {m.text}
              </p>
            </div>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="灵感提示"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/90 backdrop-blur-md transition active:scale-95"
            >
              <Lightbulb size={15} />
            </button>
          </div>
        </div>
        {open && !picked && (
          <div className="mt-3 space-y-2 px-4 animate-fade-up">
            {hints.map((title) => (
              <button
                key={title}
                onClick={() => onPickHint?.(title)}
                className="block w-full rounded-lg bg-white/80 px-4 py-2.5 text-left text-[14px] font-medium text-neutral-900 shadow-[0_2px_10px_rgba(0,0,0,0.18)] backdrop-blur-sm transition active:scale-[0.99]"
              >
                {title}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (m.kind === "reward") {
    const [visible, setVisible] = useState(true);
    useEffect(() => {
      const t = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(t);
    }, []);
    if (!visible) return null;
    return (
      <div className="my-2 flex justify-center animate-fade-up">
        <div className="max-w-[88%] rounded-2xl border border-amber-200/30 bg-gradient-to-br from-amber-950/70 to-rose-950/70 px-4 py-2.5 text-center shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <div className="mb-1.5 flex items-center justify-center gap-1.5">
            <Sparkles size={11} className="text-amber-200" />
            <span className="text-[9px] tracking-[0.35em] text-amber-200/90">情 缘 流 转</span>
            <Sparkles size={11} className="text-amber-200" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] text-white/95">
            {m.affinities.map((a) => {
              const ch = getCharacter(a.charId);
              return (
                <span key={a.charId} className="inline-flex items-center gap-1">
                  {ch && <img src={ch.img} alt={ch.name} className="h-4 w-4 rounded-full object-cover" />}
                  <span>{ch?.name ?? a.charId}</span>
                  <span className="font-mono tabular-nums text-rose-200">亲密度 +{a.delta}</span>
                </span>
              );
            })}
          </div>
          {m.unlock && (
            <div className="mt-1.5 text-[11px] text-amber-100/90">
              解锁剧情 <span className="font-medium text-amber-200">「{m.unlock}」</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (m.kind === "notice") {
    return (
      <div className="my-3 flex justify-center animate-fade-up">
        <div className="rounded-full border border-amber-200/30 bg-black/55 px-4 py-1.5 text-[11px] tracking-[0.2em] text-amber-100/90 backdrop-blur-md">
          {m.text}
        </div>
      </div>
    );
  }

  const c = getCharacter(m.charId) ?? CHARACTERS[0];
  const avatarBtn = (
    <div className="flex flex-col items-center">
      <button
        onClick={() => onAvatarClick?.(c.id)}
        className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full active:scale-95"
        aria-label={`查看 ${c.name}`}
      >
        <img src={c.img} alt={c.name} className="h-full w-full object-cover" />
      </button>
      <ActorTag human={IS_HUMAN[c.id] ?? false} />
    </div>
  );

  if (m.kind === "action") {
    return (
      <div className="flex gap-2">
        {avatarBtn}
        <div className="max-w-[78%]">
          <div className="rounded-2xl rounded-tl-md border border-white/40 bg-white/15 px-4 py-2.5 text-[13px] italic text-white shadow-[0_2px_10px_rgba(0,0,0,0.25)] backdrop-blur-md drop-shadow">
            （{m.text}）
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {avatarBtn}
      <div className="max-w-[80%]">
        <div className={`${CREAM_BUBBLE} rounded-tl-md`}>
          {m.text}
        </div>
      </div>
    </div>
  );
}

function CharacterPanel({ charId, onClose }: { charId: string; onClose: () => void }) {
  const c = getCharacter(charId);
  const [followed, setFollowed] = useState(false);
  if (!c) return null;
  const actor = ACTORS[charId] ?? "@匿名玩家";
  return (
    <div className="absolute inset-0 z-30 bg-neutral-950 text-white animate-fade-in">
      {/* 关闭按钮 — 固定不动 */}
      <button
        onClick={onClose}
        className="absolute left-4 top-12 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur active:scale-95"
        aria-label="关闭"
      >
        <X size={18} />
      </button>

      <div className="absolute inset-0 overflow-y-auto">

      {/* 背景人物 — 随滚动一起向上 */}
      <div className="relative h-72 w-full">
        <img src={c.img} alt={c.name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-neutral-950" />
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <div className="font-brush text-[28px] tracking-[0.2em] drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">{c.name}</div>
          <div className="mt-1 text-[11px] tracking-[0.3em] text-white/80">{c.role}</div>
        </div>
      </div>

      <div className="px-5 pb-10">
        {/* 扮演者 */}
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2.5">
            <img src={actorAvatar} alt={actor} className="h-10 w-10 rounded-full object-cover" />

            <div>
              <div className="text-[14px] font-medium text-white">{actor}</div>
              <div className="text-[10px] text-white/55">知乎 · 扮演者</div>
            </div>
          </div>
          <button
            onClick={() => setFollowed((v) => !v)}
            className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-[12px] font-medium transition active:scale-95 ${
              followed
                ? "bg-white/10 text-white/70"
                : "bg-white text-neutral-900 shadow-[0_2px_10px_rgba(255,255,255,0.15)]"
            }`}
          >
            {followed ? <><Check size={13} /> 已添加</> : <><UserPlus size={13} /> 添加好友</>}
          </button>
        </div>

        <div className="h-px bg-white/10" />

        {c.motto && (
          <p className="mt-8 text-center font-brush text-[15px] leading-relaxed text-amber-100/90">
            {c.motto}
          </p>
        )}
        <p className="mt-4 text-[13px] leading-relaxed text-white/85">{c.desc}</p>

        <div className="mt-10 grid grid-cols-1 gap-3 text-[12px]">
          <PanelField label="身份" value={c.identity} />
          <PanelField label="性格" value={c.personality} />
          <PanelField label="所长" value={c.skill} />
          <PanelField label="秘事" value={c.secret} />
        </div>

        <div className="mt-10">
          <div className="mb-3 text-[10px] tracking-[0.3em] text-amber-200/80">人 物 小 传</div>
          <p className="text-[13px] leading-relaxed text-white/80">{c.story}</p>
        </div>
      </div>
      </div>
    </div>
  );
}

function PanelField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-lg bg-white/5 px-3 py-2">
      <span className="w-10 flex-shrink-0 text-[11px] tracking-widest text-white/45">{label}</span>
      <span className="flex-1 text-white/90">{value}</span>
    </div>
  );
}

const RECAP: { act: string; title: string; summary: string; highlights: string[] }[] = [
  {
    act: "序幕",
    title: "初入采桑宫",
    summary: "温棠入宫十年，被遗忘在采桑宫偏殿，与嬷嬷相依度日。",
    highlights: ["结识嬷嬷", "得三皇子裴琰偶然探望"],
  },
  {
    act: "第一幕",
    title: "雪夜承宠",
    summary: "陛下夜翻牌子，问温棠是否愿抚育三皇子琰儿。",
    highlights: ["得宠 +1", "与裴荣初次试探"],
  },
];

function RecapPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-30 animate-fade-in">
      <button
        onClick={onClose}
        aria-label="关闭"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[78%] overflow-hidden rounded-t-3xl border-t border-amber-200/20 bg-gradient-to-b from-[#2a1a14] to-[#1a0e14] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] animate-slide-in-up">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <History size={16} className="text-amber-200" />
            <div>
              <div className="text-[10px] tracking-[0.35em] text-amber-200/80">剧 情 回 溯</div>
              <div className="font-brush text-[18px] tracking-[0.15em] text-white">画 堂 春</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 active:scale-95"
          >
            <X size={15} />
          </button>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-amber-200/20 to-transparent" />
        <div className="max-h-[60vh] overflow-y-auto px-5 py-5">
          <ol className="relative space-y-5 border-l border-amber-200/20 pl-5">
            {RECAP.map((r, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[26px] top-1 flex h-3 w-3 items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-amber-200/20" />
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-200" />
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] tracking-[0.3em] text-amber-200/80">{r.act}</span>
                  <span className="font-brush text-[16px] text-white">{r.title}</span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/85">{r.summary}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.highlights.map((h) => (
                    <span
                      key={h}
                      className="rounded-full border border-amber-200/25 bg-amber-200/10 px-2 py-0.5 text-[10.5px] text-amber-100/90"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </li>
            ))}
            <li className="relative opacity-60">
              <span className="absolute -left-[26px] top-1 flex h-3 w-3 items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
              </span>
              <div className="text-[12px] italic text-white/55">未来剧情待你书写……</div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// ── 玩家数值面板 ──
const AFFINITY: { id: string; value: number }[] = [
  { id: "zhouyi", value: 120 },
  { id: "zhuangsy", value: 360 },
  { id: "yushan", value: 80 },
  { id: "moshen", value: 540 },
];

const SKILLS: { key: string; label: string; value: number; icon: typeof EyeIcon }[] = [
  { key: "observe", label: "观察力", value: 78, icon: EyeIcon },
  { key: "speech", label: "口才", value: 65, icon: MessageCircle },
  { key: "force", label: "武力", value: 32, icon: Swords },
  { key: "wits", label: "智谋", value: 84, icon: Brain },
  { key: "prestige", label: "威望", value: 47, icon: Crown },
];

function StatsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-30 animate-fade-in">
      <button
        onClick={onClose}
        aria-label="关闭"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[82%] overflow-hidden rounded-t-3xl border-t border-amber-200/20 bg-gradient-to-b from-[#2a1a14] to-[#1a0e14] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] animate-slide-in-up">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Gauge size={16} className="text-amber-200" />
            <div>
              <div className="text-[10px] tracking-[0.35em] text-amber-200/80">玩 家 数 值</div>
              <div className="font-brush text-[18px] tracking-[0.15em] text-white">庄 寒 雁</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 active:scale-95"
          >
            <X size={15} />
          </button>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-amber-200/20 to-transparent" />

        <div className="max-h-[68vh] overflow-y-auto px-5 py-5 space-y-6">
          {/* 好感度 */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Heart size={13} className="text-rose-300" />
              <div className="text-[11px] tracking-[0.3em] text-amber-100/85">好 感 度</div>
              <div className="ml-auto text-[10px] text-white/45">0 ~ 1000</div>
            </div>
            <div className="space-y-2.5">
              {AFFINITY.map((a) => {
                const ch = getCharacter(a.id);
                const pct = Math.min(100, (a.value / 1000) * 100);
                return (
                  <div key={a.id} className="flex items-center gap-3">
                    <img
                      src={ch?.img}
                      alt={ch?.name}
                      className="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-1 ring-amber-200/25"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-baseline justify-between">
                        <div className="text-[13px] text-white/90">{ch?.name ?? a.id}</div>
                        <div className="font-mono text-[11px] text-amber-200/90">
                          {a.value}<span className="text-white/40"> / 1000</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-400 to-amber-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 技能点 */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={13} className="text-amber-200" />
              <div className="text-[11px] tracking-[0.3em] text-amber-100/85">技 能 点</div>
              <div className="ml-auto text-[10px] text-white/45">0 ~ 100</div>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {SKILLS.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.key}
                    className="flex items-center gap-3 rounded-xl border border-amber-200/15 bg-white/[0.04] px-3 py-2.5"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-200/10 text-amber-200">
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-baseline justify-between">
                        <div className="text-[13px] text-white/90">{s.label}</div>
                        <div className="font-mono text-[11px] text-amber-200/90">{s.value}</div>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-300 to-rose-300"
                          style={{ width: `${s.value}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ScenePage() {
  return (
    <PhoneMockup>
      <Scene />
    </PhoneMockup>
  );
}
