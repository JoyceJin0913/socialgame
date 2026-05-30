import { createFileRoute } from "@tanstack/react-router";
import { PhoneMockup } from "@/components/PhoneMockup";
import { Scene } from "./scene";

type PlaySearch = {
  role?: string;
  mode?: string;
  partner?: string;
};

export const Route = createFileRoute("/play")({
  validateSearch: (s: Record<string, unknown>): PlaySearch => ({
    role: typeof s.role === "string" ? s.role : "wentang",
    mode: typeof s.mode === "string" ? s.mode : "solo",
    partner: typeof s.partner === "string" ? s.partner : "peirong",
  }),
  component: PlayPage,
  ssr: false,
  head: () => ({
    meta: [
      { title: "游戏中 · 重生之贵女难求" },
      { name: "description", content: "沉浸式角色对话" },
    ],
  }),
});

function PlayPage() {
  return (
    <PhoneMockup>
      <Scene />
    </PhoneMockup>
  );
}
