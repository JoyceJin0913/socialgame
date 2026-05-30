import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, MessageCircle, Link2, QrCode } from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";
import { CHARACTERS } from "@/lib/characters";

export const Route = createFileRoute("/invite")({
  component: InvitePage,
  head: () => ({
    meta: [
      { title: "邀请队友 · 画堂春" },
      { name: "description", content: "邀请 3-6 位玩家共入画堂春。" },
    ],
  }),
});

function Invite() {
  const navigate = useNavigate();
  // current user only — picked character from lobby (demo: 温棠)
  const me = CHARACTERS.find((c) => c.id === "wentang")!;
  const empty = [2, 3, 4, 5, 6];

  return (
    <div className="relative h-full overflow-y-auto bg-white px-6 pt-12 pb-6 no-scrollbar">
      <h1 className="font-brush text-[28px] text-neutral-900">邀请队友</h1>
      <p className="mt-1 text-[12px] text-neutral-500">邀请 3-6 位玩家一起游戏</p>

      {/* Slots */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <SlotFilled char={me} />
        {empty.map((n) => (
          <EmptySlot key={n} index={n} />
        ))}
      </div>

      {/* Invite methods */}
      <div className="mt-8">
        <div className="text-[12px] text-neutral-700">邀请方式</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <InviteMethod icon={<MessageCircle className="h-5 w-5 text-emerald-600" />} label="微信邀请" />
          <InviteMethod icon={<Link2 className="h-5 w-5 text-neutral-600" />} label="复制链接" />
          <InviteMethod icon={<QrCode className="h-5 w-5 text-neutral-600" />} label="二维码邀请" />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-10 flex gap-3">
        <button
          onClick={() => navigate({ to: "/lobby" })}
          className="h-12 flex-1 rounded-full border border-black/15 bg-white text-[13px] text-neutral-700 transition active:scale-[0.98]"
        >
          上一步
        </button>
        <button
          onClick={() => navigate({ to: "/confirm" })}
          className="h-12 flex-1 rounded-full text-white shadow-[var(--shadow-card)] transition active:scale-[0.98]"
          style={{ background: "var(--gradient-rouge)" }}
        >
          <span className="font-brush text-base tracking-wider">下一步</span>
        </button>
      </div>
    </div>
  );
}

function SlotFilled({ char }: { char: { name: string; img: string } }) {
  return (
    <div className="relative flex aspect-[3/4.6] flex-col overflow-hidden rounded-2xl border border-black/10 bg-neutral-50">
      <div className="relative flex-1 overflow-hidden">
        <img src={char.img} alt={char.name} className="absolute inset-0 h-full w-full object-cover" />
        <span className="absolute left-2 top-2 rounded-md bg-black/45 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
          我
        </span>
      </div>
      <div className="px-2 py-1.5 text-center">
        <div className="font-brush text-[15px] text-neutral-900">{char.name}</div>
        <div className="mt-0.5 text-[10px] text-emerald-600">已准备</div>
      </div>
    </div>
  );
}

function EmptySlot({ index }: { index: number }) {
  return (
    <button className="flex aspect-[3/4.6] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/15 bg-neutral-50/50 text-neutral-400 transition active:scale-[0.97]">
      <div className="text-[11px]">{index}号位</div>
      <Plus className="h-6 w-6" />
      <div className="text-[11px]">邀请</div>
    </button>
  );
}

function InviteMethod({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex flex-col items-center gap-1.5 rounded-xl py-3 transition active:scale-95">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-black/[0.04]">{icon}</span>
      <span className="text-[11px] text-neutral-600">{label}</span>
    </button>
  );
}

function InvitePage() {
  return (
    <PhoneMockup>
      <Invite />
    </PhoneMockup>
  );
}
