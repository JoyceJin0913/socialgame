import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Share2, MoreHorizontal, Calendar, User, Heart, Sparkles, Lock, Wand2, X, Link2, FileText, Check } from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";
import { PLAYABLE_CHARACTERS, getCharacter } from "@/lib/characters";

export const Route = createFileRoute("/character/$id")({
  loader: ({ params }) => {
    const c = getCharacter(params.id);
    if (!c) throw notFound();
    return c;
  },
  component: () => (
    <PhoneMockup>
      <CharacterDetail />
    </PhoneMockup>
  ),
  notFoundComponent: () => (
    <PhoneMockup>
      <div className="grid h-full place-items-center">
        <div className="text-center">
          <p className="text-sm text-neutral-500">未找到该人物</p>
          <Link to="/" className="mt-3 inline-block text-rose-700 underline">返回首页</Link>
        </div>
      </div>
    </PhoneMockup>
  ),
  errorComponent: ({ error }) => (
    <PhoneMockup>
      <div className="grid h-full place-items-center px-6 text-center text-sm text-neutral-500">
        {error.message}
      </div>
    </PhoneMockup>
  ),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "人物"} · 画堂春` },
      { name: "description", content: loaderData?.desc ?? "" },
    ],
  }),
});

function CharacterDetail() {
  const navigate = useNavigate();
  const c = Route.useLoaderData();
  const [fusionOpen, setFusionOpen] = useState(false);
  const [fusionStep, setFusionStep] = useState<"choose" | "analyzing" | "done">("choose");
  const [zhihuId, setZhihuId] = useState("");
  const [persona, setPersona] = useState("");

  const startAnalyze = () => {
    if (!zhihuId.trim()) return;
    setFusionStep("analyzing");
    setTimeout(() => {
      setPersona(
        "理性细腻 · 偏好长文输出 · 关注历史与人文。习惯用克制的语气表达观点，遇冲突倾向先观察后回应。"
      );
      setFusionStep("done");
    }, 1600);
  };

  const closeFusion = () => {
    setFusionOpen(false);
    setTimeout(() => {
      setFusionStep("choose");
      setZhihuId("");
      setPersona("");
    }, 200);
  };

  const attrs = [
    { icon: Calendar, label: "年龄", value: `${c.age} 岁` },
    { icon: User, label: "身份", value: c.identity },
    { icon: Heart, label: "性格", value: c.personality },
    { icon: Sparkles, label: "擅长", value: c.skill },
    { icon: Lock, label: "秘密", value: c.secret },
  ];

  // Layout: center node + up to 4 around
  const others = c.relations
    .map((r: { id: string; label: string }) => ({ rel: r, char: getCharacter(r.id) }))
    .filter((x: { char: ReturnType<typeof getCharacter> }) => !!x.char) as { rel: { id: string; label: string }; char: NonNullable<ReturnType<typeof getCharacter>> }[];

  const top = others.slice(0, 2);
  const bottom = others.slice(2, 4);

  return (
    <div className="relative h-full bg-white text-neutral-900">
    <div className="relative h-full overflow-y-auto bg-white text-neutral-900 no-scrollbar">
      {/* HERO portrait */}
      <section className="relative h-[55vh] min-h-[460px] w-full overflow-hidden">
        <img src={c.img} alt={c.name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 70%, #ffffff 100%)" }} />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-12">
          <button
            onClick={() => navigate({ to: "/" })}
            className="grid h-9 w-9 place-items-center rounded-full bg-black/25 backdrop-blur-md"
            aria-label="返回"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <button className="grid h-9 w-9 place-items-center rounded-full bg-black/25 backdrop-blur-md">
              <Share2 className="h-4 w-4 text-white" />
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-full bg-black/25 backdrop-blur-md">
              <MoreHorizontal className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Name + motto */}
        <div className="absolute left-6 top-24 z-10 max-w-[60%]">
          <h1 className="font-brush text-[64px] leading-[0.95] text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] tracking-[0.05em]">
            {c.name}
          </h1>
          {c.motto && (
            <p className="mt-3 text-[12px] leading-6 text-white/85 drop-shadow">
              {c.motto}
            </p>
          )}
        </div>
      </section>

      {/* Attributes card */}
      <section className="-mt-10 px-5">
        <div className="rounded-2xl border border-black/5 bg-white/85 p-4 shadow-[0_12px_30px_-15px_rgba(0,0,0,0.18)] backdrop-blur-sm">
          <ul className="divide-y divide-black/5">
            {attrs.map((a) => (
              <li key={a.label} className="flex items-center gap-3 py-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-black/[0.04]">
                  <a.icon className="h-3.5 w-3.5 text-neutral-500" />
                </span>
                <span className="w-12 shrink-0 text-[12px] text-neutral-500">{a.label}</span>
                <span className="text-[13px] leading-6 text-neutral-800">{a.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Personality fusion CTA */}
      <section className="mt-4 px-5">
        <button
          onClick={() => setFusionOpen(true)}
          className="group flex w-full items-center justify-between rounded-2xl border border-black/5 bg-white/85 px-4 py-3.5 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.2)] backdrop-blur-sm transition active:scale-[0.99]"
        >
          <span className="flex items-center gap-3">
            <span
              className="grid h-9 w-9 place-items-center rounded-full text-white"
              style={{ background: "var(--gradient-rouge)" }}
            >
              <Wand2 className="h-4 w-4" />
            </span>
            <span className="flex flex-col items-start">
              <span className="text-[14px] font-medium text-neutral-900">个人性格融入</span>
              <span className="text-[11px] text-neutral-500">将你的人设融入「{c.name}」，演出更像你</span>
            </span>
          </span>
          <span className="text-[11px] text-neutral-400">去定制 ›</span>
        </button>
      </section>

      {/* Relations */}
      <section className="mt-8 px-5">
        <div className="flex items-center gap-2 px-1">
          <span className="font-brush" style={{ color: "var(--rouge)" }}>❀</span>
          <h2 className="font-brush text-lg text-neutral-900">人物关系</h2>
        </div>

        <div className="relative mt-5 grid grid-cols-3 items-center gap-3 px-2">
          {/* connecting lines */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            <g stroke="oklch(0.48 0.12 20 / 0.35)" strokeWidth="1" strokeDasharray="3 3" fill="none">
              <line x1="20%" y1="22%" x2="50%" y2="50%" />
              <line x1="80%" y1="22%" x2="50%" y2="50%" />
              <line x1="20%" y1="78%" x2="50%" y2="50%" />
              <line x1="80%" y1="78%" x2="50%" y2="50%" />
            </g>
          </svg>

          {/* top row */}
          <RelationNode item={top[0]} />
          <div />
          <RelationNode item={top[1]} />

          {/* center */}
          <div />
          <div className="relative z-10 flex flex-col items-center">
            <div className="h-16 w-16 overflow-hidden rounded-full ring-2 ring-white shadow-[0_6px_20px_-8px_rgba(0,0,0,0.35)]">
              <img src={c.img} alt={c.name} className="h-full w-full object-cover" />
            </div>
            <span className="mt-2 text-[12px] font-medium text-neutral-900">{c.name}</span>
          </div>
          <div />

          {/* bottom row */}
          <RelationNode item={bottom[0]} />
          <div />
          <RelationNode item={bottom[1]} />
        </div>
      </section>

      {/* Story */}
      <section className="mt-10 px-5">
        <div className="flex items-center gap-2 px-1">
          <span className="font-brush" style={{ color: "var(--rouge)" }}>❀</span>
          <h2 className="font-brush text-lg text-neutral-900">人物故事</h2>
        </div>
        <p className="mt-3 px-1 text-[13px] leading-7 text-neutral-700">{c.story}</p>
      </section>

      {/* All characters strip */}
      <section className="mt-10 px-5 pb-28">
        <div className="flex items-center gap-2 px-1">
          <span className="font-brush" style={{ color: "var(--rouge)" }}>❀</span>
          <h2 className="font-brush text-lg text-neutral-900">其他角色</h2>
        </div>
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-2">
          {PLAYABLE_CHARACTERS.filter((x) => x.id !== c.id).map((x) => (
            <Link
              key={x.id}
              to="/character/$id"
              params={{ id: x.id }}
              className="relative h-[110px] w-[80px] shrink-0 overflow-hidden rounded-xl border border-black/5"
            >
              <img src={x.img} alt={x.name} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <span className="absolute inset-x-0 bottom-1 text-center text-[11px] text-white">{x.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>


      {/* Personality fusion modal */}
      {fusionOpen && (
        <div className="absolute inset-0 z-40 flex items-end justify-center" onClick={closeFusion}>
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full rounded-t-3xl bg-white p-5 pb-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" style={{ color: "var(--rouge)" }} />
                <h3 className="font-brush text-lg text-neutral-900">个人性格融入</h3>
              </div>
              <button onClick={closeFusion} className="grid h-8 w-8 place-items-center rounded-full bg-black/[0.04]">
                <X className="h-4 w-4 text-neutral-500" />
              </button>
            </div>

            {fusionStep === "choose" && (
              <>
                <p className="text-[12px] leading-6 text-neutral-500">
                  授权分析你在知乎的历史发文与互动，AI 将生成你的专属人设，与「{c.name}」融合后，让角色的语气与选择更贴近你本人。
                </p>

                <div className="mt-4 space-y-2">
                  <label className="flex items-center gap-3 rounded-xl border border-black/5 bg-white px-3 py-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0066FF]/10">
                      <Link2 className="h-4 w-4 text-[#0066FF]" />
                    </span>
                    <div className="flex-1">
                      <div className="text-[13px] font-medium text-neutral-900">知乎主页 / ID</div>
                      <input
                        value={zhihuId}
                        onChange={(e) => setZhihuId(e.target.value)}
                        placeholder="粘贴主页链接或输入用户 ID"
                        className="mt-1 w-full bg-transparent text-[12px] text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
                      />
                    </div>
                  </label>

                  <button className="flex w-full items-center gap-3 rounded-xl border border-dashed border-black/10 bg-white px-3 py-3 text-left">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-black/[0.04]">
                      <FileText className="h-4 w-4 text-neutral-500" />
                    </span>
                    <div className="flex-1">
                      <div className="text-[13px] font-medium text-neutral-900">手动描述我的人设</div>
                      <div className="text-[11px] text-neutral-500">用一段话告诉 AI 你是谁</div>
                    </div>
                  </button>
                </div>

                <button
                  onClick={startAnalyze}
                  disabled={!zhihuId.trim()}
                  className="mt-5 w-full rounded-full py-3 text-[13px] font-medium text-white shadow-[var(--shadow-card)] transition active:scale-[0.99] disabled:opacity-40"
                  style={{ background: "var(--gradient-rouge)" }}
                >
                  开始分析并生成人设
                </button>
                <p className="mt-3 text-center text-[10px] text-neutral-400">
                  授权信息仅用于本次人设生成，不对外公开
                </p>
              </>
            )}

            {fusionStep === "analyzing" && (
              <div className="flex flex-col items-center py-10">
                <div
                  className="h-12 w-12 animate-spin rounded-full border-2 border-transparent"
                  style={{ borderTopColor: "var(--rouge)", borderRightColor: "var(--rouge)" }}
                />
                <p className="mt-4 text-[13px] text-neutral-700">正在分析你的发文与互动…</p>
                <p className="mt-1 text-[11px] text-neutral-400">AI 正在为你生成专属人设标签</p>
              </div>
            )}

            {fusionStep === "done" && (
              <>
                <div className="rounded-2xl border border-black/5 bg-[var(--rouge)]/5 p-4">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" style={{ color: "var(--rouge)" }} />
                    <span className="text-[13px] font-medium text-neutral-900">你的人设已生成</span>
                  </div>
                  <p className="mt-2 text-[12px] leading-6 text-neutral-700">{persona}</p>
                </div>
                <p className="mt-4 text-[11px] text-neutral-500">
                  融合后，「{c.name}」在剧中的语气、选择会更贴近你本人的表达习惯。
                </p>
                <button
                  onClick={closeFusion}
                  className="mt-5 w-full rounded-full py-3 text-[13px] font-medium text-white shadow-[var(--shadow-card)] transition active:scale-[0.99]"
                  style={{ background: "var(--gradient-rouge)" }}
                >
                  确认融入
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RelationNode({
  item,
}: {
  item?: { rel: { id: string; label: string }; char: { id: string; name: string; role: string; img: string } };
}) {
  if (!item) return <div />;
  return (
    <Link
      to="/character/$id"
      params={{ id: item.char.id }}
      className="relative z-10 flex flex-col items-center"
    >
      <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-white shadow-[0_4px_14px_-6px_rgba(0,0,0,0.3)]">
        <img src={item.char.img} alt={item.char.name} className="h-full w-full object-cover" />
      </div>
      <span className="mt-1.5 text-[12px] text-neutral-800">{item.char.name}</span>
      <span className="text-[10px] text-neutral-500">{item.rel.label}</span>
    </Link>
  );
}
