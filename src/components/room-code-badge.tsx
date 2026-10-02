"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";

export function RoomCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy room code"
      className="inline-flex items-center gap-2 rounded-md border border-rule bg-white px-3 py-1.5 text-xs tracking-widest text-ink/70 transition-colors hover:border-ink/30 hover:text-ink focus:outline-none focus:ring-2 focus:ring-lamp/40"
    >
      {code}
      {copied ? (
        <CheckIcon className="h-3.5 w-3.5 text-sage" />
      ) : (
        <CopyIcon className="h-3.5 w-3.5" />
      )}
      <span className="sr-only">{copied ? "Copied" : "Copy room code"}</span>
    </button>
  );
}