import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, ChevronRight, ShieldCheck, Sparkles, UserRound, Users } from "lucide-react";
import heroHuatang from "@/assets/hero-huatangchun.jpg";
import { PhoneMockup } from "@/components/PhoneMockup";
import { DEFAULT_PROFILE, normalizeNick, readPlayerProfile, savePlayerProfile } from "@/lib/player-profile";

type EntrySearch = { entered?: string };

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): EntrySearch => ({
    entered: typeof s.entered === "string" ? s.entered : undefined,
  }),
  component: EntryPage,
  head: () => ({
    meta: [
      { title: "入梦登记 · 重生之贵女难求" },
      { name: "description", content: "进入互动文游前设置昵称，也可用游客身份体验。" },
    ],
  }),
});

const AGE_RANGES = ["18 以下", "18-24", "25-34", "35+"];
const PRONOUNS = ["她", "他", "TA"];
const PLAY_STYLES = ["剧情沉浸", "高能对戏", "轻松社交"];

function Entry() {
  const navigate = useNavigate();
  const { entered } = Route.useSearch();
  const saved = readPlayerProfile();
  const [nick, setNick] = useState(saved.nick === DEFAULT_PROFILE.nick ? "" : saved.nick);
  const [ageRange, setAgeRange] = useState(saved.ageRange);
  const [pronoun, setPronoun] = useState(saved.pronoun);
  const [playStyle, setPlayStyle] = useState(saved.playStyle || PLAY_STYLES[0]);

  // 已登记用户带 ?entered=1 进入时（如从 /novel 顶部按钮回来），直接跳过登记页
  useEffect(() => {
    if (entered !== "1") return;
    const stored = readPlayerProfile();
    if (stored.nick && stored.nick !== DEFAULT_PROFILE.nick) {
      navigate({ to: "/huatangchun", replace: true });
    }
  }, [entered, navigate]);

  const cleanNick = normalizeNick(nick);
  const canEnter = nick.trim().length > 0;

  const enter = (guest: boolean) => {
    if (!canEnter) return;
    savePlayerProfile({
      nick: cleanNick,
      ageRange,
      pronoun,
      playStyle,
      contactCode: saved.contactCode,
      guest,
      createdAt: saved.createdAt,
    });
    navigate({ to: "/huatangchun" });
  };

  return (
    <div className="relative h-full overflow-y-auto bg-[#fbf7ef] pb-8 no-scrollbar">
      <section className="relative h-[260px] overflow-hidden">
        <img src={heroHuatang} alt="重生之贵女难求" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-[#fbf7ef]" />
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="absolute right-5 top-12 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md active:scale-95"
          aria-label="个人主页"
        >
          <UserRound className="h-4 w-4" />
        </button>
        <div className="absolute inset-x-0 bottom-10 px-6 text-white">
          <div className="flex items-center gap-1.5 text-[10px] tracking-[0.28em] text-white/70">
            <Sparkles className="h-3.5 w-3.5" />
            入梦前登记
          </div>
          <h1 className="mt-2 font-brush text-[38px] leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            先留下一个名字
          </h1>
          <p className="mt-2 max-w-[300px] text-[12px] leading-5 text-white/78">
            多人联机时，朋友会通过昵称在大厅里找到你。
          </p>
        </div>
      </section>

      <main className="-mt-6 space-y-5 px-5">
        <section className="relative rounded-2xl border border-black/5 bg-white p-4 shadow-[0_16px_36px_-24px_rgba(0,0,0,0.35)]">
          <label className="text-[11px] font-medium text-neutral-500">昵称</label>
          <input
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            maxLength={12}
            placeholder="例如：江雪初停"
            className="mt-2 h-12 w-full rounded-xl border border-black/10 bg-black/[0.03] px-3 text-[15px] text-neutral-900 outline-none placeholder:text-neutral-300 focus:border-black/30"
          />
          <p className="mt-2 text-[11px] text-neutral-400">必填，后续匹配大厅和 Profile 都会显示这个名字。</p>
        </section>

        <section className="rounded-2xl border border-black/5 bg-white p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" style={{ color: "var(--rouge)" }} />
            <h2 className="text-[13px] font-semibold text-neutral-900">基础信息</h2>
          </div>

          <div className="mt-4 space-y-4">
            <ChoiceGroup label="年龄段" value={ageRange} options={AGE_RANGES} onChange={setAgeRange} />
            <ChoiceGroup label="称谓" value={pronoun} options={PRONOUNS} onChange={setPronoun} />
            <ChoiceGroup label="偏好" value={playStyle} options={PLAY_STYLES} onChange={setPlayStyle} />
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <InfoPill icon={<Users className="h-3.5 w-3.5" />} label="联机" value="昵称识别" />
          <InfoPill icon={<BookOpen className="h-3.5 w-3.5" />} label="记录" value="自动归档" />
          <InfoPill icon={<Sparkles className="h-3.5 w-3.5" />} label="成就" value="持续解锁" />
        </section>

        <section className="space-y-3">
          <button
            disabled={!canEnter}
            onClick={() => enter(false)}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full text-[14px] font-medium text-white shadow-[0_16px_34px_-18px_rgba(178,65,58,0.7)] transition active:scale-[0.98] disabled:opacity-45"
            style={{ background: "var(--gradient-rouge)" }}
          >
            完成登记并进入
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            disabled={!canEnter}
            onClick={() => enter(true)}
            className="h-12 w-full rounded-full border border-black/10 bg-white text-[13px] text-neutral-700 transition active:scale-[0.98] disabled:opacity-45"
          >
            以游客身份进入
          </button>
        </section>
      </main>
    </div>
  );
}

function ChoiceGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-medium text-neutral-500">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(value === option ? "" : option)}
            className={`rounded-full px-3 py-1.5 text-[12px] transition active:scale-95 ${
              value === option ? "bg-neutral-900 text-white" : "bg-black/[0.05] text-neutral-600"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function InfoPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-3">
      <div className="flex items-center gap-1.5 text-neutral-500">
        {icon}
        <span className="text-[10px]">{label}</span>
      </div>
      <div className="mt-1 text-[12px] font-medium text-neutral-900">{value}</div>
    </div>
  );
}

function EntryPage() {
  return (
    <PhoneMockup>
      <Entry />
    </PhoneMockup>
  );
}
