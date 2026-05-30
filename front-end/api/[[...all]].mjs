/**
 * Vercel catch-all · 把整个请求转发给 Cloudflare Worker fetch handler
 *
 * 注：TanStack Start 编译出的 bundle 用了 node:stream 等 Node-only API，
 *     无法跑在 Edge runtime。所以只能用 Node runtime。
 *     SSE 的"逐字"流畅感由客户端 chat.ts 的 throttle 渲染来模拟。
 */
import worker from "../dist/server/index.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
};

async function forward(request) {
  const env = { ...process.env };
  const ctx = { waitUntil() {}, passThroughOnException() {} };

  const webRes = await worker.fetch(request, env, ctx);

  return new Response(webRes.body, {
    status: webRes.status,
    statusText: webRes.statusText,
    headers: webRes.headers,
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const DELETE = forward;
export const PATCH = forward;
export const HEAD = forward;
export const OPTIONS = forward;
