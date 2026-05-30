/**
 * Chat Client + 翻译层
 * - chatWithAI: 主对话调用 /api/chat（非流，向后兼容）
 * - chatWithAIStream: 主对话流式版（推荐使用）
 * - translateIntent: Prism 方案 B 翻译层（短文本，保留非流）
 */

import type { PrismMeta } from "./prism";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  usage?: any;
}

export interface Persona {
  name: string;
  system: string;
}

export interface StreamHandlers {
  onChunk?: (delta: string, accumulated: string) => void;
  onDone?: (fullText: string) => void;
  onError?: (err: Error) => void;
  signal?: AbortSignal;
}

const CHAT_ENDPOINT = "/api/chat";

async function callChat(body: {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}): Promise<ChatResponse> {
  const resp = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error((err as any).error || `HTTP ${resp.status}`);
  }
  return resp.json();
}

/**
 * 主对话调用（非流式，向后兼容）
 */
export async function chatWithAI(persona: Persona, history: ChatMessage[]): Promise<string> {
  const messages: ChatMessage[] = [
    { role: "system", content: persona.system },
    ...history,
  ];
  const data = await callChat({ messages, temperature: 0.9, max_tokens: 200 });
  return data.reply || "（沉默良久，未发一言。）";
}

/**
 * 主对话流式调用
 * 收到上游 SSE 后，逐 chunk 解析 OpenAI 兼容格式：
 *   data: {"choices":[{"delta":{"content":"…"}}]}
 *   data: [DONE]
 *
 * 关键：由于 Vercel Node Function 对 SSE 有初始缓冲（chunk 攒批后
 * 一次性下发），单纯依赖 onChunk 渲染会看起来"一卡一卡"。
 * 这里加一个"显示打字器"：
 *   - 后端送来的字符进 pendingBuf
 *   - 一个 setTimeout 节奏循环（每 TYPE_INTERVAL_MS 取 N 个字喂给 onChunk）
 *   - 当上游 done 时，把剩余 buffer 慢慢吐完才触发 onDone
 * 这样无论后端是攒批送 100 字还是真正逐字送，用户看到的都是
 * 平稳的"打字"节奏。
 */
const TYPE_INTERVAL_MS = 30;   // 多久取一次
const TYPE_CHARS_PER_TICK = 2; // 每次取几个字

export async function chatWithAIStream(
  persona: Persona,
  history: ChatMessage[],
  handlers: StreamHandlers = {}
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: "system", content: persona.system },
    ...history,
  ];

  let resp: Response;
  try {
    resp = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        temperature: 0.9,
        max_tokens: 200,
        stream: true,
      }),
      signal: handlers.signal,
    });
  } catch (err: any) {
    handlers.onError?.(err);
    throw err;
  }

  if (!resp.ok) {
    const errPayload = await resp.json().catch(() => ({}));
    const err = new Error((errPayload as any).error || `HTTP ${resp.status}`);
    handlers.onError?.(err);
    throw err;
  }

  if (!resp.body) {
    const err = new Error("响应没有 body 流");
    handlers.onError?.(err);
    throw err;
  }

  // ─── 显示打字器（client-side throttle）────────────────────
  let pendingBuf = "";         // 后端到了但还没"打"出去的字
  let displayed = "";          // 已经"打"出去的字（=最终 reply）
  let upstreamDone = false;    // 上游收到 [DONE] 或读完
  let resolveTyping: (() => void) | undefined;
  const typingComplete = new Promise<void>((r) => (resolveTyping = r));

  const tick = () => {
    if (handlers.signal?.aborted) {
      resolveTyping?.();
      return;
    }
    if (pendingBuf.length > 0) {
      const take = Math.min(TYPE_CHARS_PER_TICK, pendingBuf.length);
      const chunk = pendingBuf.slice(0, take);
      pendingBuf = pendingBuf.slice(take);
      displayed += chunk;
      handlers.onChunk?.(chunk, displayed);
    }
    if (pendingBuf.length === 0 && upstreamDone) {
      resolveTyping?.();
      return;
    }
    setTimeout(tick, TYPE_INTERVAL_MS);
  };
  setTimeout(tick, TYPE_INTERVAL_MS);

  // ─── 上游 SSE 读取（直接把字符塞 pendingBuf，不直接 onChunk）─
  const reader = resp.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let sepIdx: number;
      while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, sepIdx);
        buffer = buffer.slice(sepIdx + 2);

        for (const line of rawEvent.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload) continue;
          if (payload === "[DONE]") {
            buffer = "";
            break;
          }
          try {
            const json = JSON.parse(payload);
            const delta: string =
              json?.choices?.[0]?.delta?.content ??
              json?.choices?.[0]?.message?.content ??
              "";
            if (delta) {
              pendingBuf += delta;   // ← 只塞队列，渲染交给 tick
            }
          } catch {
            // 偶发非 JSON 行忽略
          }
        }
      }
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      upstreamDone = true;
      await typingComplete;
      handlers.onDone?.(displayed);
      return displayed;
    }
    upstreamDone = true;
    handlers.onError?.(err);
    throw err;
  }

  // 上游读完，让 tick 把剩余 pendingBuf 吐完
  upstreamDone = true;
  await typingComplete;

  const finalText = displayed || "（沉默良久，未发一言。）";
  handlers.onDone?.(finalText);
  return finalText;
}

// ── 翻译层 ────────────────────────────────────────────────

const translationCache: Record<string, string> = {};

export interface TranslateContext {
  sceneId: string;
  sceneTag: string;
  sceneName: string;
  aiCharacter: string;
}

export async function translateIntent(
  ctx: TranslateContext,
  intentText: string,
  prismMeta: PrismMeta
): Promise<string> {
  const cacheKey = `${ctx.sceneId}::${prismMeta.id}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  const sceneCtx = `场景：${ctx.sceneTag}，${ctx.sceneName}。NPC：${ctx.aiCharacter}。`;
  const sysPrompt = `你是【庄寒雁】的台词写手。寒雁是一位重生归来、聪明克制、不卑不亢的侯门嫡女。
任务：把一段"行为意图描述"改写成寒雁本人此刻会说出口的话。
${sceneCtx}
【硬规则】
1. 用第一人称，"我"开头或省略主语，绝不能写第三人称（"她……""寒雁……"）
2. 古风口吻，不超过 30 字
3. 如果意图含"动作"，可以用 (圆括号包裹动作描写) + 一句台词
4. 直接输出台词，不要任何解释、引号、序号
5. 保持意图原本的情绪倾向（深情/质问/隐忍/激烈/试探）`;

  try {
    const data = await callChat({
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: `把这个意图改写成寒雁的台词：${intentText}` },
      ],
      temperature: 0.85,
      max_tokens: 80,
    });
    let line = (data.reply || "").trim();
    line = line.replace(/^["「『]|["」』]$/g, "").trim();
    if (!line) throw new Error("empty translation");
    translationCache[cacheKey] = line;
    return line;
  } catch (err) {
    console.warn("[translate] fallback to raw text:", err);
    return intentText;
  }
}

export function clearTranslationCache() {
  for (const k of Object.keys(translationCache)) delete translationCache[k];
}
