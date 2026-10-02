"use client";

import { useRoomTimer } from "@/hooks/use-room-timer";
import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon } from "@/components/icons";

// Must match DURATIONS in the socket server
const TOTAL_MS = {
  focus: 25 * 60 * 1000,
  break: 5 * 60 * 1000,
} as const;

function format(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function RoomTimer({ roomCode }: { roomCode: string }) {
  const { timer, remainingMs, start, pause, reset } = useRoomTimer(roomCode);

  if (!timer) {
    return (
      <section className="rounded-xl border border-rule bg-white p-5">
        <p className="text-sm text-ink/40">Syncing timer…</p>
      </section>
    );
  }

  const isRunning = timer.status === "running";
  const isFocus = timer.mode === "focus";
  const total = TOTAL_MS[timer.mode];
  const progress = Math.min(1, Math.max(0, 1 - remainingMs / total));

  return (
    <section className="rounded-xl border border-rule bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink">
          {isFocus ? "Focus session" : "Break"}
        </h2>
        <span className="text-xs text-ink/40">
          {isRunning ? "Running" : timer.status === "paused" ? "Paused" : "Ready"}
        </span>
      </div>

      <p className="mt-3 text-center font-display text-6xl leading-none text-ink tabular-nums">
        {format(remainingMs)}
      </p>

      <div
        className="mt-5 h-1 overflow-hidden rounded-full bg-ink/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            isFocus ? "bg-lamp" : "bg-sage"
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="mt-5 flex justify-center gap-2">
        {isRunning ? (
          <Button variant="secondary" onClick={pause}>
            <span className="inline-flex items-center gap-1.5">
              <PauseIcon className="h-4 w-4" />
              Pause
            </span>
          </Button>
        ) : (
          <Button onClick={start}>
            <span className="inline-flex items-center gap-1.5">
              <PlayIcon className="h-4 w-4" />
              {timer.status === "paused" ? "Resume" : "Start"}
            </span>
          </Button>
        )}
        <Button variant="secondary" onClick={reset}>
          Reset
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-ink/40">
        Synced for everyone in the room
      </p>
    </section>
  );
}