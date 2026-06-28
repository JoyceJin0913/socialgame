type RoleId = "hanyan" | "moshen" | string;

type PlayerStatus = "waiting" | "ready" | "connected" | "offline";

export type MatchPlayer = {
  userId: string;
  nick: string;
  roleId: RoleId;
  status: PlayerStatus;
  joinedAt: number;
  lastSeenAt: number;
};

export type MatchRoomState = {
  roomId: string;
  storyId: string;
  status: "waiting" | "ready" | "playing" | "closed";
  createdAt: number;
  updatedAt: number;
  players: MatchPlayer[];
  chatLog?: RoomChatMessage[];
};

export type RoomChatMessage = {
  id: string;
  userId: string;
  nick: string;
  roleId: string;
  text: string;
  meta?: RoomChatMeta;
  timestamp: number;
};

export type RoomChatMeta = {
  sceneId?: string;
  choiceId?: string;
  tag?: string;
  hook?: string;
  delta?: Record<string, string>;
};

type MatchEvent =
  | { event: "connected"; data: { room: MatchRoomState; userId: string } }
  | { event: "room_update"; data: MatchRoomState }
  | { event: "error"; data: { message: string; code?: string } };

type EnvWithMatchmaker = {
  MATCHMAKER?: {
    idFromName(name: string): unknown;
    get(id: unknown): { fetch(request: Request): Promise<Response> };
  };
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function readPath(pathname: string): string[] {
  return pathname.replace(/^\/api\/matchmaking\/?/, "").split("/").filter(Boolean);
}

function normalizeNick(value: unknown): string {
  if (typeof value !== "string") return "入梦旅人";
  const nick = value.trim().slice(0, 20);
  return nick || "入梦旅人";
}

function normalizeRole(value: unknown): RoleId | undefined {
  if (typeof value !== "string") return undefined;
  const role = value.trim();
  return role || undefined;
}

function normalizeChatMeta(value: unknown): RoomChatMeta | undefined {
  if (!value || typeof value !== "object") return undefined;
  const source = value as Record<string, unknown>;
  const meta: RoomChatMeta = {};
  if (typeof source.sceneId === "string") meta.sceneId = source.sceneId.slice(0, 80);
  if (typeof source.choiceId === "string") meta.choiceId = source.choiceId.slice(0, 120);
  if (typeof source.tag === "string") meta.tag = source.tag.slice(0, 24);
  if (typeof source.hook === "string") meta.hook = source.hook.slice(0, 80);
  if (source.delta && typeof source.delta === "object") {
    const delta = Object.entries(source.delta as Record<string, unknown>)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .slice(0, 8);
    if (delta.length > 0) meta.delta = Object.fromEntries(delta);
  }
  return Object.keys(meta).length > 0 ? meta : undefined;
}

function makeRoomId(): string {
  return `HTC-${Math.floor(1000 + Math.random() * 9000)}`;
}

function serializeEvent(event: MatchEvent): string {
  return JSON.stringify(event);
}

function cloneRoom(room: MatchRoomState): MatchRoomState {
  return {
    ...room,
    players: room.players.map((player) => ({ ...player })),
  };
}

function publicRoom(room: MatchRoomState): MatchRoomState {
  return cloneRoom(room);
}

// ── 本地内存兜底（dev 模式无 Durable Object 时使用）──
const localRooms = new Map<string, MatchRoomState>();

const localMatchmaker = {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const parts = url.pathname.replace(/^\/matchmaking\/?/, "").split("/").filter(Boolean);

    if (request.method === "GET" && parts[0] === "lobby") {
      const roleId = url.searchParams.get("roleId") ?? "";
      const rooms = [...localRooms.values()]
        .filter((room) => room.status === "waiting" || room.status === "ready")
        .map((room) => ({
          ...cloneRoom(room),
          canJoin: roleId ? !room.players.some((p) => p.roleId === roleId) && room.players.length < 2 : room.players.length < 2,
        }))
        .sort((a, b) => Number(b.canJoin) - Number(a.canJoin) || b.updatedAt - a.updatedAt);
      return jsonResponse({ rooms });
    }

    if (request.method === "POST" && parts[0] === "rooms" && parts.length === 1) {
      const body = await safeJson(request);
      const roleId = normalizeRole(body.roleId);
      if (!roleId) return jsonResponse({ error: "roleId is required" }, 400);
      const now = Date.now();
      const room: MatchRoomState = {
        roomId: makeRoomId(),
        storyId: typeof body.storyId === "string" ? body.storyId : "huatangchun",
        status: "waiting",
        createdAt: now,
        updatedAt: now,
        players: [{
          userId: typeof body.userId === "string" && body.userId ? body.userId : `user_${crypto.randomUUID().slice(0, 8)}`,
          nick: normalizeNick(body.nick),
          roleId,
          status: "waiting",
          joinedAt: now,
          lastSeenAt: now,
        }],
      };
      localRooms.set(room.roomId, room);
      return jsonResponse({ room: cloneRoom(room), userId: room.players[0].userId }, 201);
    }

    if (parts[0] === "rooms" && parts[1]) {
      const roomId = parts[1];
      const room = localRooms.get(roomId);
      if (!room) return jsonResponse({ error: "Room not found" }, 404);

      if (request.method === "GET" && parts.length === 2) {
        return jsonResponse({ room: cloneRoom(room) });
      }

      if (request.method === "POST" && parts[2] === "join") {
        if (room.status === "playing" || room.status === "closed") {
          return jsonResponse({ error: "Room is not joinable" }, 409);
        }
        const body = await safeJson(request);
        const roleId = normalizeRole(body.roleId);
        if (!roleId) return jsonResponse({ error: "roleId is required" }, 400);
        const userId = typeof body.userId === "string" && body.userId ? body.userId : `user_${crypto.randomUUID().slice(0, 8)}`;
        const existing = room.players.find((p) => p.userId === userId);
        const roleTaken = room.players.some((p) => p.roleId === roleId && p.userId !== userId);
        if (roleTaken) return jsonResponse({ error: "Role already taken", code: "ROLE_TAKEN" }, 409);
        if (!existing && room.players.length >= 2) return jsonResponse({ error: "Room is full", code: "ROOM_FULL" }, 409);

        const now = Date.now();
        if (existing) {
          existing.nick = normalizeNick(body.nick ?? existing.nick);
          existing.roleId = roleId;
          existing.status = "connected";
          existing.lastSeenAt = now;
        } else {
          room.players.push({ userId, nick: normalizeNick(body.nick), roleId, status: "connected", joinedAt: now, lastSeenAt: now });
        }
        room.updatedAt = now;
        room.status = room.players.length >= 2 ? "ready" : "waiting";
        return jsonResponse({ room: cloneRoom(room), userId });
      }

      if (request.method === "POST" && parts[2] === "ready") {
        const body = await safeJson(request);
        const userId = typeof body.userId === "string" ? body.userId : "";
        const player = room.players.find((p) => p.userId === userId);
        if (!player) return jsonResponse({ error: "Player not in room" }, 404);
        player.status = body.ready === false ? "connected" : "ready";
        player.lastSeenAt = Date.now();
        room.updatedAt = Date.now();
        const uniqueRoles = new Set(room.players.map((p) => p.roleId));
        if (room.players.length >= 2 && uniqueRoles.size === room.players.length && room.players.every((p) => p.status === "ready")) {
          room.status = "playing";
        }
        return jsonResponse({ room: cloneRoom(room) });
      }

      if (request.method === "POST" && parts[2] === "leave") {
        const body = await safeJson(request);
        const userId = typeof body.userId === "string" ? body.userId : "";
        room.players = room.players.filter((p) => p.userId !== userId);
        room.updatedAt = Date.now();
        room.status = room.players.length === 0 ? "closed" : "waiting";
        if (room.status === "closed") localRooms.delete(roomId);
        return jsonResponse({ ok: true, room: room.status === "closed" ? null : cloneRoom(room) });
      }

      if (parts[2] === "chat") {
        if (request.method === "GET") {
          const since = Number(url.searchParams.get("since") ?? "0");
          const messages = (room.chatLog ?? []).filter((m) => m.timestamp > since);
          return jsonResponse({ messages });
        }
        if (request.method === "POST") {
          const body = await safeJson(request);
          const userId = typeof body.userId === "string" ? body.userId : "";
          const player = room.players.find((p) => p.userId === userId);
          if (!player) return jsonResponse({ error: "Player not in room" }, 403);
          const text = typeof body.text === "string" ? body.text.trim().slice(0, 500) : "";
          if (!text) return jsonResponse({ error: "text is required" }, 400);
          const meta = normalizeChatMeta(body.meta);
          const msg: RoomChatMessage = {
            id: `c${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            userId, nick: player.nick, roleId: player.roleId, text, timestamp: Date.now(),
            ...(meta ? { meta } : {}),
          };
          room.chatLog = [...(room.chatLog ?? []), msg].slice(-200);
          room.updatedAt = Date.now();
          return jsonResponse({ message: msg }, 201);
        }
      }
    }

    // WebSocket 在本地内存模式下不支持，返回提示
    if (request.method === "GET" && parts[0] === "ws") {
      return jsonResponse({ error: "本地 dev 模式不支持 WebSocket，房间状态通过轮询刷新" }, 501);
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
};

export async function routeMatchmakingAPI(request: Request, env: unknown): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const matchmaker = (env as EnvWithMatchmaker | undefined)?.MATCHMAKER;

  // 生产环境：走 Durable Object
  if (matchmaker) {
    const id = matchmaker.idFromName("global");
    const stub = matchmaker.get(id);
    const url = new URL(request.url);
    const target = new URL(url.pathname.replace(/^\/api\/matchmaking/, "/matchmaking") + url.search, url.origin);
    return stub.fetch(new Request(target, request));
  }

  // dev 模式兜底：本地内存
  const url = new URL(request.url);
  const target = new URL(url.pathname.replace(/^\/api\/matchmaking/, "/matchmaking") + url.search, url.origin);
  return localMatchmaker.fetch(new Request(target, request));
}

export class Matchmaker {
  private state: any;
  private rooms = new Map<string, MatchRoomState>();
  private sockets = new Map<string, Set<WebSocket>>();
  private loaded?: Promise<void>;

  constructor(state: any) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    await this.load();

    const url = new URL(request.url);
    const parts = url.pathname.replace(/^\/matchmaking\/?/, "").split("/").filter(Boolean);

    if (request.method === "GET" && parts[0] === "lobby") {
      return this.handleLobby(url);
    }

    if (request.method === "POST" && parts[0] === "rooms" && parts.length === 1) {
      return this.handleCreateRoom(request);
    }

    if (parts[0] === "rooms" && parts[1]) {
      const roomId = parts[1];
      if (request.method === "GET" && parts.length === 2) return this.handleGetRoom(roomId);
      if (request.method === "POST" && parts[2] === "join") return this.handleJoinRoom(request, roomId);
      if (request.method === "POST" && parts[2] === "ready") return this.handleReady(request, roomId);
      if (request.method === "POST" && parts[2] === "leave") return this.handleLeave(request, roomId);
    }

    if (parts[0] === "rooms" && parts[1] && parts[2] === "chat") {
      const roomId = parts[1];
      if (request.method === "GET") return this.handleGetChat(roomId, url);
      if (request.method === "POST") return this.handlePostChat(request, roomId);
    }

    if (request.method === "GET" && parts[0] === "ws") {
      return this.handleWebSocket(request, url);
    }

    return jsonResponse({ error: "Not found" }, 404);
  }

  private async load(): Promise<void> {
    if (!this.loaded) {
      this.loaded = (async () => {
        const stored = await this.state.storage.get<MatchRoomState[]>("rooms");
        for (const room of stored ?? []) {
          if (room.status !== "closed") this.rooms.set(room.roomId, room);
        }
      })();
    }
    return this.loaded;
  }

  private async persist(): Promise<void> {
    await this.state.storage.put("rooms", [...this.rooms.values()]);
  }

  private handleLobby(url: URL): Response {
    const roleId = url.searchParams.get("roleId") ?? "";
    const rooms = [...this.rooms.values()]
      .filter((room) => room.status === "waiting" || room.status === "ready")
      .map((room) => ({
        ...publicRoom(room),
        canJoin: roleId ? !room.players.some((player) => player.roleId === roleId) && room.players.length < 2 : room.players.length < 2,
      }))
      .sort((a, b) => Number(b.canJoin) - Number(a.canJoin) || b.updatedAt - a.updatedAt);

    return jsonResponse({ rooms });
  }

  private async handleCreateRoom(request: Request): Promise<Response> {
    const body = await safeJson(request);
    const roleId = normalizeRole(body.roleId);
    if (!roleId) return jsonResponse({ error: "roleId is required" }, 400);

    const now = Date.now();
    const room: MatchRoomState = {
      roomId: makeRoomId(),
      storyId: typeof body.storyId === "string" ? body.storyId : "huatangchun",
      status: "waiting",
      createdAt: now,
      updatedAt: now,
      players: [
        {
          userId: typeof body.userId === "string" && body.userId ? body.userId : `user_${crypto.randomUUID().slice(0, 8)}`,
          nick: normalizeNick(body.nick),
          roleId,
          status: "waiting",
          joinedAt: now,
          lastSeenAt: now,
        },
      ],
    };

    this.rooms.set(room.roomId, room);
    await this.persist();
    this.broadcast(room.roomId, { event: "room_update", data: publicRoom(room) });
    return jsonResponse({ room: publicRoom(room), userId: room.players[0].userId }, 201);
  }

  private handleGetRoom(roomId: string): Response {
    const room = this.rooms.get(roomId);
    if (!room) return jsonResponse({ error: "Room not found" }, 404);
    return jsonResponse({ room: publicRoom(room) });
  }

  private async handleJoinRoom(request: Request, roomId: string): Promise<Response> {
    const room = this.rooms.get(roomId);
    if (!room) return jsonResponse({ error: "Room not found" }, 404);
    if (room.status === "playing" || room.status === "closed") {
      return jsonResponse({ error: "Room is not joinable" }, 409);
    }

    const body = await safeJson(request);
    const roleId = normalizeRole(body.roleId);
    if (!roleId) return jsonResponse({ error: "roleId is required" }, 400);

    const userId = typeof body.userId === "string" && body.userId ? body.userId : `user_${crypto.randomUUID().slice(0, 8)}`;
    const existing = room.players.find((player) => player.userId === userId);
    const roleTakenByOther = room.players.some((player) => player.roleId === roleId && player.userId !== userId);
    if (roleTakenByOther) {
      return jsonResponse({ error: "Role already taken", code: "ROLE_TAKEN" }, 409);
    }
    if (!existing && room.players.length >= 2) {
      return jsonResponse({ error: "Room is full", code: "ROOM_FULL" }, 409);
    }

    const now = Date.now();
    if (existing) {
      existing.nick = normalizeNick(body.nick ?? existing.nick);
      existing.roleId = roleId;
      existing.status = "connected";
      existing.lastSeenAt = now;
    } else {
      room.players.push({
        userId,
        nick: normalizeNick(body.nick),
        roleId,
        status: "connected",
        joinedAt: now,
        lastSeenAt: now,
      });
    }
    room.updatedAt = now;
    room.status = room.players.length >= 2 ? "ready" : "waiting";

    await this.persist();
    this.broadcast(roomId, { event: "room_update", data: publicRoom(room) });
    return jsonResponse({ room: publicRoom(room), userId });
  }

  private async handleReady(request: Request, roomId: string): Promise<Response> {
    const room = this.rooms.get(roomId);
    if (!room) return jsonResponse({ error: "Room not found" }, 404);

    const body = await safeJson(request);
    const userId = typeof body.userId === "string" ? body.userId : "";
    const player = room.players.find((item) => item.userId === userId);
    if (!player) return jsonResponse({ error: "Player not in room" }, 404);

    player.status = body.ready === false ? "connected" : "ready";
    player.lastSeenAt = Date.now();
    room.updatedAt = Date.now();
    const uniqueRoles = new Set(room.players.map((item) => item.roleId));
    if (room.players.length >= 2 && uniqueRoles.size === room.players.length && room.players.every((item) => item.status === "ready")) {
      room.status = "playing";
    }

    await this.persist();
    this.broadcast(roomId, { event: "room_update", data: publicRoom(room) });
    return jsonResponse({ room: publicRoom(room) });
  }

  private async handleLeave(request: Request, roomId: string): Promise<Response> {
    const room = this.rooms.get(roomId);
    if (!room) return jsonResponse({ error: "Room not found" }, 404);

    const body = await safeJson(request);
    const userId = typeof body.userId === "string" ? body.userId : "";
    room.players = room.players.filter((player) => player.userId !== userId);
    room.updatedAt = Date.now();
    room.status = room.players.length === 0 ? "closed" : "waiting";
    if (room.status === "closed") this.rooms.delete(roomId);

    await this.persist();
    this.broadcast(roomId, { event: "room_update", data: publicRoom(room) });
    return jsonResponse({ ok: true, room: room.status === "closed" ? null : publicRoom(room) });
  }

  private handleGetChat(roomId: string, url: URL): Response {
    const room = this.rooms.get(roomId);
    if (!room) return jsonResponse({ error: "Room not found" }, 404);
    const since = Number(url.searchParams.get("since") ?? "0");
    const messages = (room.chatLog ?? []).filter((m) => m.timestamp > since);
    return jsonResponse({ messages });
  }

  private async handlePostChat(request: Request, roomId: string): Promise<Response> {
    const room = this.rooms.get(roomId);
    if (!room) return jsonResponse({ error: "Room not found" }, 404);

    const body = await safeJson(request);
    const userId = typeof body.userId === "string" ? body.userId : "";
    const player = room.players.find((p) => p.userId === userId);
    if (!player) return jsonResponse({ error: "Player not in room" }, 403);

    const text = typeof body.text === "string" ? body.text.trim().slice(0, 500) : "";
    if (!text) return jsonResponse({ error: "text is required" }, 400);
    const meta = normalizeChatMeta(body.meta);

    const msg: RoomChatMessage = {
      id: `c${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId,
      nick: player.nick,
      roleId: player.roleId,
      text,
      ...(meta ? { meta } : {}),
      timestamp: Date.now(),
    };

    room.chatLog = [...(room.chatLog ?? []), msg].slice(-200);
    room.updatedAt = Date.now();
    await this.persist();

    this.broadcast(roomId, { event: "room_update", data: publicRoom(room) });
    return jsonResponse({ message: msg }, 201);
  }

  private handleWebSocket(request: Request, url: URL): Response {
    if (request.headers.get("Upgrade") !== "websocket") {
      return jsonResponse({ error: "Expected websocket upgrade" }, 426);
    }

    const roomId = url.searchParams.get("roomId") ?? "";
    const userId = url.searchParams.get("userId") ?? "";
    const room = this.rooms.get(roomId);
    if (!room || !userId) return jsonResponse({ error: "Invalid room or user" }, 400);

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    server.accept();

    if (!this.sockets.has(roomId)) this.sockets.set(roomId, new Set());
    this.sockets.get(roomId)?.add(server);

    const player = room.players.find((item) => item.userId === userId);
    if (player) {
      player.status = player.status === "ready" ? "ready" : "connected";
      player.lastSeenAt = Date.now();
      room.updatedAt = Date.now();
      this.persist();
    }

    server.send(serializeEvent({ event: "connected", data: { room: publicRoom(room), userId } }));
    this.broadcast(roomId, { event: "room_update", data: publicRoom(room) });

    server.addEventListener("message", (event) => {
      if (typeof event.data !== "string") return;
      let message: any;
      try {
        message = JSON.parse(event.data);
      } catch {
        server.send(serializeEvent({ event: "error", data: { message: "Invalid JSON" } }));
        return;
      }
      if (message?.type === "ping") {
        const activePlayer = room.players.find((item) => item.userId === userId);
        if (activePlayer) activePlayer.lastSeenAt = Date.now();
        server.send(JSON.stringify({ event: "pong", data: { now: Date.now() } }));
      }
    });

    server.addEventListener("close", () => this.detachSocket(roomId, server));
    server.addEventListener("error", () => this.detachSocket(roomId, server));

    return new Response(null, { status: 101, webSocket: client } as ResponseInit & { webSocket: WebSocket });
  }

  private detachSocket(roomId: string, socket: WebSocket): void {
    const roomSockets = this.sockets.get(roomId);
    roomSockets?.delete(socket);
    if (roomSockets?.size === 0) this.sockets.delete(roomId);
  }

  private broadcast(roomId: string, event: MatchEvent): void {
    const payload = serializeEvent(event);
    for (const socket of this.sockets.get(roomId) ?? []) {
      try {
        socket.send(payload);
      } catch {
        this.detachSocket(roomId, socket);
      }
    }
  }
}

async function safeJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const data = await request.json();
    return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

declare const WebSocketPair: {
  new (): { 0: WebSocket; 1: WebSocket };
};
