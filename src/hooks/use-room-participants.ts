"use client";

import { useEffect, useState } from "react";
import { useSocketStore } from "@/lib/socket-store";

export type Participant = { socketId: string; userName: string };

// Listen-only: RoomPresence (via useRoomSocket) owns joining/leaving the room.
// This just watches the same roster events so the call UI knows who to ring.
export function useRoomParticipants() {
  const socket = useSocketStore((s) => s.socket);
  const isConnected = useSocketStore((s) => s.isConnected);
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    if (!socket) return;

    function onRoster(roster: Participant[]) {
      setParticipants(roster);
    }

    function onUserJoined(p: Participant) {
      setParticipants((prev) => [
        ...prev.filter((x) => x.socketId !== p.socketId),
        p,
      ]);
    }

    function onUserLeft({ socketId }: { socketId: string }) {
      setParticipants((prev) => prev.filter((x) => x.socketId !== socketId));
    }

    socket.on("room:roster", onRoster);
    socket.on("room:user-joined", onUserJoined);
    socket.on("room:user-left", onUserLeft);

    return () => {
      socket.off("room:roster", onRoster);
      socket.off("room:user-joined", onUserJoined);
      socket.off("room:user-left", onUserLeft);
    };
  }, [socket]);

  // isConnected is read so this re-renders once socket.id is assigned
  const mySocketId = isConnected ? socket?.id ?? null : null;

  return { participants, mySocketId };
}