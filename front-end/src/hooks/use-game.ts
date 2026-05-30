/**
 * useGame — 游戏状态 hook
 * 管理创建/加入/开始/对话/选择/结局 全流程
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createGame,
  joinGame,
  startGame,
  choose,
  mookChoose,
  speak,
  finishGame,
  connectWs,
  type NodeData,
  type GameResult,
  type WsEvent,
  type Segment,
} from "@/lib/game-api";

export type ChatMessage =
  | { kind: "narration"; text: string }
  | { kind: "dialog"; charId: string; speaker: string; text: string }
  | { kind: "action"; charId: string; speaker: string; text: string }
  | { kind: "me"; text: string; mode: "say" | "do" }
  | { kind: "choice"; choices: { index: number; text: string; influence_hint: string }[] }
  | { kind: "notice"; text: string }
  | { kind: "reward"; text: string };

type GamePhase = "idle" | "creating" | "joined" | "playing" | "ended";

// Map backend role_id to frontend character id
const ROLE_TO_CHAR: Record<string, string> = {
  wentang: "wentang",
  peirong: "peirong",
  peiyan: "peiyan",
  peiyu: "peiyu",
  empress: "empress",
  mama: "mama",
};

function segmentToMessage(seg: Segment): ChatMessage {
  if (seg.speaker_type === "narrator" || seg.speaker_type === "system") {
    return { kind: "narration", text: seg.text };
  }
  // character or bot
  const charId = Object.entries(ROLE_TO_CHAR).find(
    ([, name]) => seg.speaker.includes(name) || name.includes(seg.speaker)
  )?.[0] ?? seg.speaker;

  // Find charId by speaker name
  const nameToId: Record<string, string> = {
    "温棠": "wentang",
    "裴容": "peirong",
    "裴琰": "peiyan",
    "裴瑜": "peiyu",
    "皇后": "empress",
    "陈嬷嬷": "mama",
  };
  const resolvedId = nameToId[seg.speaker] ?? charId;

  if (seg.inner_thought) {
    return { kind: "action", charId: resolvedId, speaker: seg.speaker, text: seg.text };
  }
  return { kind: "dialog", charId: resolvedId, speaker: seg.speaker, text: seg.text };
}

export function useGame(myRoleId: string = "wentang", gameMode: string = "solo") {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [gameId, setGameId] = useState<string>("");
  const [userId] = useState(() => `user_${Math.random().toString(36).slice(2, 8)}`);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentNode, setCurrentNode] = useState<NodeData | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Process node data into messages
  const processNode = useCallback((node: NodeData) => {
    setCurrentNode(node);
    const newMsgs: ChatMessage[] = [];
    for (const seg of node.segments) {
      newMsgs.push(segmentToMessage(seg));
    }
    // Show choices only if it's my turn (or no mook_active_role specified)
    const isMyTurn = !node.mook_active_role || node.mook_active_role === myRoleId;
    if (node.choices.length > 0 && !node.is_ending && isMyTurn) {
      newMsgs.push({ kind: "choice", choices: node.choices });
    } else if (!node.is_ending && isMyTurn && node.waiting_for !== undefined) {
      // No choices but game continues — show "continue" button
      newMsgs.push({ kind: "choice", choices: [{ index: 0, text: "继续", influence_hint: "" }] });
    } else if (!node.is_ending && !isMyTurn) {
      newMsgs.push({ kind: "notice", text: `等待对方操作中…` });
    }
    if (node.is_ending) {
      newMsgs.push({ kind: "notice", text: `【${node.ending_type}】${node.ending_title}` });
    }
    setMessages((prev) => [...prev, ...newMsgs]);
  }, []);

  // Handle WS events
  const handleWsEvent = useCallback((event: WsEvent) => {
    switch (event.event) {
      case "connected":
        // Initial state already loaded via REST
        break;
      case "game_start":
        // Player B started the game, process the node
        setPhase("playing");
        processNode(event.data);
        break;
      case "node_update":
        processNode(event.data);
        break;
      case "player_action":
        // Other player made a choice in MOOK mode
        setMessages((prev) => [...prev, {
          kind: "notice",
          text: `${event.data.role_name || "对方"} 选择了：${event.data.text || "继续"}`,
        }]);
        break;
      case "game_end":
        setResult(event.data);
        setPhase("ended");
        break;
      case "message":
        // Real-time message (from speak)
        const d = event.data;
        {
          const nameToId: Record<string, string> = {
            "温棠": "wentang", "裴容": "peirong", "裴琰": "peiyan",
            "裴瑜": "peiyu", "皇后": "empress", "陈嬷嬷": "mama",
          };
          const speakerId = nameToId[d.speaker] ?? d.speaker;
          // Skip own player messages (already added locally in sendMessage)
          if (d.speaker_type === "player" && speakerId === myRoleId) {
            break;
          }
          setMessages((prev) => [...prev, {
            kind: "dialog",
            charId: speakerId,
            speaker: d.speaker,
            text: d.text,
          }]);
        }
        break;
      case "state_change":
        if (event.data.influence_hint) {
          setMessages((prev) => [...prev, {
            kind: "reward",
            text: event.data.influence_hint,
          }]);
        }
        break;
      case "player_leave":
        setMessages((prev) => [...prev, {
          kind: "notice",
          text: `玩家 ${event.data.user_id} 离开了`,
        }]);
        break;
    }
  }, [processNode]);

  // ── Actions ──

  const initSoloGame = useCallback(async () => {
    setLoading(true);
    try {
      // Create with protagonist_role to get correct perspective
      const meta = await createGame("huatangchun", myRoleId);
      setGameId(meta.game_id);
      await joinGame(meta.game_id, userId, myRoleId);
      const nodeData = await startGame(meta.game_id, myRoleId);
      setPhase("playing");
      processNode(nodeData as unknown as NodeData);

      // Connect WebSocket
      wsRef.current = connectWs(meta.game_id, userId, handleWsEvent);
    } catch (e) {
      console.error("initSoloGame failed:", e);
      setMessages((prev) => [...prev, { kind: "notice", text: `连接失败: ${e}` }]);
    } finally {
      setLoading(false);
    }
  }, [userId, myRoleId, processNode, handleWsEvent]);

  const initDuoGame = useCallback(async (player2RoleId: string) => {
    setLoading(true);
    try {
      // Create MOOK (dual-player) story
      const meta = await createGame("huatangchun_mook", "mook");
      setGameId(meta.game_id);
      // Player 1 joins
      await joinGame(meta.game_id, userId, myRoleId);
      setPhase("joined");
      // Show invite link
      const inviteUrl = `${window.location.origin}/play?role=${player2RoleId}&mode=duo&join=${meta.game_id}`;
      setMessages((prev) => [...prev, {
        kind: "notice",
        text: `房间已创建！发送链接给队友加入：`,
      }, {
        kind: "notice",
        text: inviteUrl,
      }]);
      // Connect WS
      wsRef.current = connectWs(meta.game_id, userId, handleWsEvent);
      // Wait for player 2 to join, then start
      // Player 2 joining will trigger via initJoinGame which calls startGame
    } catch (e) {
      console.error("initDuoGame failed:", e);
      setMessages((prev) => [...prev, { kind: "notice", text: `连接失败: ${e}` }]);
    } finally {
      setLoading(false);
    }
  }, [userId, myRoleId, processNode, handleWsEvent]);

  const initJoinGame = useCallback(async (existingGameId: string) => {
    setLoading(true);
    try {
      setGameId(existingGameId);
      await joinGame(existingGameId, userId, myRoleId);
      // Both players in, start the game
      const nodeData = await startGame(existingGameId, myRoleId);
      setPhase("playing");
      processNode(nodeData as unknown as NodeData);
      wsRef.current = connectWs(existingGameId, userId, handleWsEvent);
    } catch (e) {
      console.error("initJoinGame failed:", e);
      setMessages((prev) => [...prev, { kind: "notice", text: `加入失败: ${e}` }]);
    } finally {
      setLoading(false);
    }
  }, [userId, myRoleId, processNode, handleWsEvent]);

  const makeChoice = useCallback(async (choiceIndex: number) => {
    if (!gameId) return;
    setLoading(true);
    try {
      let res;
      if (gameMode === "duo") {
        // MOOK mode: use mook-choose with role_id
        res = await mookChoose(gameId, userId, myRoleId, choiceIndex);
      } else {
        res = await choose(gameId, userId, choiceIndex);
      }
      if (res.status === "finished") {
        setResult(res.result);
        setPhase("ended");
      }
      // node_update comes via WS, but also handle REST response
      if (res.node_id) {
        processNode(res as unknown as NodeData);
      }
    } catch (e) {
      console.error("choose failed:", e);
      setMessages((prev) => [...prev, { kind: "notice", text: `操作失败: ${e}` }]);
    } finally {
      setLoading(false);
    }
  }, [gameId, userId, myRoleId, gameMode, processNode]);

  const sendMessage = useCallback(async (text: string) => {
    if (!gameId) return;
    // Show own message immediately
    const isAction = /^（[\s\S]+）$/.test(text.trim());
    setMessages((prev) => [...prev, {
      kind: "me",
      text: isAction ? text.replace(/^（|）$/g, "") : text,
      mode: isAction ? "do" : "say",
    }]);
    try {
      await speak(gameId, userId, text);
      // Response comes via WS broadcast
    } catch (e) {
      console.error("speak failed:", e);
      setMessages((prev) => [...prev, { kind: "notice", text: `发送失败: ${e}` }]);
    }
  }, [gameId, userId]);

  const endGame = useCallback(async () => {
    if (!gameId) return;
    try {
      const res = await finishGame(gameId);
      setResult(res);
      setPhase("ended");
    } catch (e) {
      console.error("endGame failed:", e);
    }
  }, [gameId]);

  // Cleanup WS on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return {
    phase,
    gameId,
    userId,
    messages,
    currentNode,
    result,
    loading,
    initSoloGame,
    initDuoGame,
    initJoinGame,
    makeChoice,
    sendMessage,
    endGame,
  };
}
