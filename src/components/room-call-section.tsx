"use client";

import { useRoomParticipants } from "@/hooks/use-room-participants";
import { RoomCall } from "@/components/room-call";

export function RoomCallSection({ roomCode }: { roomCode: string }) {
  const { participants, mySocketId } = useRoomParticipants();

  const otherParticipants = participants.filter(
    (p) => p.socketId !== mySocketId
  );

  return <RoomCall roomCode={roomCode} otherParticipants={otherParticipants} />;
}