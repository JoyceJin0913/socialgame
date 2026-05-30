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
 * 每收到一段非空 content 就触发 onChunk，结束时触发 onDone
 * 返回完整文本（也通过 onDone 给出）
 */
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

  const reader = resp.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let accumulated = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE 以 \n\n 分隔事件
      let sepIdx: number;
      while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, sepIdx);
        buffer = buffer.slice(sepIdx + 2);

        // 一个事件可能有多行 data: 前缀（OpenAI 一般一行）
        for (const line of rawEvent.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload) continue;
          if (payload === "[DONE]") {
            // 上游主动收尾
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
              accumulated += delta;
              handlers.onChunk?.(delta, accumulated);
            }
          } catch {
            // 偶发的非 JSON 行直接忽略
          }
        }
      }
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      // 主动取消，不算错误
      handlers.onDone?.(accumulated);
      return accumulated;
    }
    handlers.onError?.(err);
    throw err;
  }

  const finalText = accumulated || "（沉默良久，未发一言。）";
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
