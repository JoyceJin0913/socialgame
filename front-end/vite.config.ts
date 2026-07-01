// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// EdgeOne 适配器仅在 EDGEONE_BUILD=1 时动态加载，避免正常 dev/build 模式下
// 因 @edgeone/tanstack-start 传递依赖把 @tanstack/router-core 拉到不兼容版本。
async function loadEdgeOnePlugins() {
  if (process.env.EDGEONE_BUILD !== "1") return [];
  const { edgeoneTanStackStartAdapter } = await import("@edgeone/tanstack-start");
  return [edgeoneTanStackStartAdapter()];
}

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: await loadEdgeOnePlugins(),
    server: {
      allowedHosts: ["meter-folder-assets-trackback.trycloudflare.com"],
      // 不再需要 proxy 到外部后端：/api/chat 已经在 server.ts 中由
      // routeAPI() 接管，本地 dev 时 Cloudflare/Vite 的 SSR worker 直接
      // 处理。读 DEEPSEEK_API_KEY 来自 .dev.vars（Cloudflare 约定）
      // 或 process.env（普通 Node）。
    },
  },
});
