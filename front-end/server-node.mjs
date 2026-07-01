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
import { createReadStream } from "node:fs";
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
  ".mp4": "video/mp4",
  ".m4a": "audio/mp4",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
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
    return {
      path: filePath,
      size: s.size,
      type: MIME[extOf(filePath)] || "application/octet-stream",
    };
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
        const range = req.headers.range;
        // 支持 Range 请求（视频 seek/分段加载依赖 206，否则播放器可能拒播）
        const m = range && /^bytes=(\d*)-(\d*)$/.exec(range);
        if (m && (m[1] || m[2])) {
          const start = m[1] ? parseInt(m[1], 10) : 0;
          const end = m[2] ? parseInt(m[2], 10) : file.size - 1;
          if (start > end || start >= file.size) {
            res.writeHead(416, { "Content-Range": `bytes */${file.size}` });
            res.end();
            return;
          }
          res.writeHead(206, {
            "Content-Type": file.type,
            "Content-Range": `bytes ${start}-${end}/${file.size}`,
            "Accept-Ranges": "bytes",
            "Content-Length": end - start + 1,
            "Cache-Control": "public, max-age=3600",
          });
          if (req.method === "HEAD") return res.end();
          createReadStream(file.path, { start, end }).pipe(res);
          return;
        }
        res.writeHead(200, {
          "Content-Type": file.type,
          "Content-Length": file.size,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=3600",
        });
        if (req.method === "HEAD") return res.end();
        createReadStream(file.path).pipe(res);
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
