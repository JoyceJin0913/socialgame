/**
 * Chat Client + 翻译层
 * - chatWithAI: 主对话调用 /api/chat
 * - translateIntent: Prism 方案 B 翻译层（动作意图 → 寒雁台词）
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
 * 主对话调用：给 NPC 喂 system prompt + 对话历史，返回回复
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
 * 翻译层缓存 · 同一幕内同一选项不重复翻译
 * 注意：模块级缓存，跨 scene 也保留（key 包含 sceneId）
 */
const translationCache: Record<string, string> = {};

export interface TranslateContext {
  sceneId: string;
  sceneTag: string;
  sceneName: string;
  aiCharacter: string;
}

/**
 * 方案 B 翻译层
 * 把 Prism 选项的"动作意图"翻译成寒雁的第一人称古风台词
 * 失败兜底：返回原文
 */
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
3. 如果意图含"动作"，可以用 (圆括号包裹动作描写) + 一句台词，例如：(咬唇低头)"……好。"
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
