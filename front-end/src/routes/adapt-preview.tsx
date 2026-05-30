import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Pencil, Check, Sparkles, Loader2, RefreshCw, ImageIcon, Users, BookOpen, MapPin } from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";
import { CHARACTERS } from "@/lib/characters";
import sceneHuatang from "@/assets/scene-huatang.jpg";

export const Route = createFileRoute("/adapt-preview")({
  component: AdaptPreviewPage,
  head: () => ({ meta: [{ title: "改编预览 · 画堂春" }] }),
});

type Tab = "chapters" | "characters" | "scenes";

const INITIAL_CHAPTERS = [
  { title: "雪夜采桑宫", detail: "帝王初见温棠，红豆汤暖一炉夜雪。" },
  { title: "六岁推手", detail: "裴瑜在坤宁宫前推开生母，雪地里站到天亮。" },
  { title: "废妃药引", detail: "周贵妃饮下那盏汤，留下九岁的裴琰。" },
  { title: "改记名分", detail: "裴琰被记于温棠名下，半盏药里的橘瓣甜。" },
  { title: "凤印翻案", detail: "赵将军溺亡，旧案翻出，皇后凤印松动。" },
  { title: "画堂春深", deta: "温棠册后，裴琰登基前夜的最后一碗汤。", },
].map((c, i) => ({ id: `c${i + 1}`, title: c.title, detail: (c as { detail?: string; deta?: string }).detail ?? (c as { deta: string }).deta }));

const INITIAL_SCENES = [
  { id: "s1", title: "采桑宫·雪夜", img: sceneHuatang, ready: true },
  { id: "s2", title: "坤宁宫·清晨", img: "", ready: false },
  { id: "s3", title: "御书房·烛火", img: "", ready: false },
  { id: "s4", title: "画堂·春深", img: "", ready: false },
  { id: "s5", title: "宫道·风雪", img: "", ready: false },
  { id: "s6", title: "凤仪殿·夜审", img: "", ready: false },
];

function AdaptPreviewPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("chapters");

  const [chapters, setChapters] = useState(INITIAL_CHAPTERS);
  const [chars, setChars] = useState(
    CHARACTERS.map((c) => ({ id: c.id, name: c.name, role: c.role, desc: c.desc, img: c.img }))
  );
  const [scenes, setScenes] = useState(INITIAL_SCENES);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <PhoneMockup>
      <div className="relative h-full bg-[#0d0b14]">
      <div className="h-full overflow-y-auto pb-28 no-scrollbar">
        <header className="sticky top-0 z-30 flex items-center justify-between bg-[#0d0b14]/95 backdrop-blur-md px-4 pb-3 pt-12 border-b border-white/5">
          <button
            onClick={() => navigate({ to: "/adapt" })}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10"
            aria-label="返回"
          >
            <ChevronLeft className="h-4 w-4 text-white" />
          </button>
          <div className="text-center">
            <div className="text-[14px] font-medium text-white">改编预览</div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/60">
            <Sparkles className="h-3 w-3" style={{ color: "var(--gold)" }} />
            草稿
          </div>
        </header>

        {/* Hint */}
        <div className="mx-5 mt-4 rounded-xl border border-white/5 bg-white/[0.04] px-3 py-2.5 text-[11px] text-white/60 leading-relaxed">
          AI 已为《画堂春》拆出章节、人物与场景。你可以逐项编辑、重生成图，再确认进入文游。
        </div>

        {/* Tabs */}
        <div className="sticky top-[88px] z-20 mx-5 mt-4 grid grid-cols-3 gap-1 rounded-full bg-white/[0.06] p-1 backdrop-blur-md">
          {([
            { k: "chapters", label: "章节", Icon: BookOpen },
            { k: "characters", label: "人物", Icon: Users },
            { k: "scenes", label: "场景图", Icon: ImageIcon },
          ] as const).map(({ k, label, Icon }) => (
            <button
              key={k}
              onClick={() => { setTab(k); setEditingId(null); }}
              className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-[12px] transition ${
                tab === k ? "text-white shadow-[0_6px_14px_-6px_rgba(232,107,90,0.55)]" : "text-white/55"
              }`}
              style={tab === k ? { background: "var(--gradient-rouge)" } : undefined}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <section className="mt-5 px-5 space-y-3">
          {tab === "chapters" &&
            chapters.map((c, i) => {
              const editing = editingId === c.id;
              return (
                <div key={c.id} className="rounded-2xl border border-white/5 bg-white/[0.04] p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-medium text-white" style={{ background: "var(--gradient-rouge)" }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      {editing ? (
                        <>
                          <input
                            value={c.title}
                            onChange={(e) => setChapters((arr) => arr.map((x) => x.id === c.id ? { ...x, title: e.target.value } : x))}
                            className="w-full bg-transparent text-[14px] font-medium text-white outline-none border-b border-white/20 pb-1"
                          />
                          <textarea
                            value={c.detail}
                            onChange={(e) => setChapters((arr) => arr.map((x) => x.id === c.id ? { ...x, detail: e.target.value } : x))}
                            className="mt-2 w-full resize-none bg-transparent text-[12px] text-white/70 outline-none border border-white/10 rounded-lg p-2 leading-relaxed"
                            rows={2}
                          />
                        </>
                      ) : (
                        <>
                          <div className="text-[14px] font-medium text-white">{c.title}</div>
                          <div className="mt-1 text-[12px] text-white/55 leading-relaxed">{c.detail}</div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setEditingId(editing ? null : c.id)}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-white/80"
                      aria-label="编辑"
                    >
                      {editing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              );
            })}

          {tab === "characters" &&
            chars.map((c) => {
              const editing = editingId === c.id;
              return (
                <div key={c.id} className="group rounded-2xl border border-white/5 bg-white/[0.04] p-3">
                  <div className="flex gap-3">
                    <div className="relative h-16 w-16 shrink-0">
                      <img src={c.img} alt={c.name} className="h-16 w-16 rounded-xl object-cover" />
                      <button
                        type="button"
                        className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl bg-black/65 text-[10px] text-white opacity-0 transition group-hover:opacity-100"
                        aria-label="重新生成头像"
                      >
                        <RefreshCw className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />
                        重新生成
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      {editing ? (
                        <>
                          <div className="flex gap-2">
                            <input
                              value={c.name}
                              onChange={(e) => setChars((arr) => arr.map((x) => x.id === c.id ? { ...x, name: e.target.value } : x))}
                              className="w-20 bg-transparent text-[14px] font-medium text-white outline-none border-b border-white/20 pb-0.5"
                            />
                            <input
                              value={c.role}
                              onChange={(e) => setChars((arr) => arr.map((x) => x.id === c.id ? { ...x, role: e.target.value } : x))}
                              className="flex-1 bg-transparent text-[11px] text-white/60 outline-none border-b border-white/10 pb-0.5"
                            />
                          </div>
                          <textarea
                            value={c.desc}
                            onChange={(e) => setChars((arr) => arr.map((x) => x.id === c.id ? { ...x, desc: e.target.value } : x))}
                            className="mt-2 w-full resize-none bg-transparent text-[11.5px] text-white/70 outline-none border border-white/10 rounded-lg p-2 leading-relaxed"
                            rows={3}
                          />
                        </>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-2">
                            <div className="text-[14px] font-medium text-white truncate">{c.name}</div>
                            <div className="text-[11px] text-white/50 truncate">{c.role}</div>
                          </div>
                          <div className="mt-1 text-[11.5px] text-white/55 leading-relaxed line-clamp-3">{c.desc}</div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setEditingId(editing ? null : c.id)}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-white/80 self-start"
                      aria-label="编辑"
                    >
                      {editing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              );
            })}

          {tab === "scenes" && (
            <div className="grid grid-cols-2 gap-3">
              {scenes.map((s) => (
                <div key={s.id} className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.04]">
                  <div className="relative aspect-[3/4] w-full bg-white/[0.03]">
                    {s.ready && s.img ? (
                      <img src={s.img} alt={s.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/40">
                        <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--gold)" }} />
                        <div className="text-[10px] tracking-[0.2em]">生成中…</div>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <div className="flex items-center gap-1 text-[10px] text-white/90">
                        <MapPin className="h-3 w-3" /> {s.title}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-2.5 py-2">
                    <button
                      onClick={() => {
                        setScenes((arr) => arr.map((x) => x.id === s.id ? { ...x, ready: false, img: "" } : x));
                        setTimeout(() => {
                          setScenes((arr) => arr.map((x) => x.id === s.id ? { ...x, ready: true, img: sceneHuatang } : x));
                        }, 1400);
                      }}
                      className="flex items-center gap-1 text-[10.5px] text-white/70"
                    >
                      <RefreshCw className="h-3 w-3" /> 重生成
                    </button>
                    <button className="text-[10.5px] text-white/50">编辑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

        {/* Bottom CTA */}
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-[#0d0b14] via-[#0d0b14]/95 to-transparent px-5 pb-6 pt-6">
          <button
            onClick={() => navigate({ to: "/huatangchun" })}
            className="block w-full rounded-2xl px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_18px_40px_-12px_rgba(232,107,90,0.55)] active:scale-[0.99] transition"
            style={{ background: "var(--gradient-rouge)" }}
          >
            确认改编 · 进入互动文游
          </button>
        </div>
      </div>
    </PhoneMockup>
  );
}
