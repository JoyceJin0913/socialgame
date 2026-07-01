import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Share2, Sparkles, Crown, Check, Plus, X, User, Users, Bot } from "lucide-react";
import heroImg from "@/assets/hero-huatangchun.jpg";
import { CHARACTERS, PLAYABLE_CHARACTER_IDS } from "@/lib/characters";
import { PhoneMockup } from "@/components/PhoneMockup";

type LobbySearch = { char?: string };

export const Route = createFileRoute("/lobby")({
  validateSearch: (s: Record<string, unknown>): LobbySearch => ({
    char: typeof s.char === "string" ? s.char : undefined,
  }),
  component: LobbyPage,
  head: () => ({
    meta: [
      { title: "组队入梦 · 画堂春" },
      { name: "description", content: "选剧情、选角色、选模式，开启属于你的画堂春。" },
    ],
  }),
});

const ORIGINAL_SCRIPT = { id: "origin", title: "原著剧本", desc: "忠于原作，完整呈现", premium: false };

const TAGS = [
  { id: "sweet", label: "甜宠" },
  { id: "revenge", label: "复仇" },
  { id: "court", label: "权谋" },
  { id: "tragedy", label: "虐恋" },
  { id: "comedy", label: "轻喜" },
  { id: "mystery", label: "悬疑" },
  { id: "rebirth", label: "重生" },
  { id: "modern", label: "穿越" },
];

type Mode = "solo" | "multi";

function Lobby() {
  const navigate = useNavigate();
  const { char: preselected } = Route.useSearch();

  const [scripts, setScripts] = useState<string[]>([ORIGINAL_SCRIPT.id]);
  const [tags, setTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [charId, setCharId] = useState<string | undefined>(preselected);
  const [mode, setMode] = useState<Mode>("multi");

  const toggleScript = (id: string) => {
    setScripts((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  const MAX_TAGS = 2;
  const tagsFull = tags.length >= MAX_TAGS;
  const toggleTag = (id: string) => {
    setTags((t) => {
      if (t.includes(id)) return t.filter((x) => x !== id);
      if (t.length >= MAX_TAGS) return t;
      return [...t, id];
    });
  };
  const addCustomTag = () => {
    const v = tagInput.trim();
    if (!v) return;
    if (tags.length >= MAX_TAGS) return;
    if (!customTags.includes(v)) setCustomTags((c) => [...c, v]);
    if (!tags.includes(v)) setTags((t) => [...t, v]);
    setTagInput("");
  };
  const removeCustomTag = (v: string) => {
    setCustomTags((c) => c.filter((x) => x !== v));
    setTags((t) => t.filter((x) => x !== v));
  };
  const confirmTag = (id: string) => {
    setTags((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  };

  const canStart = !!charId && scripts.length > 0;

  const tagLabels = tags
    .map((id) => TAGS.find((t) => t.id === id)?.label ?? id)
    .filter(Boolean);

  const handleStart = () => {
    if (!charId) return;
    if (mode === "solo") {
      // 单人沉浸：直接进游戏，带上角色与标签，from=lobby 跳过登记守卫
      navigate({ to: "/scene", search: { role: charId, tags: tagLabels.join(","), from: "lobby" } });
    } else {
      // 站内匹配：先去匹配页（matching → 承接页 → /scene）
      navigate({ to: "/matching", search: { role: charId, tags: tagLabels.join(",") } });
    }
  };

  const selectedChar = charId ? CHARACTERS.find((c) => c.id === charId) : undefined;

  return (
    <div className="relative h-full bg-white">
      <div className="relative h-full overflow-y-auto pb-10 text-foreground no-scrollbar">
        {/* HEADER */}
        <section className="relative h-[12vh] min-h-[100px] w-full overflow-hidden">
          <img src={heroImg} alt="画堂春" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/25" />

          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 pt-12">
            <button
              onClick={() => navigate({ to: "/" })}
              className="grid h-9 w-9 place-items-center rounded-full bg-black/25 backdrop-blur-md"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <h1 className="font-brush text-[26px] leading-none text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
              组队入梦
            </h1>
            <button className="grid h-9 w-9 place-items-center rounded-full bg-black/25 backdrop-blur-md">
              <Share2 className="h-4 w-4 text-white" />
            </button>
          </div>
        </section>

        {/* 1. SCRIPT SELECTION */}
        <section className="mt-4 px-5">
          <SectionTitle index="01" title="剧情选择" />

          {/* Original script — default */}
          <button
            onClick={() => toggleScript(ORIGINAL_SCRIPT.id)}
            className={`mt-3 flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
              scripts.includes(ORIGINAL_SCRIPT.id)
                ? "border-transparent bg-black/[0.04] ring-2"
                : "border-black/10 bg-white"
            }`}
            style={scripts.includes(ORIGINAL_SCRIPT.id) ? { boxShadow: "inset 0 0 0 2px var(--rouge)" } : undefined}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-brush text-[18px] text-neutral-900">{ORIGINAL_SCRIPT.title}</span>
                <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] text-neutral-500">默认</span>
              </div>
              <div className="mt-1 text-[11px] text-neutral-500">{ORIGINAL_SCRIPT.desc}</div>
            </div>
            <span
              className={`grid h-6 w-6 place-items-center rounded-full transition ${
                scripts.includes(ORIGINAL_SCRIPT.id) ? "text-white" : "bg-black/[0.06] text-transparent"
              }`}
              style={scripts.includes(ORIGINAL_SCRIPT.id) ? { background: "var(--gradient-rouge)" } : undefined}
            >
              <Check className="h-3.5 w-3.5" />
            </span>
          </button>

          {/* Custom tags */}
          <div className="mt-3 rounded-2xl border border-black/10 bg-neutral-50 p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-3.5 w-3.5" style={{ color: "var(--rouge)" }} />
              <span className="text-[12px] font-medium text-neutral-900">标签定制剧情</span>
            </div>
            <p className="mt-1.5 text-[11px] text-neutral-500">
              选择标签，AI 将基于原著为你重写一个独一无二的支线
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {TAGS.map((t) => {
                const on = tags.includes(t.id);
                const disabled = !on && tagsFull;
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleTag(t.id)}
                    disabled={disabled}
                    className={`rounded-full border px-3 py-1.5 text-[11px] transition active:scale-95 ${
                      on
                        ? "border-transparent text-white"
                        : disabled
                          ? "cursor-not-allowed border-black/5 bg-neutral-100 text-neutral-300"
                          : "border-black/10 bg-white text-neutral-600"
                    }`}
                    style={on ? { background: "var(--gradient-rouge)" } : undefined}
                  >
                    {t.label}
                  </button>
                );
              })}
              {customTags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1.5 text-[11px] text-white"
                  style={{ background: "var(--gradient-rouge)" }}
                >
                  {t}
                  <button
                    onClick={() => removeCustomTag(t)}
                    className="grid h-3.5 w-3.5 place-items-center rounded-full bg-white/25"
                    aria-label="删除"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-neutral-400">
              最多选择 {MAX_TAGS} 个标签{tagsFull ? "（已满）" : `（已选 ${tags.length}/${MAX_TAGS}）`}
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5">
              <Plus className="h-3 w-3 text-neutral-400" />
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
                disabled={tagsFull}
                placeholder={tagsFull ? "已达上限，删除标签后可继续添加" : "自定义标签，按回车添加"}
                className="flex-1 bg-transparent text-[11px] text-neutral-700 placeholder:text-neutral-400 focus:outline-none disabled:opacity-50"
              />
              {tagInput.trim() && (
                <button
                  onClick={addCustomTag}
                  className="rounded-full px-2.5 py-0.5 text-[10px] text-white"
                  style={{ background: "var(--gradient-rouge)" }}
                >
                  添加
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 2. CHARACTER SELECTION */}
        <section className="mt-7 px-5">
          <SectionTitle index="02" title="角色选择" />

          {selectedChar ? (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border-2 p-3"
              style={{ borderColor: "var(--rouge)", background: "color-mix(in oklab, var(--rouge) 4%, white)" }}
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                <img src={selectedChar.img} alt={selectedChar.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-brush text-[20px] text-neutral-900">{selectedChar.name}</span>
                  <span className="text-[10px] text-neutral-400">{selectedChar.gender} · {selectedChar.age}岁</span>
                </div>
                <div className="mt-0.5 truncate text-[11px] text-neutral-500">{selectedChar.tag} · {selectedChar.role}</div>
              </div>
              <button
                onClick={() => setCharId(undefined)}
                className="rounded-full bg-black/[0.06] px-3 py-1.5 text-[11px] text-neutral-600 transition active:scale-95"
              >
                更换
              </button>
            </div>
          ) : (
            <>
              <p className="mt-2 text-[11px] text-neutral-500">点选一位角色入梦</p>
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                {CHARACTERS.map((c) => {
                  const playable = PLAYABLE_CHARACTER_IDS.has(c.id);
                  return (
                    <button
                      key={c.id}
                      disabled={!playable}
                      onClick={() => playable && setCharId(c.id)}
                      className={`group relative aspect-[3/4] overflow-hidden rounded-xl border border-black/10 transition ${
                        playable ? "active:scale-95" : "cursor-not-allowed"
                      }`}
                    >
                      <img
                        src={c.img}
                        alt={c.name}
                        className={`absolute inset-0 h-full w-full object-cover ${
                          playable ? "" : "grayscale opacity-75"
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                      {!playable && <div className="absolute inset-0 bg-stone-300/20" />}
                      <div className="absolute inset-x-0 bottom-0 p-2 text-left">
                        <div className="font-brush text-base text-white">{c.name}</div>
                        <div className="text-[9px] text-white/70">{c.gender} · {c.age}岁</div>
                      </div>
                      {!playable && (
                        <div className="absolute left-1/2 top-2 min-w-[72px] -translate-x-1/2 rounded-full border border-white/35 bg-black/35 px-3 py-0.5 text-center text-[9px] tracking-wider text-white/90 backdrop-blur-sm">
                          敬请期待
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* 3. MODE SELECTION */}
        <section className="mt-7 px-5">
          <SectionTitle index="03" title="游戏模式" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <ModeCard
              icon={<User className="h-5 w-5" />}
              title="单人沉浸"
              desc="独享一卷剧本，AI 演绎众生"
              active={mode === "solo"}
              onClick={() => setMode("solo")}
            />
            <ModeCard
              icon={<Users className="h-5 w-5" />}
              title="多人互动"
              desc="邀请好友 / 站内匹配"
              active={mode === "multi"}
              onClick={() => setMode("multi")}
            />
          </div>

          {mode === "multi" && (
            <div className="animate-fade-up mt-6 flex gap-3">
              <button
                disabled={!canStart}
                onClick={() => navigate({ to: "/invite" })}
                className={`flex h-14 flex-1 items-center justify-center gap-1.5 rounded-full border border-dashed border-black/20 bg-white text-[13px] text-neutral-700 transition active:scale-[0.98] ${
                  canStart ? "" : "opacity-40"
                }`}
              >
                <Plus className="h-4 w-4" />
                邀请好友
              </button>
              <button
                onClick={handleStart}
                className="flex h-14 flex-1 items-center justify-center gap-1.5 rounded-full text-white shadow-[var(--shadow-card)] transition active:scale-[0.98]"
                style={{ background: "var(--gradient-rouge)" }}
              >
                <Sparkles className="h-4 w-4" />
                <span className="font-brush text-base tracking-wider">站内匹配</span>
              </button>
            </div>
          )}

          {mode === "solo" && (
            <>
              <p className="animate-fade-up mt-3 flex items-center gap-1.5 px-1 text-[11px] text-neutral-500">
                <Bot className="h-3 w-3" />
                确认角色后将直接开启单人沉浸
              </p>
              <div className="mt-6">
                <button
                  onClick={handleStart}
                  className="flex h-14 w-full items-center justify-center rounded-full text-white shadow-[var(--shadow-card)] transition active:scale-[0.98]"
                  style={{ background: "var(--gradient-rouge)" }}
                >
                  <span className="font-brush text-lg tracking-wider">一键入戏</span>
                </button>
              </div>
            </>
          )}

          {!charId && (
            <p className="mt-2 text-center text-[11px] text-neutral-400">请先选择一位角色</p>
          )}
        </section>
      </div>

      {/* Paywall sheet */}
      {showPaywall && (
        <div className="absolute inset-0 z-40 flex items-end" onClick={() => setShowPaywall(false)}>
          <div className="absolute inset-0 animate-fade-in bg-black/55 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full rounded-t-[28px] bg-white p-6 pb-10 shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.4)]"
            style={{ animation: "fade-in 0.3s ease-out" }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-300" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4" style={{ color: "var(--rouge)" }} />
                <h3 className="font-brush text-2xl text-neutral-900">解锁标签定制</h3>
              </div>
              <button
                onClick={() => setShowPaywall(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-black/[0.05] text-neutral-500"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-[13px] leading-7 text-neutral-600">
              开通会员后，可自由选择「甜宠 / 复仇 / 权谋 / 虐恋」等标签，
              AI 将基于原著为你实时改编出专属的支线剧情。
            </p>

            <div className="mt-4 rounded-2xl bg-black/[0.03] p-4">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl text-neutral-900">¥18</span>
                <span className="text-[12px] text-neutral-400">/ 月</span>
              </div>
              <ul className="mt-2 space-y-1.5 text-[12px] text-neutral-600">
                <li>· 解锁全部剧情标签定制</li>
                <li>· 每月 30 次 AI 剧情重写</li>
                <li>· 优先匹配真人玩家</li>
              </ul>
            </div>

            <button
              className="mt-5 flex h-12 w-full items-center justify-center rounded-full text-white shadow-[var(--shadow-card)] transition active:scale-[0.98]"
              style={{ background: "var(--gradient-rouge)" }}
            >
              <span className="font-brush text-base tracking-wider">立即开通</span>
            </button>

            {/* Sample preview tags (clickable for demo) */}
            <div className="mt-4">
              <div className="mb-2 text-[11px] text-neutral-400">体验试选（不会保存）</div>
              <div className="flex flex-wrap gap-1.5">
                {TAGS.slice(0, 4).map((t) => {
                  const on = tags.includes(t.id);
                  const disabled = !on && tagsFull;
                  return (
                    <button
                      key={t.id}
                      onClick={() => confirmTag(t.id)}
                      disabled={disabled}
                      className={`rounded-full border px-3 py-1.5 text-[11px] ${
                        on
                          ? "border-transparent text-white"
                          : disabled
                            ? "cursor-not-allowed border-black/5 bg-neutral-100 text-neutral-300"
                            : "border-black/10 bg-white text-neutral-600"
                      }`}
                      style={on ? { background: "var(--gradient-rouge)" } : undefined}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-display text-[11px] tracking-widest text-neutral-400">{index}</span>
      <span className="font-brush" style={{ color: "var(--rouge)" }}>❀</span>
      <h2 className="font-brush text-xl text-neutral-900">{title}</h2>
    </div>
  );
}

function ModeCard({
  icon, title, desc, active, onClick,
}: { icon: React.ReactNode; title: string; desc: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border p-4 text-left transition active:scale-[0.98] ${
        active ? "border-transparent text-white" : "border-black/10 bg-white text-neutral-700"
      }`}
      style={active ? { background: "var(--gradient-rouge)" } : undefined}
    >
      <div className={`grid h-9 w-9 place-items-center rounded-full ${active ? "bg-white/20" : "bg-black/[0.05]"}`}>
        {icon}
      </div>
      <div className="mt-3 font-brush text-lg">{title}</div>
      <div className={`mt-1 text-[11px] ${active ? "text-white/80" : "text-neutral-500"}`}>{desc}</div>
      {active && (
        <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-white/25">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
    </button>
  );
}

function LobbyPage() {
  return (
    <PhoneMockup>
      <Lobby />
    </PhoneMockup>
  );
}
