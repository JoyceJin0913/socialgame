/**
 * useRoomChat · 双人实时对话同步 hook
 *
 * 基于房间消息通道（轮询），实现两个玩家的实时对话同步。
 * - 本地玩家发消息 → postRoomChat → 写入房间 chatLog
 * - 每 1.5 秒轮询 getRoomChat(since=lastTimestamp) → 拉取新消息
 * - 只处理对方消息（本地发送的消息已在 UI 立即显示）
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getRoomChat, postRoomChat, type RoomChatMessage, type RoomChatMeta } from "@/lib/matchmaking-api";

export type SyncedMessage = {
  id: string;
  userId: string;
  nick: string;
  roleId: string;
  text: string;
  meta?: RoomChatMeta;
  timestamp: number;
  isMine: boolean;
};

export function useRoomChat(roomId: string | null, userId: string) {
  const [messages, setMessages] = useState<SyncedMessage[]>([]);
  const lastTimestampRef = useRef(0);
  const myMessageIdsRef = useRef<Set<string>>(new Set());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 轮询拉取新消息
  const poll = useCallback(async () => {
    if (!roomId) return;
    try {
      const newMsgs = await getRoomChat(roomId, lastTimestampRef.current);
      if (newMsgs.length === 0) return;

      for (const m of newMsgs) {
        if (m.timestamp > lastTimestampRef.current) {
          lastTimestampRef.current = m.timestamp;
        }
      }

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const toAdd = newMsgs
          .filter((m) => !existingIds.has(m.id))
          .map((m) => ({
            ...m,
            isMine: m.userId === userId || myMessageIdsRef.current.has(m.id),
          }));
        return [...prev, ...toAdd];
      });
    } catch {
      // 轮询失败静默处理
    }
  }, [roomId, userId]);

  useEffect(() => {
    if (!roomId) return;
    poll();
    pollingRef.current = setInterval(poll, 1500);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [roomId, poll]);

  const sendMessage = useCallback(
    async (text: string, meta?: RoomChatMeta): Promise<SyncedMessage | null> => {
      if (!roomId || !text.trim()) return null;
      const msg = await postRoomChat(roomId, { userId, text: text.trim(), meta });
      myMessageIdsRef.current.add(msg.id);
      lastTimestampRef.current = Math.max(lastTimestampRef.current, msg.timestamp);
      const synced = { ...msg, isMine: true };
      setMessages((prev) => [...prev, synced]);
      return synced;
    },
    [roomId, userId],
  );

  const reset = useCallback(() => {
    setMessages([]);
    lastTimestampRef.current = 0;
    myMessageIdsRef.current.clear();
  }, []);

  return { messages, sendMessage, reset, poll };
}
