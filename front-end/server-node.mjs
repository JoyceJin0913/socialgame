/**
 * Node HTTP 适配器（用于 CloudBase CloudRun 容器部署）
 *
 * 项目本身构建产物面向 Cloudflare Workers（导出标准的 fetch(request, env, ctx)）。
 * 本适配器把它包装成一个监听 PORT 的普通 Node HTTP 服务：
 *   1. GET/HEAD 请求先尝试命中 dist/client 下的静态文件（/assets、/prism、*.html ...）
 *   2. 未命中则交给 worker.fetch 处理（SSR 页面 + /api/chat 等服务端逻辑）
 *
 * DEEPSEEK_API_KEY 通过容器环境变量注入，worker 内部会从 env 读取。
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, normalize } from "node:path";
import worker from "./dist/server/index.js";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const CLIENT_DIR = join(ROOT, "dist", "client");
const PORT = Number(process.env.PORT) || 8080;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
};

function extOf(p) {
  const i = p.lastIndexOf(".");
  return i >= 0 ? p.slice(i).toLowerCase() : "";
}

async function tryStaticFile(pathname) {
  let clean;
  try {
    clean = decodeURIComponent(pathname);
  } catch {
    clean = pathname;
  }
  clean = normalize(clean);
  if (clean.endsWith("/") || clean.includes("..")) return null;
  const filePath = join(CLIENT_DIR, clean);
  if (!filePath.startsWith(CLIENT_DIR)) return null; // 防目录穿越
  try {
    const s = await stat(filePath);
    if (!s.isFile()) return null;
    const data = await readFile(filePath);
    return { data, type: MIME[extOf(filePath)] || "application/octet-stream" };
  } catch {
    return null;
  }
}

function toWebRequest(req, bodyBuffer) {
  const host = req.headers.host || `localhost:${PORT}`;
  const url = `http://${host}${req.url}`;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v === undefined) continue;
    headers.set(k, Array.isArray(v) ? v.join(", ") : v);
  }
  const method = req.method || "GET";
  const init = { method, headers };
  if (method !== "GET" && method !== "HEAD" && bodyBuffer && bodyBuffer.length) {
    init.body = bodyBuffer;
  }
  return new Request(url, init);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  try {
    const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    // 1) 静态资源优先
    if (req.method === "GET" || req.method === "HEAD") {
      const file = await tryStaticFile(u.pathname);
      if (file) {
        res.writeHead(200, {
          "Content-Type": file.type,
          "Cache-Control": "public, max-age=3600",
        });
        res.end(req.method === "HEAD" ? undefined : file.data);
        return;
      }
    }

    // 2) 交给 worker 处理 SSR + API
    const body =
      req.method !== "GET" && req.method !== "HEAD" ? await readBody(req) : undefined;
    const webReq = toWebRequest(req, body);
    const env = { ...process.env };
    const ctx = { waitUntil() {}, passThroughOnException() {} };

    const webRes = await worker.fetch(webReq, env, ctx);
    res.statusCode = webRes.status;
    webRes.headers.forEach((value, key) => res.setHeader(key, value));
    const ab = await webRes.arrayBuffer();
    res.end(Buffer.from(ab));
  } catch (err) {
    console.error("[server-node] error:", err);
    if (!res.headersSent) res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[server-node] listening on http://0.0.0.0:${PORT}`);
});
