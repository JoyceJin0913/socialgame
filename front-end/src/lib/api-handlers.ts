/**
 * API handlers · 在 server.ts 中被路径拦截
 * 目前只有 /api/chat（DeepSeek 代理，从 dist/api/chat.js 迁移）
 */

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

/**
 * /api/chat handler
 * Cloudflare Workers env 上的 secret: DEEPSEEK_API_KEY
 * Node 上 fallback 到 process.env
 */
export async function handleChat(request: Request, env: any): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // 取 API key —— Cloudflare Workers 用 env，Node 用 process.env
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

  const { messages, temperature = 0.85, max_tokens = 400 } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonResponse({ error: "messages 不能为空" }, 400);
  }

  try {
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
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return jsonResponse(
        { error: "DeepSeek API 错误", detail: errText },
        upstream.status
      );
    }

    const data: any = await upstream.json();
    const reply: string = data?.choices?.[0]?.message?.content?.trim() || "";
    return jsonResponse({ reply, usage: data?.usage });
  } catch (err: any) {
    return jsonResponse({ error: "上游调用失败", detail: String(err?.message ?? err) }, 502);
  }
}

/**
 * 路由分发
 */
export function routeAPI(request: Request, env: any): Promise<Response> | null {
  const url = new URL(request.url);
  if (url.pathname === "/api/chat") return handleChat(request, env);
  return null; // 不是 API 路径
}
