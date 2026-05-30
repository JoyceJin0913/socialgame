// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      allowedHosts: ["meter-folder-assets-trackback.trycloudflare.com"],
      proxy: {
        // /api/chat → dist 的 Vercel dev (vercel dev 默认 3000)
        // 如果端口冲突走 3001/3002，改下面的 target 即可
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
        // /ws 保留给将来的 multiplayer（目前 scene.tsx 不用）
        "/ws": {
          target: "ws://localhost:8000",
          ws: true,
        },
      },
    },
  },
});
