/**
 * API handlers · 在 server.ts 中被路径拦截
 * /api/chat 支持两种模式：
 *   - 默认（非流）: 返回 { reply, usage }（向后兼容现有调用方）
 *   - stream:true : 转发 DeepSeek 的 SSE 流给前端（text/event-stream）
 */

import { routeMatchmakingAPI } from "./matchmaker";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const STREAM_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  // 关闭 nginx/cloudbase 等反代的缓冲，否则字符攒在网关一次性吐
  "X-Accel-Buffering": "no",
  ...CORS_HEADERS,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export async function handleChat(request: Request, env: any): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey: string | undefined =
    env?.DEEPSEEK_API_KEY ??
    (typeof process !== "undefined" ? process.env?.DEEPSEEK_API_KEY : undefined);
  if (!apiKey) {
    return jsonResponse(
      {
        error:
          "未配置 DEEPSEEK_API_KEY。Cloudflare 部署：wrangler secret put DEEPSEEK_API_KEY；Vercel 部署：Settings → Environment Variables；本地：.dev.vars 或 .env",
      },
      500
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return jsonResponse({ error: "请求体不是合法 JSON" }, 400);
  }

  const { messages, temperature = 0.85, max_tokens = 400, stream = false } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonResponse({ error: "messages 不能为空" }, 400);
  }

  try {
    // 超时控制：25s 内 DeepSeek 无响应则返回 504
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    const upstream = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature,
        max_tokens,
        stream,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      const errText = await upstream.text();
      return jsonResponse(
        { error: "DeepSeek API 错误", detail: errText },
        upstream.status
      );
    }

    // ── 流式：直接透传上游 SSE body 给前端 ──
    if (stream && upstream.body) {
      return new Response(upstream.body, { status: 200, headers: STREAM_HEADERS });
    }

    // ── 非流式：旧的 { reply, usage } 形态 ──
    const data: any = await upstream.json();
    const reply: string = data?.choices?.[0]?.message?.content?.trim() || "";
    return jsonResponse({ reply, usage: data?.usage });
  } catch (err: any) {
    return jsonResponse({ error: "上游调用失败", detail: String(err?.message ?? err) }, 502);
  }
}

export function routeAPI(request: Request, env: any): Promise<Response> | null {
  const url = new URL(request.url);
  if (url.pathname === "/api/chat") return handleChat(request, env);
  if (url.pathname.startsWith("/api/matchmaking")) return routeMatchmakingAPI(request, env);
  return null;
}
