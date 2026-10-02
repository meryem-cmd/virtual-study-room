"use client";

import { useEffect, useRef, useState } from "react";
import { useRoomChat, type ChatMessage } from "@/hooks/use-room-chat";
import { Avatar } from "@/components/avatar";
import { SendIcon } from "@/components/icons";

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RoomChat({
  roomId,
  roomCode,
  userName,
  initialMessages,
}: {
  roomId: string;
  roomCode: string;
  userName: string;
  initialMessages: ChatMessage[];
}) {
  const { messages, send } = useRoomChat(
    roomId,
    roomCode,
    userName,
    initialMessages
  );
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    send(draft);
    setDraft("");
  }

  return (
    <section className="rounded-xl border border-rule bg-white p-5">
      <h2 className="text-sm font-medium text-ink">Chat</h2>

      <div className="mt-4 h-64 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="pt-16 text-center text-sm text-ink/40">
            No messages yet. Say hello to start the session.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex gap-3">
            <Avatar name={m.userName} size="sm" />
            <div className="min-w-0">
              <p className="text-sm">
                <span className="font-medium text-ink">{m.userName}</span>{" "}
                <span
                  className="text-xs text-ink/40"
                  suppressHydrationWarning
                >
                  {timeOf(m.createdAt)}
                </span>
              </p>
              <p className="break-words text-sm text-ink/80">{m.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-4 flex gap-2 border-t border-rule pt-4"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message the room"
          aria-label="Message"
          className="flex-1 rounded-md border border-rule bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-lamp focus:outline-none focus:ring-2 focus:ring-lamp/40"
        />
        <button
          type="submit"
          aria-label="Send message"
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-ink px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-lamp/40"
        >
          <SendIcon className="h-4 w-4" />
          Send
        </button>
      </form>
    </section>
  );
}