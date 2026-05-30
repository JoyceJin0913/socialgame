/**
 * Numerics System · Hook → State Delta → Ending Route
 *
 * Prism 抛出语义事件名（hook），数值系统决定它对应加多少分。
 * 这里实现：
 *   1) HOOK_TABLE: 每个 hook → 数值向量变化
 *   2) NumericsState: 累积的数值
 *   3) decideEnding: 综合 QTE 结果 + 累积数值 决定最终结局
 */

// ── 维度定义（精简版，对应 prism/scripts 里 delta 字段的常见 key） ──

export interface NumericsState {
  trust: number;        // 信任傅云夕
  courage: number;      // 勇气
  ration: number;       // 理智
  inner: number;        // 内在成长
  publicSym: number;    // 民意
  family: number;       // 家族体面 / 王府势力
  hidden: number;       // 隐蔽
  intel: number;        // 情报
  ally: number;         // 盟友信任
  expose: number;       // 暴露
  endure: number;       // 隐忍
  danger: number;       // 风险
}

export const INITIAL_STATE: NumericsState = {
  trust: 50,
  courage: 50,
  ration: 50,
  inner: 50,
  publicSym: 50,
  family: 50,
  hidden: 50,
  intel: 0,
  ally: 0,
  expose: 0,
  endure: 0,
  danger: 0,
};

// 把 + / ++ / +++ 这种符号映射成实际数值
function symbolValue(sym: string): number {
  const map: Record<string, number> = {
    "+++": 15, "++": 10, "+": 5, "0": 0, "-": -5, "--": -10, "---": -15,
  };
  return map[sym] ?? 0;
}

// 中文 delta key → NumericsState 字段
const DELTA_KEY_MAP: Record<string, keyof NumericsState> = {
  "信任傅云夕": "trust",
  "勇气": "courage",
  "理智": "ration",
  "内在成长": "inner",
  "民意": "publicSym",
  "王府势力": "family",
  "家族体面": "family",
  "隐蔽": "hidden",
  "情报": "intel",
  "盟友信任": "ally",
  "暴露": "expose",
  "暴露风险": "expose",
  "隐忍": "endure",
  "风险": "danger",
  "她的信任": "trust",
  "关系": "trust",
  "她生存率": "trust",
  // 男主视角的其它 key 默认归到 inner
};

/**
 * 应用一次 hook —— 由 prism 选项的 delta 字段（如 { "勇气": "++" }）转成数值变化
 */
export function applyHook(
  state: NumericsState,
  delta: Record<string, string> | undefined
): NumericsState {
  if (!delta) return state;
  const next = { ...state };
  for (const [key, sym] of Object.entries(delta)) {
    const field = DELTA_KEY_MAP[key];
    if (!field) continue;
    const v = symbolValue(sym);
    next[field] = Math.max(0, Math.min(100, next[field] + v));
  }
  return next;
}

// ── 结局判定（按对话选择）─────────────────────────────────

export type EndingKey = "fuyunxi" | "zhuoqi" | "captured";

// 三条"心意线"：玩家每次带 hook 的选择都会投票给其中一条
//   trust 情意线 → 在乎他 / 信他 → 傅云夕鬼面救场
//   self  自立线 → 强硬 / 自立 / 外援 → 卓七路过
//   yield 隐忍线 → 退让 / 沉默 → 失声被擒后自救
export type LineKey = "trust" | "self" | "yield";

export interface EndingPick {
  scene: string;
  label: string;
  line: LineKey;
}

export interface EndingDecision {
  ending: EndingKey;
  reason: string;
  lines: Record<LineKey, number>; // 三条线累计票数
  picks: EndingPick[];            // 每次关键选择的归类（用于结局回顾）
}

export interface ChoiceRecord {
  scene: string;
  hook: string;
}

// 每个 prism hook 归入哪条心意线（覆盖寒雁 / 傅云夕两视角的 pool）
const HOOK_LINE: Record<string, LineKey> = {
  // ── 寒雁视角 ──
  vow_loyalty: "trust",        // 深情立誓
  probe_intent: "trust",       // 追问真心
  investigate_illness: "trust",// 暗察病情
  confront_betrayal: "trust",  // 红眼质问
  block_departure: "trust",    // 拦他不走
  truth_revealed: "trust",     // 看穿伪装（关键）
  silent_consent: "yield",     // 咬唇默受
  tactical_yield: "yield",     // 福身礼让
  accept_silently: "yield",    // 静受休书
  public_grace: "yield",       // 举杯大度
  public_pushback: "self",     // 当朝硬刚
  appeal_throne: "self",       // 殿前进言
  reject_violently: "self",    // 撕碎休书
  reach_ally: "self",          // 暗结外援
  // ── 傅云夕视角 ──
  bind_with_weight: "trust",   // 重诺缚心
  cold_act_with_hint: "trust", // 眼神留隙
  divorce_with_clue: "trust",  // 休书留破绽
  cant_let_go: "trust",        // 撕书重写
  accidental_reveal: "trust",  // 咳血露真（关键）
  mask_with_lightness: "yield",// 轻描淡写
  hide_symptom: "yield",       // 避酒藏疾
  cold_act_complete: "yield",  // 冷演到底
  escape_confrontation: "yield",// 借故离场
  divorce_cruel: "yield",      // 绝情断念
  pre_arrange_safety: "self",  // 预留退路（指她去找卓七）
  signal_throne: "self",       // 递眼于帝
  consult_wuyitai: "self",     // 求药苟活
};

// hook → 结局回顾里显示的短语
const HOOK_LABEL: Record<string, string> = {
  vow_loyalty: "深情立誓",
  probe_intent: "追问真心",
  investigate_illness: "暗察病情",
  confront_betrayal: "红眼质问",
  block_departure: "拦他不走",
  truth_revealed: "看穿伪装",
  silent_consent: "咬唇默受",
  tactical_yield: "福身礼让",
  accept_silently: "静受休书",
  public_grace: "举杯大度",
  public_pushback: "当朝硬刚",
  appeal_throne: "殿前进言",
  reject_violently: "撕碎休书",
  reach_ally: "暗结外援",
  bind_with_weight: "重诺缚心",
  cold_act_with_hint: "眼神留隙",
  divorce_with_clue: "休书留破绽",
  cant_let_go: "撕书重写",
  accidental_reveal: "咳血露真",
  mask_with_lightness: "轻描淡写",
  hide_symptom: "避酒藏疾",
  cold_act_complete: "冷演到底",
  escape_confrontation: "借故离场",
  divorce_cruel: "绝情断念",
  pre_arrange_safety: "预留退路",
  signal_throne: "递眼于帝",
  consult_wuyitai: "求药苟活",
};

// 看穿 / 暴露真相类的关键选择：直接锁定傅云夕结局（权重也更高）
const DECISIVE_TRUST_HOOKS = new Set(["truth_revealed", "accidental_reveal"]);

const ENDING_BY_LINE: Record<LineKey, EndingKey> = {
  trust: "fuyunxi",
  self: "zhuoqi",
  yield: "captured",
};

export const LINE_NAME: Record<LineKey, string> = {
  trust: "情意线",
  self: "自立线",
  yield: "隐忍线",
};

const REASON_BY_LINE: Record<LineKey, string> = {
  trust: "你始终在乎他、信他——他便不顾病体，戴鬼面赶来救你。",
  self: "你强硬自立、另结外援——危急时是西戎卓七先一步赶到。",
  yield: "你一路隐忍退让，无人知你处境——这一夜只能靠自己。",
};

/**
 * 按玩家在剧情中的"选择"决定结局。
 *
 * 规则：
 *   1) 每个带 hook 的选择投 1 票给对应心意线；
 *   2) "看穿伪装 / 咳血露真"等关键选择投 2 票，并直接锁定傅云夕结局；
 *   3) 票数最高的线胜出，平局优先级 trust > self > yield；
 *   4) 若全程自由输入（无任何 hook），回退到数值阈值兜底。
 */
export function decideEndingByChoices(
  choices: ChoiceRecord[],
  state: NumericsState
): EndingDecision {
  const lines: Record<LineKey, number> = { trust: 0, self: 0, yield: 0 };
  const picks: EndingPick[] = [];
  let decisive = false;

  for (const c of choices) {
    const line = HOOK_LINE[c.hook];
    if (!line) continue;
    const weight = DECISIVE_TRUST_HOOKS.has(c.hook) ? 2 : 1;
    lines[line] += weight;
    picks.push({ scene: c.scene, label: HOOK_LABEL[c.hook] || c.hook, line });
    if (DECISIVE_TRUST_HOOKS.has(c.hook)) decisive = true;
  }

  // 全自由输入 / 无有效选择 → 数值兜底
  if (picks.length === 0) return fallbackByNumerics(state);

  if (decisive) {
    return {
      ending: "fuyunxi",
      reason: "你看穿了他的伪装——他终究无法对你狠心，戴上鬼面也要护你。",
      lines,
      picks,
    };
  }

  // 取票数最高的线；平局优先 trust > self > yield
  const order: LineKey[] = ["trust", "self", "yield"];
  let best: LineKey = "yield";
  let bestVal = -1;
  for (const k of order) {
    if (lines[k] > bestVal) {
      bestVal = lines[k];
      best = k;
    }
  }

  return {
    ending: ENDING_BY_LINE[best],
    reason: `${LINE_NAME[best]}（${lines[best]} 票）主导：${REASON_BY_LINE[best]}`,
    lines,
    picks,
  };
}

// 数值兜底（玩家全程自由输入、无可统计选择时使用）
function fallbackByNumerics(state: NumericsState): EndingDecision {
  const { trust, courage, ally } = state;
  let ending: EndingKey;
  let reason: string;
  if (trust >= 60 || courage >= 60) {
    ending = "fuyunxi";
    reason = `未做关键选择，按数值（信任 ${trust} / 勇气 ${courage}）→ 鬼面救场`;
  } else if (courage >= 35 || ally >= 30) {
    ending = "zhuoqi";
    reason = `未做关键选择，按数值（勇气 ${courage} / 盟友 ${ally}）→ 卓七路过`;
  } else {
    ending = "captured";
    reason = "未做关键选择，数值平平 → 失声被擒";
  }
  return { ending, reason, lines: { trust: 0, self: 0, yield: 0 }, picks: [] };
}

// ── 摘要展示 ────────────────────────────────────────────

export function summarizeChange(prev: NumericsState, next: NumericsState): string[] {
  const out: string[] = [];
  const labelMap: Record<keyof NumericsState, string> = {
    trust: "信任", courage: "勇气", ration: "理智", inner: "内在",
    publicSym: "民意", family: "家族", hidden: "隐蔽", intel: "情报",
    ally: "盟友", expose: "暴露", endure: "隐忍", danger: "风险",
  };
  for (const k of Object.keys(next) as (keyof NumericsState)[]) {
    const d = next[k] - prev[k];
    if (d !== 0) out.push(`${labelMap[k]} ${d > 0 ? "+" : ""}${d}`);
  }
  return out;
}
