"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerUser, type RegisterState } from "@/lib/actions/register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: RegisterState = {};

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(
    registerUser,
    initialState
  );

  if (state.success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-3xl text-ink">You're in</h1>
          <p className="mt-2 text-sm text-ink/60">
            Your account is ready.{" "}
            <Link href="/login" className="text-lamp-dark underline">
              Sign in
            </Link>{" "}
            to start a room.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink">Create an account</h1>
        <p className="mt-1 text-sm text-ink/60">
          Set up a focused space for you and your group.
        </p>

        <form action={formAction} className="mt-8 space-y-4">
          <Input label="Name" id="name" name="name" required />
          <Input label="Email" id="email" name="email" type="email" required />
          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            required
          />

          {state.error && <p className="text-sm text-rust">{state.error}</p>}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-8 text-sm text-ink/60">
          Already have an account?{" "}
          <Link href="/login" className="text-lamp-dark underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}