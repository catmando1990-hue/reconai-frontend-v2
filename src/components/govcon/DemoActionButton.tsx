"use client";

import { useState } from "react";

type Props = {
  label: string;
  className?: string;
  children?: React.ReactNode;
};

/**
 * DemoActionButton
 * A click-safe placeholder action: never a dead button.
 * Shows an intentional message explaining demo/preview mode.
 */
export default function DemoActionButton({
  label,
  className,
  children,
}: Props) {
  const [msg, setMsg] = useState<string | null>(null);

  function handleClick() {
    setMsg(
      "Demo mode: this action is not enabled yet. No actions are taken automatically.",
    );
    window.setTimeout(() => setMsg(null), 3000);
  }

  return (
    <div className="relative">
      <button type="button" onClick={handleClick} className={className}>
        {children ?? label}
      </button>
      {/* BACKGROUND NORMALIZATION: GovCon uses bg-card (no bg-background) */}
      {msg && (
        <div className="absolute top-full left-0 mt-1 text-xs text-muted-foreground bg-card border border-border rounded px-2 py-1 whitespace-nowrap z-10">
          {msg}
        </div>
      )}
    </div>
  );
}
