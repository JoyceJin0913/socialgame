import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";

export const Route = createFileRoute("/minigame2")({
  validateSearch: (s: Record<string, unknown>) => ({
    from: typeof s.from === "string" ? s.from : undefined,
    returnTo: typeof s.returnTo === "string" ? s.returnTo : undefined,
  }),
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
  const { from, returnTo } = Route.useSearch();

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "minigame2:complete") return;
      if (from === "scene" && returnTo) {
        navigate({ href: returnTo });
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [from, navigate, returnTo]);

  const frameSrc =
    from === "scene" ? "/minigame2.html?from=scene" : "/minigame2.html";

  return (
    <PhoneMockup>
      <div className="relative h-full w-full overflow-hidden bg-black">
        <button
          onClick={() =>
            returnTo
              ? navigate({ href: returnTo })
              : navigate({ to: "/play", search: { role: "hanyan", mode: "solo", partner: "peirong" } })
          }
          className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white/90 backdrop-blur-md active:scale-95"
          aria-label="返回"
        >
          <ChevronLeft size={18} />
        </button>
        <iframe
          src={frameSrc}
          title="王府御敌"
          className="h-full w-full border-0"
        />
      </div>
    </PhoneMockup>
  );
}
