import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Clock3,
  Copy,
  Crown,
  DoorOpen,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";
import bg from "@/assets/matching-bg.png";
import { CHARACTERS, getCharacter } from "@/lib/characters";
import {
  connectMatchRoom,
  createMatchRoom,
  getMatchRoom,
  joinMatchRoom,
  leaveMatchRoom,
  listMatchRooms,
  setMatchReady,
  type MatchPlayer,
  type MatchRoom,
} from "@/lib/matchmaking-api";
import { normalizeNick, readPlayerProfile, savePlayerProfile } from "@/lib/player-profile";

export const Route = createFileRoute("/matching")({
  component: MatchingPage,
  validateSearch: (s: Record<string, unknown>) => ({
    role: typeof s.role === "string" ? s.role : "hanyan",
    room: typeof s.room === "string" ? s.room : undefined,
    tags: typeof s.tags === "string" ? s.tags : undefined,
  }),
  head: () => ({
    meta: [
      { title: "站内匹配大厅 · 重生之贵女难求" },
      { name: "description", content: "在大厅等候入梦旅人，选择角色并开启多人对戏。" },
    ],
  }),
});

type Phase = "hall" | "found";

type WaitingPlayer = {
  id: string;
  nick: string;
  roleId: string;
  status: "waiting" | "ready" | "story";
  latency: string;
  tags: string[];
  line: string;
};

const COUNTDOWN_SECONDS = 3;

const WAITING_PLAYERS: WaitingPlayer[] = [
  {
    id: "p1",
    nick: "江雪初停",
    roleId: "moshen",
    status: "ready",
    latency: "12ms",
    tags: ["原著向", "慢热"],
    line: "想接第五幕书房这场，偏克制一点。",
  },
  {
    id: "p2",
    nick: "灯下听雨",
    roleId: "hanyan",
    status: "waiting",
    latency: "28ms",
    tags: ["复仇", "权谋"],
    line: "等一个傅云夕，先走冷脸试探线。",
  },
  {
    id: "p3",
    nick: "青玉案",
    roleId: "moshen",
    status: "story",
    latency: "18ms",
    tags: ["虐恋", "高张力"],
    line: "可马上入梦，接受临场改写。",
  },
  {
    id: "p4",
    nick: "月照回廊",
    roleId: "hanyan",
    status: "ready",
    latency: "35ms",
    tags: ["甜宠", "轻喜"],
    line: "想试一条不那么疼的支线。",
  },
];

const STATUS_COPY = {
  waiting: "等候中",
  ready: "可匹配",
  story: "看剧本",
};

function readInitialNick() {
  const profile = readPlayerProfile();
  return profile.nick || "我";
}

function readStableUserId() {
  if (typeof window === "undefined") return "";
  const key = "ruxi.matchmaking.userId";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = `user_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(key, next);
  return next;
}

function Matching() {
  const navigate = useNavigate();
  const { role: myRoleId, room: initialRoomCode, tags: tagsParam } = Route.useSearch();
  const myTags = useMemo(
    () => (tagsParam ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean) : []),
    [tagsParam],
  );
  const scriptLabel = myTags.length > 0 ? myTags.slice(0, 2).join("·") : "原著";

  const [phase, setPhase] = useState<Phase>("hall");
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | undefined>();
  const [pulse, setPulse] = useState(0);
  const [myNick, setMyNick] = useState(readInitialNick);
  const [editingNick, setEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState(readInitialNick);
  const [searchQuery, setSearchQuery] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState(initialRoomCode ?? "");
  const [roomCode, setRoomCode] = useState(initialRoomCode ?? "");
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);
  const [aiSubstitute, setAiSubstitute] = useState(false);
  const [userId, setUserId] = useState(readStableUserId);
  const [activeRoom, setActiveRoom] = useState<MatchRoom | null>(null);
  const [lobbyRooms, setLobbyRooms] = useState<MatchRoom[]>([]);
  const [apiMessage, setApiMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [invitedPlayerId, setInvitedPlayerId] = useState<string | undefined>();

  const me = getCharacter(myRoleId) ?? CHARACTERS[0];
  const recommendedRoleId = myRoleId === "moshen" ? "hanyan" : "moshen";
  const waitingPlayers = useMemo(
    () =>
      WAITING_PLAYERS.map((player) => ({
        ...player,
        character: getCharacter(player.roleId) ?? CHARACTERS[0],
        compatible: player.roleId === recommendedRoleId,
      })),
    [recommendedRoleId],
  );
  const compatiblePlayers = waitingPlayers.filter((player) => player.compatible);
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visiblePlayers = normalizedSearch
    ? waitingPlayers.filter((player) => player.nick.toLowerCase().includes(normalizedSearch))
    : waitingPlayers;
  const selectedPlayer =
    compatiblePlayers.find((player) => player.id === selectedPlayerId) ?? compatiblePlayers[0] ?? waitingPlayers[0];
  const partner = selectedPlayer.character;
  const selectedCompatible = selectedPlayer.compatible;
  const mePlayer = activeRoom?.players.find((player) => player.userId === userId);
  const partnerPlayer = activeRoom?.players.find((player) => player.userId !== userId);
  const partnerCharacter = partnerPlayer ? (getCharacter(partnerPlayer.roleId) ?? partner) : partner;
  const isHost = Boolean(activeRoom?.players[0]?.userId === userId);
  const myReady = Boolean(mePlayer?.status === "ready");
  const partnerReady = Boolean(partnerPlayer?.status === "ready");
  const roomHasPartner = Boolean(partnerPlayer || aiSubstitute);
  const roomReady = Boolean(activeRoom && myReady && roomHasPartner && (aiSubstitute || partnerReady));
  const partnerLabel = aiSubstitute && !partnerPlayer ? "AI 代演" : (partnerPlayer?.nick ?? selectedPlayer.nick);
  const visibleRooms = useMemo(() => {
    const query = normalizedSearch;
    return lobbyRooms.filter((room) => {
      if (!query) return true;
      return (
        room.roomId.toLowerCase().includes(query) ||
        room.players.some((player) => player.nick.toLowerCase().includes(query))
      );
    });
  }, [lobbyRooms, normalizedSearch]);

  useEffect(() => {
    if (!selectedPlayerId && compatiblePlayers[0]) setSelectedPlayerId(compatiblePlayers[0].id);
  }, [compatiblePlayers, selectedPlayerId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const profile = readPlayerProfile();
    savePlayerProfile({ ...profile, nick: myNick });
  }, [myNick]);

  const refreshLobbyRooms = useCallback(async () => {
    try {
      const rooms = await listMatchRooms(myRoleId);
      setLobbyRooms(rooms);
      setApiMessage("");
    } catch (error) {
      setApiMessage(error instanceof Error ? error.message : "房间列表刷新失败");
    }
  }, [myRoleId]);

  useEffect(() => {
    if (phase !== "hall") return;
    refreshLobbyRooms();
    const timer = setInterval(refreshLobbyRooms, 3000);
    return () => clearInterval(timer);
  }, [phase, refreshLobbyRooms]);

  // 房间状态轮询兜底（dev 模式无 WebSocket 时生效）
  useEffect(() => {
    if (phase !== "hall" || !roomCode) return;
    const pollRoom = async () => {
      try {
        const room = await getMatchRoom(roomCode);
        setActiveRoom((prev) => {
          if (!prev || prev.updatedAt !== room.updatedAt) return room;
          return prev;
        });
      } catch {
        // 房间可能已关闭，静默处理
      }
    };
    pollRoom();
    const timer = setInterval(pollRoom, 2000);
    return () => clearInterval(timer);
  }, [phase, roomCode]);

  useEffect(() => {
    if (!roomCode || !userId || !activeRoom) return;
    const ws = connectMatchRoom(
      roomCode,
      userId,
      (message) => {
        if (message.event === "connected") {
          setActiveRoom(message.data.room);
          setUserId(message.data.userId);
        }
        if (message.event === "room_update") {
          setActiveRoom(message.data);
        }
        if (message.event === "error") {
          setApiMessage(message.data.message);
        }
      },
      () => {
        // WebSocket 断开不报错，轮询会继续工作
      },
    );

    const ping = window.setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
    }, 15000);

    return () => {
      window.clearInterval(ping);
      ws?.close();
    };
  }, [activeRoom, roomCode, userId]);

  useEffect(() => {
    if (!initialRoomCode || activeRoom || isBusy) return;
    void joinExistingRoom(initialRoomCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRoomCode, activeRoom, isBusy]);

  useEffect(() => {
    if (phase !== "hall") return;
    // 非房主端：检测到房间状态变为 playing 时自动进入场景
    if (activeRoom?.status === "playing" && !isHost) {
      setCountdown(COUNTDOWN_SECONDS);
      setPhase("found");
    }
  }, [activeRoom?.status, isHost, phase]);

  useEffect(() => {
    if (phase !== "hall") return;
    const timer = setInterval(() => setPulse((v) => (v + 1) % 100), 1400);
    return () => clearInterval(timer);
  }, [phase]);

  const enterScene = useCallback(() => {
    navigate({
      to: "/scene",
      search: roomCode
        ? { role: myRoleId, room: roomCode, userId }
        : { role: myRoleId },
    });
  }, [navigate, myRoleId, roomCode, userId]);

  useEffect(() => {
    if (phase !== "found") return;
    if (countdown <= 0) {
      enterScene();
      return;
    }
    const timer = setTimeout(() => setCountdown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown, enterScene]);

  const confirmMatch = async () => {
    if (!roomReady || !activeRoom) return;
    if (!isHost && !aiSubstitute) {
      setApiMessage("等待房主开始入梦。");
      return;
    }

    // 房主开始：确保自己状态是 ready，触发后端把房间状态设为 playing
    // 这样 B 端轮询到 status=playing 后会自动跳转
    if (!myReady) {
      try {
        const result = await setMatchReady(activeRoom.roomId, { userId, ready: true });
        setActiveRoom(result.room);
      } catch {
        // 忽略，继续进入
      }
    }

    setCountdown(COUNTDOWN_SECONDS);
    setPhase("found");
  };

  const saveNick = () => {
    const nextNick = normalizeNick(nickInput);
    setMyNick(nextNick);
    setNickInput(nextNick);
    setEditingNick(false);
  };

  const createRoom = async () => {
    setIsBusy(true);
    setApiMessage("");
    try {
      const result = await createMatchRoom({ userId, nick: myNick, roleId: myRoleId, storyId: "huatangchun" });
      setActiveRoom(result.room);
      setUserId(result.userId);
      setRoomCode(result.room.roomId);
      setJoinCodeInput(result.room.roomId);
      setCopiedRoomCode(false);
      setAiSubstitute(false);
      navigate({ to: "/matching", search: { role: myRoleId, room: result.room.roomId }, replace: true });
      await refreshLobbyRooms();
    } catch (error) {
      setApiMessage(error instanceof Error ? error.message : "新建房间失败");
    } finally {
      setIsBusy(false);
    }
  };

  const joinExistingRoom = async (code = joinCodeInput) => {
    const nextCode = code.trim().toUpperCase();
    if (!nextCode) {
      setApiMessage("请输入朋友发来的房间码。");
      return;
    }
    setIsBusy(true);
    setApiMessage("");
    try {
      const result = await joinMatchRoom(nextCode, { userId, nick: myNick, roleId: myRoleId });
      setActiveRoom(result.room);
      setUserId(result.userId);
      setRoomCode(result.room.roomId);
      setJoinCodeInput(result.room.roomId);
      setAiSubstitute(false);
      navigate({ to: "/matching", search: { role: myRoleId, room: result.room.roomId }, replace: true });
      await refreshLobbyRooms();
    } catch (error) {
      setApiMessage(error instanceof Error ? error.message : "加入房间失败");
    } finally {
      setIsBusy(false);
    }
  };

  const toggleReady = async () => {
    if (!activeRoom || !userId) return;
    setIsBusy(true);
    setApiMessage("");
    try {
      const result = await setMatchReady(activeRoom.roomId, { userId, ready: !myReady });
      setActiveRoom(result.room);
    } catch (error) {
      setApiMessage(error instanceof Error ? error.message : "准备状态更新失败");
    } finally {
      setIsBusy(false);
    }
  };

  const leaveRoom = async () => {
    if (!activeRoom || !userId) return;
    setIsBusy(true);
    setApiMessage("");
    try {
      await leaveMatchRoom(activeRoom.roomId, userId);
      setActiveRoom(null);
      setRoomCode("");
      setJoinCodeInput("");
      setCopiedRoomCode(false);
      setAiSubstitute(false);
      navigate({ to: "/matching", search: { role: myRoleId }, replace: true });
      await refreshLobbyRooms();
    } catch (error) {
      setApiMessage(error instanceof Error ? error.message : "退出房间失败");
    } finally {
      setIsBusy(false);
    }
  };

  const reloadActiveRoom = async () => {
    if (!roomCode) {
      await refreshLobbyRooms();
      return;
    }
    try {
      const room = await getMatchRoom(roomCode);
      setActiveRoom(room);
      setApiMessage("");
    } catch (error) {
      setApiMessage(error instanceof Error ? error.message : "房间刷新失败");
    }
  };

  const copyRoomCode = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard?.writeText(roomCode);
      setCopiedRoomCode(true);
    } catch {
      setCopiedRoomCode(true);
    }
  };

  const invitePlayer = async (playerId: string) => {
    setInvitedPlayerId(playerId);
    if (roomCode) {
      try {
        await navigator.clipboard?.writeText(roomCode);
      } catch {
        // 剪贴板不可用时静默忽略，房间码仍可手动复制
      }
    }
  };

  if (phase === "found") {
    return (
      <div className="relative h-full overflow-hidden bg-neutral-950">
        <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.85) 100%)",
          }}
        />

        <div className="relative z-10 flex h-full flex-col items-center justify-between px-6 pb-10 pt-14">
          <div className="text-center">
            <div className="text-[11px] tracking-[0.35em] text-amber-300/80">入梦旅人已寻得</div>
            <div className="mt-2 font-brush text-[24px] tracking-[0.2em] text-amber-100">缘 起 此 刻</div>
          </div>

          <div className="flex w-full items-center justify-center gap-3">
            <PlayerCard label={myNick} name={me.name} role={me.role} img={me.img} highlight />
            <div className="flex flex-col items-center gap-1">
              <Sparkles className="h-6 w-6 text-amber-300/80" />
              <div className="text-[10px] tracking-widest text-amber-200/60">对戏</div>
            </div>
            <PlayerCard label={partnerLabel} name={partner.name} role={partner.role} img={partner.img} />
          </div>

          <div className="w-full rounded-2xl border border-amber-300/25 bg-black/45 p-5 backdrop-blur-md">
            <div className="text-center">
              <div className="text-[10px] tracking-[0.3em] text-amber-300/70">本回剧本</div>
              <div className="mt-1 font-brush text-[18px] tracking-[0.15em] text-amber-100">
                第五幕 · 离心时刻
              </div>
              <div className="mt-2 text-[11px] text-amber-50/65">
                共 3 场戏 · 约 10 分钟 · 含暗巷追杀 QTE
              </div>
            </div>
            <div className="mt-4 border-t border-amber-200/15 pt-3 text-center">
              <div className="text-[11px] tracking-[0.2em] text-amber-200/55">第一幕</div>
              <div className="mt-1 text-[13px] text-amber-50/85">雪夜书房 · 一年之约</div>
              <div className="mt-2 text-[11px] italic text-amber-100/55">
                「等我一年。一年内不归，你便改嫁。」
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-3">
            <button
              onClick={enterScene}
              className="w-full rounded-full border-2 border-amber-400/60 bg-amber-500/20 py-3.5 text-[14px] tracking-[0.3em] text-amber-100 backdrop-blur transition-all hover:bg-amber-400/30 active:scale-95"
            >
              立 即 入 梦
            </button>
            <div className="text-[11px] text-amber-50/55">{countdown} 秒后自动进入</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden bg-[#17120f] text-white">
      <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,18,15,0.48)_0%,rgba(23,18,15,0.82)_36%,rgba(23,18,15,0.96)_100%)]" />

      <div className="relative z-10 flex h-full flex-col">
        <header className="flex items-center justify-between px-5 pt-12">
          <button
            onClick={() => navigate({ to: "/lobby" })}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/12 backdrop-blur-md transition active:scale-95"
            aria-label="返回"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h1 className="font-brush text-[25px] leading-none tracking-[0.12em] text-amber-50">站内匹配大厅</h1>
            <div className="mt-1 text-[10px] tracking-[0.28em] text-amber-100/55">第五幕 · 离心时刻</div>
          </div>
          <button
            onClick={() => setPulse((v) => v + 1)}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/12 backdrop-blur-md transition active:scale-95"
            aria-label="刷新"
          >
            <RefreshCw className={`h-4 w-4 ${pulse % 2 ? "rotate-45" : ""} transition-transform`} />
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-5 no-scrollbar">
          <section className="rounded-2xl border border-amber-200/20 bg-black/28 p-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <img src={me.img} alt={me.name} className="h-14 w-14 rounded-2xl object-cover ring-1 ring-amber-100/35" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="max-w-[128px] truncate text-[14px] font-medium text-amber-50">{myNick}</span>
                  <span className="rounded-full bg-amber-200/15 px-2 py-0.5 text-[10px] text-amber-100/75">你</span>
                </div>
                <div className="mt-0.5 truncate text-[11px] text-amber-50/55">
                  饰 {me.name} · {me.role}
                </div>
                {myTags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {myTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-amber-300/15 px-2 py-0.5 text-[9px] text-amber-200/85"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-[18px] font-semibold text-amber-100">{compatiblePlayers.length}</div>
                <div className="text-[10px] text-amber-50/45">可匹配</div>
              </div>
            </div>
            <div className="mt-3 border-t border-white/10 pt-3">
              {editingNick ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nickInput}
                    onChange={(e) => setNickInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveNick();
                      if (e.key === "Escape") {
                        setNickInput(myNick);
                        setEditingNick(false);
                      }
                    }}
                    maxLength={12}
                    autoFocus
                    className="min-w-0 flex-1 rounded-full border border-amber-200/25 bg-black/30 px-3 py-2 text-[12px] text-amber-50 outline-none placeholder:text-amber-50/30 focus:border-amber-200/60"
                    placeholder="输入你的昵称"
                  />
                  <button
                    onClick={saveNick}
                    className="shrink-0 rounded-full bg-amber-400 px-3 py-2 text-[11px] font-medium text-[#27160b] active:scale-95"
                  >
                    保存
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setNickInput(myNick);
                    setEditingNick(true);
                  }}
                  className="flex w-full items-center justify-between rounded-full bg-white/[0.06] px-3 py-2 text-left active:scale-[0.99]"
                >
                  <span className="truncate text-[11px] text-amber-50/60">朋友可通过昵称找到你：{myNick}</span>
                  <Pencil className="h-3.5 w-3.5 shrink-0 text-amber-100/55" />
                </button>
              )}
            </div>
          </section>

          <section className="mt-4 grid grid-cols-3 gap-2">
            <Stat icon={<Users className="h-3.5 w-3.5" />} label="大厅在线" value="24" />
            <Stat icon={<Clock3 className="h-3.5 w-3.5" />} label="平均等待" value="18s" />
            <Stat icon={<ShieldCheck className="h-3.5 w-3.5" />} label="剧本" value={scriptLabel} />
          </section>

          <section className="mt-4 rounded-2xl border border-amber-200/18 bg-black/26 p-4 backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] tracking-[0.24em] text-amber-100/45">ROOM</div>
                <h2 className="mt-1 text-[14px] font-semibold text-amber-50">联机准备房间</h2>
                <p className="mt-1 text-[11px] leading-5 text-amber-50/55">
                  每次开房生成新的房间码；同一房间内角色互斥，空位可用 AI 替补。
                </p>
              </div>
              <button
                onClick={createRoom}
                className="shrink-0 rounded-full bg-amber-400 px-3 py-2 text-[11px] font-medium text-[#27160b] active:scale-95"
              >
                {roomCode ? "换一个" : "新建"}
              </button>
            </div>
            {roomCode && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.07] px-3 py-3">
                  <div>
                    <div className="text-[10px] text-amber-50/45">本房间码</div>
                    <div className="mt-0.5 font-display text-[18px] tracking-[0.18em] text-amber-50">{roomCode}</div>
                  </div>
                  <button
                    onClick={copyRoomCode}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/12 px-3 py-2 text-[11px] text-amber-50 active:scale-95"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedRoomCode ? "已复制" : "复制"}
                  </button>
                </div>

                <div className="grid gap-2">
                  <RoomSlot
                    title={isHost ? "房主" : "队员"}
                    nick={myNick}
                    roleName={me.name}
                    roleDesc={me.role}
                    img={me.img}
                    ready={myReady}
                    badge={`你${isHost ? "·房主" : ""}`}
                    icon={isHost ? <Crown className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                    action={
                      <button
                        onClick={() => void toggleReady()}
                        disabled={isBusy}
                        className={`rounded-full px-3 py-1.5 text-[10px] font-medium active:scale-95 disabled:opacity-50 ${
                          myReady ? "bg-emerald-400 text-[#112016]" : "bg-amber-400 text-[#27160b]"
                        }`}
                      >
                        {myReady ? "已准备" : "准备"}
                      </button>
                    }
                  />
                  {partnerPlayer ? (
                    <RoomSlot
                      title={isHost ? "队友" : "房主"}
                      nick={partnerPlayer.nick}
                      roleName={partnerCharacter.name}
                      roleDesc={partnerCharacter.role}
                      img={partnerCharacter.img}
                      ready={partnerReady}
                      badge={partnerReady ? "已准备" : "待确认"}
                      icon={!isHost ? <Crown className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                      action={
                        isHost ? (
                          <button
                            onClick={() => void leaveRoom()}
                            disabled={isBusy}
                            className="rounded-full bg-rose-400/20 px-3 py-1.5 text-[10px] text-rose-200 active:scale-95 disabled:opacity-50"
                          >
                            请离
                          </button>
                        ) : (
                          <span className="text-[10px] text-amber-50/45">
                            {partnerPlayer.status === "ready" ? "就绪" : "等待中"}
                          </span>
                        )
                      }
                    />
                  ) : aiSubstitute ? (
                    <RoomSlot
                      title="AI 替补"
                      nick="系统代演"
                      roleName={partner.name}
                      roleDesc={partner.role}
                      img={partner.img}
                      ready
                      badge="可开局"
                      icon={<Bot className="h-3.5 w-3.5" />}
                      action={
                        <button
                          onClick={() => setAiSubstitute(false)}
                          className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] text-amber-50/70 active:scale-95"
                        >
                          取消
                        </button>
                      }
                    />
                  ) : (
                    <div className="flex items-center justify-between rounded-2xl border border-dashed border-amber-200/22 bg-white/[0.04] px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/[0.08] text-amber-100/55">
                          <DoorOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-[12px] font-medium text-amber-50">等待队友入房</div>
                          <div className="mt-0.5 text-[10px] text-amber-50/45">邀请互补角色，或启用 AI 替补</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setAiSubstitute(true)}
                        className="rounded-full bg-white/12 px-3 py-1.5 text-[10px] text-amber-50 active:scale-95"
                      >
                        AI 替补
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-black/22 px-3 py-2">
                  <div className="text-[10px] text-amber-50/45">开局条件</div>
                  <div className="flex items-center gap-2 text-[10px] text-amber-50/70">
                    {roomReady ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                    ) : (
                      <Circle className="h-3.5 w-3.5" />
                    )}
                    {roomReady ? "房间已就绪" : "等待准备完成"}
                  </div>
                </div>
              </div>
            )}
            {!roomCode && (
              <div className="mt-3 rounded-2xl border border-dashed border-amber-200/20 bg-white/[0.04] p-4 text-center text-[11px] text-amber-50/55">
                新建房间获取房间码，或输入朋友的房间码加入
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              <input
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void joinExistingRoom();
                }}
                maxLength={10}
                placeholder="输入房间码，如 HTC-1234"
                className="min-w-0 flex-1 rounded-full border border-amber-200/25 bg-black/30 px-4 py-2.5 text-[13px] tracking-[0.1em] text-amber-50 outline-none placeholder:text-amber-50/30 focus:border-amber-200/60"
              />
              <button
                onClick={() => void joinExistingRoom()}
                disabled={isBusy || !joinCodeInput.trim() || joinCodeInput.trim().toUpperCase() === roomCode}
                className="shrink-0 rounded-full bg-amber-400 px-5 py-2.5 text-[12px] font-medium text-[#27160b] transition active:scale-95 disabled:opacity-40"
              >
                加入
              </button>
            </div>
            {apiMessage && (
              <div className="mt-2 rounded-xl bg-rose-500/12 px-3 py-2 text-[11px] text-rose-200/85">
                {apiMessage}
              </div>
            )}
          </section>

          <section className="mt-5">
            {partnerPlayer ? (
              <div className="rounded-2xl border border-amber-200/15 bg-black/24 p-5 text-center backdrop-blur-md">
                <Users className="mx-auto h-6 w-6 text-amber-100/45" />
                <div className="mt-2 text-[12px] text-amber-50/70">房间已满员</div>
                <p className="mt-1 text-[11px] text-amber-50/45">
                  需有队员退出后才能邀请新旅人
                </p>
              </div>
            ) : (
              <>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[10px] tracking-[0.28em] text-amber-100/45">WAITING</div>
                <h2 className="mt-1 font-brush text-[22px] tracking-[0.08em] text-amber-50">等候中的旅人</h2>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-400/12 px-2.5 py-1 text-[10px] text-emerald-100/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                实时刷新
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-black/24 p-2 backdrop-blur-md">
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-amber-100/55" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索朋友昵称"
                  className="min-w-0 flex-1 bg-transparent text-[12px] text-amber-50 outline-none placeholder:text-amber-50/35"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-amber-50/55 active:scale-95"
                    aria-label="清空搜索"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="mt-2 px-1 text-[10px] text-amber-50/45">
                {normalizedSearch
                  ? `找到 ${visiblePlayers.length} 位昵称匹配的玩家`
                  : "输入朋友昵称，可直接邀请进入同一房间"}
              </div>
            </div>

            <div className="mt-3 space-y-3">
              {visiblePlayers.map((player) => (
                <div
                  key={player.id}
                  onClick={() => player.compatible && setSelectedPlayerId(player.id)}
                  className={`w-full rounded-2xl border p-3 text-left backdrop-blur-md transition active:scale-[0.99] ${
                    selectedPlayerId === player.id
                      ? "border-amber-300/60 bg-amber-200/12 shadow-[0_0_26px_rgba(251,191,36,0.12)]"
                      : player.compatible
                        ? "border-white/12 bg-black/26"
                        : "cursor-not-allowed border-white/8 bg-black/16 opacity-55"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="relative">
                      <img
                        src={player.character.img}
                        alt={player.character.name}
                        className="h-14 w-14 rounded-xl object-cover ring-1 ring-white/20"
                      />
                      {player.compatible && (
                        <span className="absolute -bottom-1 -right-1 rounded-full border border-emerald-200/40 bg-emerald-500 px-1.5 py-[1px] text-[8px] text-white">
                          合
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium text-amber-50">{player.nick}</div>
                          <div className="mt-0.5 text-[10px] text-amber-50/48">
                            饰 {player.character.name} · {STATUS_COPY[player.status]} · {player.latency}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${
                            player.compatible ? "bg-emerald-300/14 text-emerald-100" : "bg-rose-300/12 text-rose-100/70"
                          }`}
                        >
                          {player.compatible ? "推荐" : "角色占用"}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-amber-50/65">{player.line}</p>
                      <div className="mt-2 flex items-end justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          {player.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-white/8 px-2 py-0.5 text-[9px] text-amber-50/55">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <button
                          disabled={!player.compatible}
                          onClick={(e) => {
                            e.stopPropagation();
                            invitePlayer(player.id);
                          }}
                          className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-medium transition active:scale-95 ${
                            player.compatible
                              ? invitedPlayerId === player.id
                                ? "bg-emerald-400 text-[#112016]"
                                : "bg-amber-400 text-[#27160b]"
                              : "cursor-not-allowed bg-white/10 text-white/35"
                          }`}
                        >
                          {player.compatible ? (
                            <span className="inline-flex items-center gap-1">
                              <UserPlus className="h-3 w-3" />
                              {invitedPlayerId === player.id ? "已邀请" : "邀请入房"}
                            </span>
                          ) : (
                            "不可邀请"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {visiblePlayers.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center text-[12px] text-amber-50/55">
                  没有搜到这个昵称，确认朋友已经进入匹配大厅。
                </div>
              )}
            </div>
              </>
            )}
          </section>
        </main>

        <footer className="border-t border-white/10 bg-[#17120f]/88 px-5 pb-8 pt-4 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between rounded-2xl bg-white/[0.06] px-3 py-2">
            <div className="min-w-0">
              <div className="text-[10px] text-amber-50/45">当前选择</div>
              <div className="mt-0.5 truncate text-[12px] text-amber-50">
                {roomCode
                  ? `${roomCode} · ${roomReady ? "可以开局" : "等待准备"}`
                  : selectedCompatible
                    ? `${selectedPlayer.nick} · ${partner.name}`
                    : "暂无可匹配角色"}
              </div>
            </div>
            <Search className="h-4 w-4 text-amber-100/60" />
          </div>
          <button
            disabled={!roomReady}
            onClick={confirmMatch}
            className={`flex h-13 w-full items-center justify-center gap-2 rounded-full text-[14px] font-medium tracking-[0.16em] transition active:scale-[0.98] ${
              roomReady
                ? "bg-amber-500 text-[#26140b] shadow-[0_12px_28px_rgba(245,158,11,0.22)]"
                : "cursor-not-allowed bg-white/12 text-white/35"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            {roomReady ? "房主开始入梦" : roomCode ? "等待房间就绪" : "先新建房间"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function RoomSlot({
  title,
  nick,
  roleName,
  roleDesc,
  img,
  ready,
  badge,
  icon,
  action,
}: {
  title: string;
  nick: string;
  roleName: string;
  roleDesc: string;
  img: string;
  ready: boolean;
  badge: string;
  icon: React.ReactNode;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-3 py-3">
      <div className="relative">
        <img src={img} alt={roleName} className="h-12 w-12 rounded-xl object-cover ring-1 ring-amber-100/25" />
        <span
          className={`absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-black/40 ${
            ready ? "bg-emerald-400 text-[#102016]" : "bg-white/18 text-amber-50/60"
          }`}
        >
          {ready ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[10px] text-amber-100/55">
          {icon}
          <span>{title}</span>
          <span className="rounded-full bg-white/10 px-1.5 py-[1px] text-[9px] text-amber-50/55">{badge}</span>
        </div>
        <div className="mt-1 truncate text-[12px] font-medium text-amber-50">{nick}</div>
        <div className="mt-0.5 truncate text-[10px] text-amber-50/48">
          饰 {roleName} · {roleDesc}
        </div>
      </div>
      {action}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/24 p-3 backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-amber-100/55">
        {icon}
        <span className="text-[9px]">{label}</span>
      </div>
      <div className="mt-1 text-[16px] font-semibold text-amber-50">{value}</div>
    </div>
  );
}

function PlayerCard({
  label,
  name,
  role,
  img,
  highlight,
}: {
  label: string;
  name: string;
  role: string;
  img: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex w-32 flex-col items-center rounded-2xl border bg-black/40 p-3 backdrop-blur-md ${
        highlight ? "border-amber-300/60 shadow-[0_0_24px_rgba(251,191,36,0.15)]" : "border-white/15"
      }`}
    >
      <div className="max-w-full truncate text-[10px] tracking-[0.18em] text-amber-200/70">{label}</div>
      <img src={img} alt={name} className="mt-2 h-20 w-20 rounded-full border-2 border-amber-200/50 object-cover" />
      <div className="mt-2 font-brush text-[15px] tracking-wider text-amber-100">{name}</div>
      <div className="mt-1 line-clamp-2 text-center text-[10px] leading-tight text-amber-50/60">{role}</div>
    </div>
  );
}

function MatchingPage() {
  return (
    <PhoneMockup>
      <Matching />
    </PhoneMockup>
  );
}
