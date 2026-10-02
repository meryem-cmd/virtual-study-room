"use client";

import { useActionState } from "react";
import { joinRoom, type JoinRoomState } from "@/lib/actions/room";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: JoinRoomState = {};

export function JoinRoomForm() {
  const [state, formAction, isPending] = useActionState(
    joinRoom,
    initialState
  );

  return (
    <form action={formAction} className="space-y-3">
      <Input
        label="Room code"
        id="room-code"
        name="code"
        required
        maxLength={6}
        className="uppercase"
      />
      {state.error && <p className="text-sm text-rust">{state.error}</p>}
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Joining…" : "Join room"}
      </Button>
    </form>
  );
}