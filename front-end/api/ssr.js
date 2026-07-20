// Vercel Node.js Serverless Function: TanStack Start SSR
// 处理所有非 /api/ 的页面请求

let handler;
async function getHandler() {
  if (!handler) {
    const mod = await import("../dist/server/index.js");
    handler = mod.default;
  }
  return handler;
}

export default async function (req, res) {
  try {
    const fn = await getHandler();
    const url = `https://${req.headers.host || "localhost"}${req.url}`;

    const body = req.method === "POST" ? await readBody(req) : undefined;
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v) headers.set(k, typeof v === "string" ? v : v.join(", "));
    }

    const webReq = new Request(url, { method: req.method, headers, body });
    const env = { ...process.env };
    const ctx = { waitUntil() {}, passThroughOnException() {} };

    const webRes = await fn(webReq, env, ctx);
    res.statusCode = webRes.status;
    webRes.headers.forEach((v, k) => res.setHeader(k, v));
    const text = await webRes.text();
    res.end(text);
  } catch (err) {
    console.error("[ssr]", err);
    res.status(500).end("Internal Server Error");
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
