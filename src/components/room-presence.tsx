"use client";

import { useEffect, useState } from "react";
import { useRoomSocket } from "@/hooks/use-room-socket";
import { Avatar } from "@/components/avatar";

type Participant = { socketId: string; userName: string };

export function RoomPresence({
  roomCode,
  userName,
  hostName,
}: {
  roomCode: string;
  userName: string;
  hostName: string;
}) {
  const { socket, isConnected } = useRoomSocket(roomCode, userName);
  // Keyed by userName, not socketId — guarantees one row per person
  // no matter how many times a "joined" event fires for them.
  const [participants, setParticipants] = useState<Map<string, Participant>>(
    new Map()
  );

  useEffect(() => {
    if (!socket) return;

    function onRoster(roster: Participant[]) {
      const map = new Map<string, Participant>();
      for (const p of roster) map.set(p.userName, p);
      setParticipants(map);
    }

    function onUserJoined(p: Participant) {
      setParticipants((prev) => {
        const next = new Map(prev);
        next.set(p.userName, p);
        return next;
      });
    }

    function onUserLeft({ socketId }: { socketId: string }) {
      setParticipants((prev) => {
        const next = new Map(prev);
        for (const [name, p] of next.entries()) {
          if (p.socketId === socketId) next.delete(name);
        }
        return next;
      });
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

  const list = Array.from(participants.values());

  return (
    <section className="rounded-xl border border-rule bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink">
          In the room <span className="text-ink/40">({list.length})</span>
        </h2>
        <span
          className={`inline-flex items-center gap-1.5 text-xs ${
            isConnected ? "text-ink/60" : "text-ink/40"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isConnected ? "bg-sage" : "bg-ink/20"
            }`}
          />
          {isConnected ? "Live" : "Connecting…"}
        </span>
      </div>

      <ul className="mt-3 divide-y divide-rule">
        {list.length === 0 && (
          <li className="py-3 text-sm text-ink/40">Joining the room…</li>
        )}
        {list.map((p) => {
          const isYou = p.userName === userName;
          const isHost = p.userName === hostName;
          return (
            <li key={p.userName} className="flex items-center gap-3 py-2.5">
              <Avatar name={p.userName} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {p.userName}
                </p>
                {(isHost || isYou) && (
                  <p className="text-xs text-ink/40">
                    {[isHost && "Host", isYou && "You"]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-sage"
                title="Online"
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}