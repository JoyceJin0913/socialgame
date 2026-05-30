/**
 * 画堂春 - 游戏 API 客户端
 * 对接后端 FastAPI + WebSocket
 */

// ── Types ──

export type GameMeta = {
  game_id: string;
  story_meta: {
    title: string;
    author: string;
    genre: string;
    world_setting: string;
  };
  roles: RoleInfo[];
  status: string;
};

export type RoleInfo = {
  role_id: string;
  name: string;
  identity: string;
  personality: string;
};

export type Segment = {
  speaker: string;
  speaker_type: "narrator" | "character" | "bot" | "system";
  text: string;
  emotion_tag?: string;
  inner_thought?: boolean;
};

export type NodeData = {
  node_id: string;
  act: number;
  act_title: string;
  scene_name: string;
  scene_description: string;
  ambient: string;
  progress: number;
  segments: Segment[];
  choices: { index: number; text: string; influence_hint: string }[];
  is_ending: boolean;
  ending_type: string;
  ending_title: string;
  ending_description: string;
  ending_closing: string;
  waiting_for: string;
  mook_active_role: string;
};

export type GameState = {
  game_id: string;
  story_id: string;
  status: string;
  current_node_id: string;
  player_roles: Record<string, string>;
  bot_roles: string[];
  val: number;
  flags: string[];
  variables: Record<string, number>;
  history: any[];
  current_node: NodeData;
  roles: RoleInfo[];
};

export type GameResult = {
  game_id: string;
  ending_type: string;
  ending_title: string;
  ending_description: string;
  ending_closing: string;
  highlights: { text: string; type: string }[];
  relationship_graph: Record<string, number>;
  stats: {
    choices_made: number;
    free_count_used: number;
    flags_unlocked: number;
    val_final: number;
  };
};

export type WsEvent = {
  event: string;
  data: any;
};

// ── API Client ──

const BASE = typeof window !== "undefined" && window.location.hostname.includes("trycloudflare")
  ? "https://wish-origin-proved-title.trycloudflare.com"
  : "";  // local dev uses vite proxy

export async function createGame(storyId = "huatangchun", protagonistRole = ""): Promise<GameMeta> {
  const res = await fetch(`${BASE}/api/games/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ story_id: storyId, protagonist_role: protagonistRole }),
  });
  if (!res.ok) throw new Error(`创建房间失败: ${res.status}`);
  return res.json();
}

export async function joinGame(gameId: string, userId: string, roleId: string) {
  const res = await fetch(`${BASE}/api/games/${gameId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, role_id: roleId }),
  });
  if (!res.ok) throw new Error(`加入房间失败: ${res.status}`);
  return res.json();
}

export async function startGame(gameId: string, viewerRole = ""): Promise<{ status: string } & NodeData> {
  const params = viewerRole ? `?viewer_role=${viewerRole}` : "";
  const res = await fetch(`${BASE}/api/games/${gameId}/start${params}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`开始游戏失败: ${res.status}`);
  return res.json();
}

export async function getGame(gameId: string): Promise<GameState> {
  const res = await fetch(`${BASE}/api/games/${gameId}`);
  if (!res.ok) throw new Error(`获取房间失败: ${res.status}`);
  return res.json();
}

export async function choose(gameId: string, userId: string, choiceIndex: number) {
  const res = await fetch(`${BASE}/api/games/${gameId}/choose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, choice_index: choiceIndex }),
  });
  if (!res.ok) throw new Error(`选择失败: ${res.status}`);
  return res.json();
}

export async function mookChoose(gameId: string, userId: string, roleId: string, choiceIndex: number) {
  const res = await fetch(`${BASE}/api/games/${gameId}/mook-choose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, role_id: roleId, choice_index: choiceIndex }),
  });
  if (!res.ok) throw new Error(`选择失败: ${res.status}`);
  return res.json();
}

export async function speak(gameId: string, userId: string, text: string) {
  const res = await fetch(`${BASE}/api/games/${gameId}/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, text }),
  });
  if (!res.ok) throw new Error(`发言失败: ${res.status}`);
  return res.json();
}

export async function finishGame(gameId: string): Promise<GameResult> {
  const res = await fetch(`${BASE}/api/games/${gameId}/finish`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`结束游戏失败: ${res.status}`);
  return res.json();
}

// ── WebSocket ──

export function connectWs(
  gameId: string,
  userId: string,
  onEvent: (event: WsEvent) => void,
  onClose?: () => void,
): WebSocket | null {
  if (typeof window === "undefined") return null;
  let wsUrl: string;
  if (window.location.hostname.includes("trycloudflare")) {
    wsUrl = `wss://wish-origin-proved-title.trycloudflare.com/ws/games/${gameId}?user_id=${userId}`;
  } else {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    wsUrl = `${protocol}//${host}/ws/games/${gameId}?user_id=${userId}`;
  }
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (e) => {
    try {
      const msg: WsEvent = JSON.parse(e.data);
      onEvent(msg);
    } catch {
      console.warn("WS parse error:", e.data);
    }
  };

  ws.onclose = () => {
    onClose?.();
  };

  ws.onerror = (err) => {
    console.error("WS error:", err);
  };

  return ws;
}
