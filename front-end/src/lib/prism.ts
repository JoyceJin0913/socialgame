/**
 * Prism Engine · 世界切片折射引擎
 * 从 dist/play/index.html 的 PRISM 对象迁移而来，加 TypeScript 类型
 */

// ── 类型定义 ──────────────────────────────────────────────

export type HState = "unknown" | "hinted" | "confirmed";
export type HRequire = HState | "hinted_or_above";

export interface PrismRequire {
  S?: string;
  N?: string[];
  H?: HRequire;
  A1?: string;
  Tmax?: number;
}

export interface PrismChoice {
  id: string;
  text: string;
  hook: string;
  require?: PrismRequire;
  delta?: Record<string, string>;
}

export interface PrismPreset {
  S: string;
  H: HState;
  N: string[];
  T: number;
  A: { rumor: string; reverb: string };
}

export interface PrismView {
  name: string;
  consoleTitle?: string;
  hSubLabel?: string;
  npcRoster?: { id: string; label: string }[];
  presetLabels?: Record<string, string>;
  presets: Record<string, PrismPreset>;
  tones?: Record<string, Record<string, string>>;
  pool: PrismChoice[];
}

export interface PrismScript {
  meta?: { id?: string; title?: string; version?: string; author?: string };
  crystal?: {
    dramaticFunction?: string;
    mustHappen?: string[];
    mustNotHappen?: string[];
  };
  axisDefs?: any;
  views: Record<string, PrismView>;
}

export interface PrismMeta {
  hook: string;
  id: string;
  tag?: string;
  delta?: Record<string, string>;
  require?: PrismRequire;
}

export interface RefractedOption {
  text: string;
  tag: string;
  cls: "" | "recommended" | "danger" | "gentle";
  _prism: PrismMeta;
}

export interface RefractedAxes extends PrismPreset {
  _view: string;
  _preset: string;
}

export interface HUDInfo {
  scriptTitle: string;
  view: string;
  presetLabel: string;
  axes: PrismPreset;
  visibleCount: number;
  poolSize: number;
  legacyCount: number;
  filteredOut: { text: string; why: string }[];
}

export interface RefractResult {
  options: RefractedOption[];
  axes: RefractedAxes;
  hud: HUDInfo;
}

// ── 引擎实现 ──────────────────────────────────────────────

const cache: Record<string, PrismScript> = {};

export async function loadScript(scriptId: string): Promise<PrismScript | null> {
  if (cache[scriptId]) return cache[scriptId];
  try {
    const resp = await fetch(`/prism/${scriptId}.json`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data: PrismScript = await resp.json();
    cache[scriptId] = data;
    return data;
  } catch (err) {
    console.warn("[Prism] load failed:", err);
    return null;
  }
}

const H_RANK: Record<HState, number> = { unknown: 0, hinted: 1, confirmed: 2 };
const hRank = (s: HState | undefined): number => (s ? H_RANK[s] : 0);

export function matchRequire(req: PrismRequire | undefined, axes: PrismPreset): boolean {
  if (!req) return true;
  if (req.S && req.S !== axes.S) return false;
  if (req.N && Array.isArray(req.N)) {
    for (const n of req.N) if (!axes.N.includes(n)) return false;
  }
  if (req.H) {
    const cur = hRank(axes.H);
    if (req.H === "hinted_or_above" && cur < 1) return false;
    else if (req.H === "hinted" && cur < 1) return false;
    else if (req.H === "confirmed" && cur < 2) return false;
    else if (req.H === "unknown" && cur !== 0) return false;
  }
  if (req.A1 && axes.A?.rumor !== req.A1) return false;
  if (req.Tmax != null && axes.T > req.Tmax) return false;
  return true;
}

export function explainBlock(req: PrismRequire | undefined, axes: PrismPreset): string {
  if (!req) return "无条件";
  const reasons: string[] = [];
  if (req.S && req.S !== axes.S) reasons.push(`需 S=${req.S}`);
  if (req.N) {
    const miss = req.N.filter((n) => !axes.N.includes(n));
    if (miss.length) reasons.push(`缺 NPC: ${miss.join(",")}`);
  }
  if (req.H) {
    const cur = axes.H;
    if (req.H === "confirmed" && cur !== "confirmed") reasons.push(`需 H=confirmed（当前 ${cur}）`);
    else if (req.H === "hinted_or_above" && cur === "unknown") reasons.push(`需 H≥hinted（当前 unknown）`);
  }
  if (req.A1 && axes.A?.rumor !== req.A1) reasons.push(`需 A.rumor=${req.A1}`);
  if (req.Tmax != null && axes.T > req.Tmax) reasons.push(`需 T≤${req.Tmax}（当前 ${axes.T}）`);
  return reasons.join("；") || "不可达";
}

function toOption(choice: PrismChoice): RefractedOption {
  const firstDeltaKey = choice.delta ? Object.keys(choice.delta)[0] : null;
  const tag = firstDeltaKey || (choice.require?.H ? "隐藏" : "行动");
  let cls: RefractedOption["cls"] = "";
  if (choice.require?.H === "confirmed") cls = "recommended";
  else if (choice.require?.H === "hinted_or_above") cls = "recommended";
  else if (choice.delta) {
    const vals = Object.values(choice.delta).join("");
    if (vals.includes("---") || vals.includes("--")) cls = "danger";
  }
  return {
    text: choice.text,
    tag,
    cls,
    _prism: {
      hook: choice.hook,
      id: choice.id,
      delta: choice.delta,
      require: choice.require,
    },
  };
}

export interface SceneWithPrism {
  prism?: { script: string; view: string; preset: string };
  options?: any[];
}

export async function refract(scene: SceneWithPrism): Promise<RefractResult | null> {
  if (!scene.prism) return null;
  const data = await loadScript(scene.prism.script);
  if (!data) return null;
  const view = data.views?.[scene.prism.view];
  const preset = view?.presets?.[scene.prism.preset];
  if (!view || !preset) return null;

  const axes: RefractedAxes = {
    ...JSON.parse(JSON.stringify(preset)),
    _view: scene.prism.view,
    _preset: scene.prism.preset,
  };

  const visible = view.pool.filter((c) => matchRequire(c.require, axes));
  const filtered = view.pool.filter((c) => !matchRequire(c.require, axes));

  const hud: HUDInfo = {
    scriptTitle: data.meta?.title || scene.prism.script,
    view: view.name,
    presetLabel: view.presetLabels?.[scene.prism.preset] || scene.prism.preset,
    axes,
    visibleCount: visible.length,
    poolSize: view.pool.length,
    legacyCount: scene.options?.length || 0,
    filteredOut: filtered.map((c) => ({
      text: c.text,
      why: explainBlock(c.require, axes),
    })),
  };

  if (visible.length === 0) return null;
  return {
    options: visible.map(toOption),
    axes,
    hud,
  };
}
