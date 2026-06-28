import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Award, BookOpen, ChevronLeft, Edit3, Flame, Sparkles, Trophy, Users } from "lucide-react";
import heroHuatang from "@/assets/hero-huatangchun.jpg";
import coverChangan from "@/assets/cover-changan.jpg";
import coverWu from "@/assets/cover-wugang.jpg";
import { PhoneMockup } from "@/components/PhoneMockup";
import { readPlayerProfile } from "@/lib/player-profile";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "我的 Profile · 互动文游" },
      { name: "description", content: "查看游玩记录、同玩玩家、成就与高光时刻。" },
    ],
  }),
});

const HISTORY = [
  {
    id: "h1",
    title: "重生之贵女难求",
    role: "庄寒雁",
    partner: "江雪初停",
    partnerRole: "傅云夕",
    time: "今天",
    result: "离心时刻 · 未完待续",
    cover: heroHuatang,
  },
  {
    id: "h2",
    title: "长安花事",
    role: "红衣客",
    partner: "月照回廊",
    partnerRole: "谢小侯",
    time: "3 天前",
    result: "灯市相逢 · 普通结局",
    cover: coverChangan,
  },
  {
    id: "h3",
    title: "雾港谜案",
    role: "记者",
    partner: "青玉案",
    partnerRole: "探长",
    time: "上周",
    result: "码头旧案 · 线索缺失",
    cover: coverWu,
  },
];

const ACHIEVEMENTS = [
  { id: "a1", title: "初入画堂", desc: "完成第一次入梦登记", icon: Sparkles, unlocked: true },
  { id: "a2", title: "双人对戏", desc: "与朋友完成一次联机匹配", icon: Users, unlocked: true },
  { id: "a3", title: "逆风执棋", desc: "在关键选项中选择反击路线", icon: Trophy, unlocked: true },
  { id: "a4", title: "全幕收藏", desc: "完成第五幕全部 3 场戏", icon: Award, unlocked: false },
];

const HIGHLIGHTS = [
  "殿前一句反问，让西戎公主第一次失了笑。",
  "你没有追问傅云夕，只把蓝玉鱼簪收回袖中。",
  "暗巷追杀里，你撑到最后一声呼救才倒下。",
];

function Profile() {
  const navigate = useNavigate();
  const profile = readPlayerProfile();
  const unlockedCount = ACHIEVEMENTS.filter((item) => item.unlocked).length;

  return (
    <div className="relative h-full overflow-y-auto bg-[#fbf7ef] pb-10 no-scrollbar">
      <header className="relative h-[250px] overflow-hidden">
        <img src={heroHuatang} alt="个人主页" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/45 to-[#fbf7ef]" />
        <button
          onClick={() => navigate({ to: "/huatangchun" })}
          className="absolute left-5 top-12 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md active:scale-95"
          aria-label="返回"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => navigate({ to: "/" })}
          className="absolute right-5 top-12 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md active:scale-95"
          aria-label="编辑资料"
        >
          <Edit3 className="h-4 w-4" />
        </button>

        <div className="absolute inset-x-0 bottom-9 px-6 text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/30 bg-white/18 text-[24px] font-semibold backdrop-blur-md">
              {profile.nick.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[24px] font-semibold tracking-wide">{profile.nick}</h1>
              <p className="mt-1 text-[11px] text-white/70">
                {profile.guest ? "游客身份" : "已登记玩家"} · {profile.playStyle || "剧情沉浸"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="-mt-3 space-y-6 px-5">
        <section className="grid grid-cols-3 gap-2">
          <Stat label="同玩玩家" value="6" />
          <Stat label="小说记录" value="3" />
          <Stat label="成就" value={`${unlockedCount}/${ACHIEVEMENTS.length}`} />
        </section>

        <section>
          <SectionTitle icon={<BookOpen className="h-4 w-4" />} title="最近共玩" action="全部" />
          <div className="mt-3 space-y-3">
            {HISTORY.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-2xl border border-black/5 bg-white p-3">
                <img src={item.cover} alt={item.title} className="h-20 w-14 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-[13px] font-semibold text-neutral-900">{item.title}</h3>
                    <span className="shrink-0 text-[10px] text-neutral-400">{item.time}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-500">
                    你饰 {item.role} · 与 {item.partner} 饰 {item.partnerRole}
                  </p>
                  <p className="mt-2 truncate rounded-lg bg-black/[0.04] px-2 py-1.5 text-[11px] text-neutral-600">
                    {item.result}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle icon={<Trophy className="h-4 w-4" />} title="成就墙" action={`${unlockedCount} 已解锁`} />
          <div className="mt-3 grid grid-cols-2 gap-3">
            {ACHIEVEMENTS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-3 ${
                    item.unlocked ? "border-black/5 bg-white" : "border-black/5 bg-black/[0.035] opacity-55"
                  }`}
                >
                  <div
                    className="grid h-9 w-9 place-items-center rounded-xl text-white"
                    style={{ background: item.unlocked ? "var(--gradient-rouge)" : "rgba(0,0,0,0.25)" }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="mt-3 text-[13px] font-semibold text-neutral-900">{item.title}</div>
                  <p className="mt-1 text-[11px] leading-5 text-neutral-500">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <SectionTitle icon={<Flame className="h-4 w-4" />} title="高光时刻" action="精选" />
          <div className="mt-3 space-y-2.5">
            {HIGHLIGHTS.map((text, index) => (
              <div key={text} className="rounded-2xl border border-black/5 bg-white p-4">
                <div className="mb-2 text-[10px] tracking-[0.22em]" style={{ color: "var(--rouge)" }}>
                  MOMENT {String(index + 1).padStart(2, "0")}
                </div>
                <p className="text-[13px] leading-6 text-neutral-700">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-3 text-center">
      <div className="text-[18px] font-semibold text-neutral-900">{value}</div>
      <div className="mt-0.5 text-[10px] text-neutral-500">{label}</div>
    </div>
  );
}

function SectionTitle({ icon, title, action }: { icon: React.ReactNode; title: string; action: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--rouge)" }}>{icon}</span>
        <h2 className="font-brush text-xl text-neutral-900">{title}</h2>
      </div>
      <span className="text-[11px] text-neutral-400">{action}</span>
    </div>
  );
}

function ProfilePage() {
  return (
    <PhoneMockup>
      <Profile />
    </PhoneMockup>
  );
}
