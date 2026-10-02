"use client";

import { useEffect, useState } from "react";
import { useSocketStore } from "@/lib/socket-store";
import { saveMessage } from "@/lib/actions/chat";

export type ChatMessage = {
  id: string;
  userName: string;
  content: string;
  createdAt: string;
};

export function useRoomChat(
  roomId: string,
  roomCode: string,
  userName: string,
  initialMessages: ChatMessage[]
) {
  const socket = useSocketStore((s) => s.socket);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  useEffect(() => {
    if (!socket) return;
    function onMessage(msg: ChatMessage) {
      setMessages((prev) => [...prev, msg]);
    }
    socket.on("chat:message", onMessage);
    return () => {
      socket.off("chat:message", onMessage);
    };
  }, [socket]);

  function send(content: string) {
    if (!content.trim()) return;

    const msg: ChatMessage = {
      id: crypto.randomUUID(), // temporary client-side id, just for the React key
      userName,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    // Show it immediately for the sender — don't wait on the network
    setMessages((prev) => [...prev, msg]);

    // Tell everyone else right now
    socket?.emit("chat:message", { roomCode, ...msg });

    // Persist in the background — doesn't block the UI
    saveMessage(roomId, content).catch((err) => {
      console.error("Failed to save message:", err);
    });
  }

  return { messages, send };
}