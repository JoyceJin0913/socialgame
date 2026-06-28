export type MatchPlayer = {
  userId: string;
  nick: string;
  roleId: string;
  status: "waiting" | "ready" | "connected" | "offline";
  joinedAt: number;
  lastSeenAt: number;
};

export type MatchRoom = {
  roomId: string;
  storyId: string;
  status: "waiting" | "ready" | "playing" | "closed";
  createdAt: number;
  updatedAt: number;
  players: MatchPlayer[];
  canJoin?: boolean;
};

export type MatchmakingEvent =
  | { event: "connected"; data: { room: MatchRoom; userId: string } }
  | { event: "room_update"; data: MatchRoom }
  | { event: "error"; data: { message: string; code?: string } }
  | { event: "pong"; data: { now: number } };

const API_BASE = "/api/matchmaking";

async function readJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data?.error === "string" ? data.error : `请求失败: ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

export async function listMatchRooms(roleId?: string): Promise<MatchRoom[]> {
  const params = roleId ? `?roleId=${encodeURIComponent(roleId)}` : "";
  const res = await fetch(`${API_BASE}/lobby${params}`);
  const data = await readJson<{ rooms: MatchRoom[] }>(res);
  return data.rooms;
}

export async function createMatchRoom(input: {
  userId?: string;
  nick?: string;
  roleId: string;
  storyId?: string;
}): Promise<{ room: MatchRoom; userId: string }> {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJson(res);
}

export async function joinMatchRoom(
  roomId: string,
  input: { userId?: string; nick?: string; roleId: string },
): Promise<{ room: MatchRoom; userId: string }> {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJson(res);
}

export async function setMatchReady(
  roomId: string,
  input: { userId: string; ready: boolean },
): Promise<{ room: MatchRoom }> {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/ready`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJson(res);
}

export async function leaveMatchRoom(roomId: string, userId: string): Promise<{ ok: true; room: MatchRoom | null }> {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  return readJson(res);
}

export async function getMatchRoom(roomId: string): Promise<MatchRoom> {
  const res = await fetch(`${API_BASE}/rooms/${roomId}`);
  const data = await readJson<{ room: MatchRoom }>(res);
  return data.room;
}

// ── 房间聊天消息（双人实时对话）──

export type RoomChatMessage = {
  id: string;
  userId: string;
  nick: string;
  roleId: string;
  text: string;
  timestamp: number;
};

export async function getRoomChat(roomId: string, since = 0): Promise<RoomChatMessage[]> {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/chat?since=${since}`);
  const data = await readJson<{ messages: RoomChatMessage[] }>(res);
  return data.messages;
}

export async function postRoomChat(
  roomId: string,
  input: { userId: string; text: string },
): Promise<RoomChatMessage> {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ message: RoomChatMessage }>(res);
  return data.message;
}

export function connectMatchRoom(
  roomId: string,
  userId: string,
  onEvent: (event: MatchmakingEvent) => void,
  onClose?: () => void,
): WebSocket | null {
  if (typeof window === "undefined") return null;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const params = new URLSearchParams({ roomId, userId });
  const ws = new WebSocket(`${protocol}//${window.location.host}${API_BASE}/ws?${params}`);

  ws.onmessage = (event) => {
    try {
      onEvent(JSON.parse(event.data) as MatchmakingEvent);
    } catch {
      onEvent({ event: "error", data: { message: "房间消息解析失败" } });
    }
  };
  ws.onclose = () => onClose?.();

  return ws;
}
