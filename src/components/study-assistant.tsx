"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";

// Tiny markdown helper: **bold** and `code`, so Gemini's replies don't show
// raw asterisks. For lists, headings and tables, install react-markdown later.
function renderInline(text: string) {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return tokens.map((t, i) => {
    if (t.length > 4 && t.startsWith("**") && t.endsWith("**")) {
      return (
        <strong key={i} className="font-medium text-ink">
          {t.slice(2, -2)}
        </strong>
      );
    }
    if (t.length > 2 && t.startsWith("`") && t.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-ink/5 px-1 py-0.5 text-[0.85em] text-ink"
        >
          {t.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{t}</span>;
  });
}

const SUGGESTIONS = [
  "Summarize what we've discussed",
  "Quiz me on this topic",
  "Explain the last point simply",
];

export function StudyAssistant({
  roomCode,
  roomSubject,
}: {
  roomCode: string;
  roomSubject?: string;
}) {
  // Only the room code goes to the server. The route looks up the subject and
  // the recent chat itself, so they are always fresh and can't be faked.
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/study-assistant",
        body: { roomCode },
      }),
    [roomCode]
  );

  const { messages, sendMessage, status, error } = useChat({ transport });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const busy = status === "submitted" || status === "streaming";

  // Keep the newest text in view while it streams in
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  function ask(text: string) {
    if (!text.trim() || busy) return;
    sendMessage({ text: text.trim() });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    ask(input);
    setInput("");
  }

  return (
    <section className="rounded-xl border border-rule bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink">Study assistant</h2>
        <span className="rounded-full bg-lamp/15 px-2 py-0.5 text-xs text-ink">
          AI
        </span>
      </div>

      <div
        ref={scrollRef}
        className="mt-4 h-64 space-y-4 overflow-y-auto pr-1"
      >
        {messages.length === 0 && (
          <div className="pt-4">
            <p className="text-sm text-ink/50">
              Ask me anything about {roomSubject || "what you're studying"}. I
              can also see the room chat.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  disabled={busy}
                  className="rounded-full border border-rule px-3 py-1 text-xs text-ink/70 transition-colors hover:border-ink/30 hover:text-ink focus:outline-none focus:ring-2 focus:ring-lamp/40 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={m.role === "user" ? "flex justify-end" : "flex"}
          >
            <div
              className={`max-w-[92%] whitespace-pre-wrap break-words text-sm ${
                m.role === "user"
                  ? "rounded-lg bg-ink/5 px-3 py-2 text-ink"
                  : "text-ink/80"
              }`}
            >
              {m.parts.map((part, i) =>
                part.type === "text" ? (
                  <span key={i}>{renderInline(part.text)}</span>
                ) : null
              )}
            </div>
          </div>
        ))}

        {status === "submitted" && (
          <p className="text-sm text-ink/40">Thinking…</p>
        )}

        {error && (
          <p className="text-sm text-rust">
            Something went wrong. Please try again.
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-4 flex gap-2 border-t border-rule pt-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this topic…"
          aria-label="Ask the study assistant"
          className="min-w-0 flex-1 rounded-md border border-rule bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-lamp focus:outline-none focus:ring-2 focus:ring-lamp/40"
        />
        <Button type="submit" disabled={busy}>
          Ask
        </Button>
      </form>
    </section>
  );
}