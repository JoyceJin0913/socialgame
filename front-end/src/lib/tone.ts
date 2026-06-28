/**
 * 剧情标签基调系统
 * 让玩家在 lobby 选的标签（复仇/甜宠/权谋…）真正改变游戏：
 *   1) bannerDesc  → 进游戏时的"基调横幅"，让观众一眼看见标签生效
 *   2) promptHint  → 注入 AI system prompt，改变 NPC 对白基调
 *   3) narrationTint → 开场旁白的基调染色（不同标签不同开场氛围）
 */

export interface ToneSpec {
  id: string;
  label: string;
  /** 横幅副标题：一句话点明这一局的风格 */
  bannerDesc: string;
  /** 横幅主色（tailwind 文本/边框色名片段，用于两版横幅配色） */
  accent: string;
  /** 注入 AI system prompt 的基调指令 */
  promptHint: string;
  /** 开场旁白前缀染色：在场景旁白后追加一句符合标签基调的氛围句 */
  narrationTint: string;
}

export const TONE_SPECS: Record<string, ToneSpec> = {
  sweet: {
    id: "sweet",
    label: "甜宠",
    bannerDesc: "对白偏向温情、迁就，藏不住的在意",
    accent: "rose",
    promptHint:
      "【本局基调：甜宠】请让你的回应更温情、更迁就对方，即使表面克制，也要在动作和措辞里漏出藏不住的在意与心软。",
    narrationTint: "他难得朝你伸出手，掌心的温度透过寒夜传来，你的心跳漏了一拍。",
  },
  revenge: {
    id: "revenge",
    label: "复仇",
    bannerDesc: "对白偏向冷冽、算计，步步紧逼",
    accent: "red",
    promptHint:
      "【本局基调：复仇】请让你的回应更冷冽、更锋利，话里藏着试探与算计，气氛紧绷如弦。",
    narrationTint: "你看着他，心里却在盘算另一件事——这一局，谁也别想再算计你。",
  },
  court: {
    id: "court",
    label: "权谋",
    bannerDesc: "对白偏向步步为营，话里有话",
    accent: "amber",
    promptHint:
      "【本局基调：权谋】请让你的回应话里有话、点到为止，每句都像在落一步棋，机锋暗藏。",
    narrationTint: "殿宇深深，你们交换的每一个眼神，都像棋盘上落下的一子。",
  },
  tragedy: {
    id: "tragedy",
    label: "虐恋",
    bannerDesc: "对白偏向痛感拉满，欲言又止，相爱相杀",
    accent: "purple",
    promptHint:
      "【本局基调：虐恋】请让你的回应痛感更重，明明在乎却偏要说狠话，欲言又止，把相爱相杀的撕扯感拉满。",
    narrationTint: "明明近在咫尺，却像隔着一整个生死。你想伸手，又怕这一碰便是永别。",
  },
  comedy: {
    id: "comedy",
    label: "轻喜",
    bannerDesc: "对白偏向轻快、带点小俏皮，松弛中藏深情",
    accent: "emerald",
    promptHint:
      "【本局基调：轻喜】请让你的回应轻快一些，带点不着痕迹的小俏皮和斗嘴，在松弛里藏住认真。",
    narrationTint: "他板着脸说狠话，眼底却没什么威慑力，你差点没忍住笑出来。",
  },
  mystery: {
    id: "mystery",
    label: "悬疑",
    bannerDesc: "对白偏向遮掩、留扣子，真相忽隐忽现",
    accent: "slate",
    promptHint:
      "【本局基调：悬疑】请让你的回应多一层遮掩和保留，话里留扣子，让真相忽隐忽现，引人追问。",
    narrationTint: "他的话里似乎少了一截，那截空白处藏着的，正是你最想知道的东西。",
  },
  rebirth: {
    id: "rebirth",
    label: "重生",
    bannerDesc: "对白偏向今昔对照，宿命感与不甘交织",
    accent: "cyan",
    promptHint:
      "【本局基调：重生】请在回应里隐隐透出今生与前世的对照感，宿命的重量与改写命运的不甘交织。",
    narrationTint: "这一幕你仿佛经历过——可这一次，你绝不让它再走向旧日的结局。",
  },
  modern: {
    id: "modern",
    label: "穿越",
    bannerDesc: "对白偏向错位感，古今碰撞的微妙违和",
    accent: "indigo",
    promptHint:
      "【本局基调：穿越】请让回应带一点古今错位的微妙感，对方偶尔会被你不合时宜的言行弄得一愣。",
    narrationTint: "你一时分不清此身是梦是真，眼前的古意宫闱，竟比记忆里的世界还要鲜活。",
  },
};

/** 标签可能以 id（revenge）或中文 label（复仇）传入，建一张归一化查找表 */
const TONE_INDEX: Record<string, ToneSpec> = (() => {
  const idx: Record<string, ToneSpec> = {};
  for (const spec of Object.values(TONE_SPECS)) {
    idx[spec.id] = spec;
    idx[spec.label] = spec;
  }
  return idx;
})();

function lookupTone(tag: string): ToneSpec | undefined {
  return TONE_INDEX[tag.trim()];
}

/** 取第一个有效标签的基调（多选时以第一个为主调，其余作 AI 融合提示） */
export function resolveTone(tags: string[] | undefined): ToneSpec | null {
  if (!tags || tags.length === 0) return null;
  for (const t of tags) {
    const spec = lookupTone(t);
    if (spec) return spec;
  }
  return null;
}

/** 多标签时拼一段融合提示，供 AI 同时参考多个基调 */
export function buildTonePromptHint(tags: string[] | undefined): string {
  if (!tags || tags.length === 0) return "";
  const specs = tags.map((t) => lookupTone(t)).filter(Boolean) as ToneSpec[];
  if (specs.length === 0) {
    // 全是自定义标签：直接把标签词喂给 AI 自由发挥
    const custom = (tags || []).map((t) => t.trim()).filter(Boolean);
    if (custom.length) {
      return `【本局基调：${custom.join("、")}】请让你的对白风格贴合以上关键词所暗示的氛围。`;
    }
    return "";
  }
  if (specs.length === 1) return specs[0].promptHint;
  const labels = specs.map((s) => s.label).join("、");
  const merged = specs.map((s) => s.promptHint.replace(/^【[^】]*】/, "")).join(" ");
  return `【本局基调：${labels}（请融合这几种风格）】${merged}`;
}
