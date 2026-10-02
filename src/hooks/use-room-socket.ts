"use client";

import { useEffect } from "react";
import { useSocketStore } from "@/lib/socket-store";

export function useRoomSocket(roomCode: string, userName: string) {
  const { socket, isConnected, connect, disconnect } = useSocketStore();

  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("room:join", { roomCode, userName });

    return () => {
      socket.emit("room:leave", { roomCode });
    };
  }, [socket, isConnected, roomCode, userName]);

  return { socket, isConnected };
}