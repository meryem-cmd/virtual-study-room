"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleCredentialsSubmit(formData: FormData) {
    setError("");
    setIsPending(true);

    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    setIsPending(false);

    if (result?.error) {
      setError("That email and password don't match.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-ink/60">
          Sign in to get back to your room.
        </p>

        <form action={handleCredentialsSubmit} className="mt-8 space-y-4">
          <Input label="Email" id="email" name="email" type="email" required />
          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            required
          />

          {error && <p className="text-sm text-rust">{error}</p>}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-rule" />
          <span className="text-xs text-ink/40">or</span>
          <div className="h-px flex-1 bg-rule" />
        </div>

        <Button
          variant="secondary"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="mt-6 w-full"
        >
          Continue with Google
        </Button>

        <p className="mt-8 text-sm text-ink/60">
          No account?{" "}
          <Link href="/register" className="text-lamp-dark underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}