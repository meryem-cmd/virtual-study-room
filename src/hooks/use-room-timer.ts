"use client";

import { useEffect, useState } from "react";
import { useSocketStore } from "@/lib/socket-store";

export type TimerState = {
  mode: "focus" | "break";
  status: "idle" | "running" | "paused";
  endsAt: number | null;
  remainingMs: number;
  serverNow: number;
};

export function useRoomTimer(roomCode: string) {
  const socket = useSocketStore((s) => s.socket);
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [offset, setOffset] = useState(0); // (server clock) minus (my clock)
  const [now, setNow] = useState(() => Date.now());

  // Listen for the server's timer updates
  useEffect(() => {
    if (!socket) return;
    function onState(state: TimerState) {
      setTimer(state);
      setOffset(state.serverNow - Date.now());
    }
    socket.on("timer:state", onState);
    return () => {
      socket.off("timer:state", onState);
    };
  }, [socket]);

  // While running, redraw a few times a second so the display stays smooth
  useEffect(() => {
    if (timer?.status !== "running") return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [timer?.status]);

  const remainingMs =
    !timer
      ? 0
      : timer.status === "running" && timer.endsAt !== null
      ? Math.max(0, timer.endsAt - (now + offset))
      : timer.remainingMs;

  return {
    timer,
    remainingMs,
    start: () => socket?.emit("timer:start", { roomCode }),
    pause: () => socket?.emit("timer:pause", { roomCode }),
    reset: () => socket?.emit("timer:reset", { roomCode }),
  };
}