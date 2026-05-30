import { createFileRoute, redirect } from "@tanstack/react-router";

// /play 旧入口（兼容外部链接），统一重定向到 /scene
export const Route = createFileRoute("/play")({
  beforeLoad: () => {
    throw redirect({ to: "/scene" });
  },
});
