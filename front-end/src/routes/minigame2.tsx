import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";

export const Route = createFileRoute("/minigame2")({
  component: Minigame2Page,
  ssr: false,
  head: () => ({
    meta: [
      { title: "王府御敌 · 小游戏2" },
      { name: "description", content: "王府御敌小游戏" },
    ],
  }),
});

function Minigame2Page() {
  const navigate = useNavigate();
  return (
    <PhoneMockup>
      <div className="relative h-full w-full overflow-hidden bg-black">
        <button
          onClick={() =>
            navigate({ to: "/play", search: { role: "hanyan", mode: "solo", partner: "peirong" } })
          }
          className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white/90 backdrop-blur-md active:scale-95"
          aria-label="返回"
        >
          <ChevronLeft size={18} />
        </button>
        <iframe
          src="/minigame2.html"
          title="王府御敌"
          className="h-full w-full border-0"
        />
      </div>
    </PhoneMockup>
  );
}
