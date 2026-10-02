"use client";

import { useActionState } from "react";
import { createRoom, type CreateRoomState } from "@/lib/actions/room";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: CreateRoomState = {};

export function CreateRoomForm() {
  const [state, formAction, isPending] = useActionState(
    createRoom,
    initialState
  );

  return (
    <form action={formAction} className="space-y-3">
      <Input label="Room name" id="room-name" name="name" required />
      <Input label="Subject" id="room-subject" name="subject" />
      {state.error && <p className="text-sm text-rust">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "Create room"}
      </Button>
    </form>
  );
}