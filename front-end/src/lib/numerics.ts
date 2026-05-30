/**
 * Numerics System · Hook → State Delta → Ending Route
 *
 * Prism 抛出语义事件名（hook），数值系统决定它对应加多少分。
 * 这里实现：
 *   1) HOOK_TABLE: 每个 hook → 数值向量变化
 *   2) NumericsState: 累积的数值
 *   3) decideEnding: 综合 QTE 结果 + 累积数值 决定最终结局
 */

import type { QTEResult } from "@/hooks/use-qte";

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

// ── 结局判定 ─────────────────────────────────────────────

export type EndingKey = "fuyunxi" | "zhuoqi" | "captured";

export interface EndingDecision {
  ending: EndingKey;
  reason: string;          // 给 HUD/调试显示
  qteContribution: string; // QTE 的原始结果
  numericContribution: string; // 数值系统贡献的关键阈值
}

/**
 * 综合 QTE 结果 + 累积数值 决定最终结局
 *
 * 规则（可调）：
 *   - QTE 三星 + trust ≥ 60 → fuyunxi（鬼面救场）— 男主真心愿意暴露救你
 *   - QTE 三星 + trust < 60   → zhuoqi（卓七路过）— 你叫得响但他不来
 *   - QTE 二星 + ally ≥ 30   → zhuoqi（西戎线起作用）
 *   - QTE 二星 + trust ≥ 70  → fuyunxi（提升一档）— 信任值足够高，男主仍来
 *   - 其他默认按 QTE 结果
 *
 * 这样数值系统真正影响结局，而不只是 QTE 决定一切。
 */
export function decideEnding(qteResult: QTEResult, state: NumericsState): EndingDecision {
  const { trust, ally, courage } = state;
  let ending: EndingKey = qteResult;
  let reason = `按 QTE 原始结果 → ${qteResult}`;

  // 三星 + 低信任：男主不来，反而是卓七路过
  if (qteResult === "fuyunxi" && trust < 60) {
    ending = "zhuoqi";
    reason = `QTE 三星但 trust=${trust} < 60，男主未及现身`;
  }
  // 二星 + 高信任：男主仍来（升一档）
  else if (qteResult === "zhuoqi" && trust >= 70) {
    ending = "fuyunxi";
    reason = `QTE 二星但 trust=${trust} ≥ 70，男主信你必走，鬼面赶到`;
  }
  // 二星 + 高西戎线：明确走卓七
  else if (qteResult === "zhuoqi" && ally >= 30) {
    ending = "zhuoqi";
    reason = `QTE 二星 + ally=${ally} ≥ 30，西戎线接应`;
  }
  // 一星 + 高勇气 + 高情报：升级为卓七
  else if (qteResult === "captured" && courage >= 70 && state.intel >= 30) {
    ending = "zhuoqi";
    reason = `QTE 一星但 courage=${courage}, intel=${state.intel}，自救并触发了西戎线`;
  }

  return {
    ending,
    reason,
    qteContribution: qteResult,
    numericContribution: `trust=${trust} courage=${courage} ally=${ally} intel=${state.intel}`,
  };
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
