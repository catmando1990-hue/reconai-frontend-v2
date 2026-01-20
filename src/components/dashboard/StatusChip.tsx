/**
 * StatusChip — Semantic status indicator.
 * Token-only styling, light/dark safe.
 *
 * Variants:
 * - muted: Default/neutral state (most common)
 * - warn: Attention needed, not critical
 * - ok: Verified operational state (use sparingly)
 * - unknown: Indeterminate/not evaluated
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusVariant = "ok" | "warn" | "muted" | "unknown";

interface StatusChipProps {
  variant?: StatusVariant;
  children: React.ReactNode;
  className?: string;
}

export function StatusChip({
  variant = "muted",
  children,
  className,
}: StatusChipProps) {
  const base = "text-[11px] font-medium";

  // Token-only colors, no hardcoded values
  const tone =
    variant === "ok"
      ? "bg-secondary text-secondary-foreground"
      : variant === "warn"
        ? "bg-muted text-foreground"
        : variant === "unknown"
          ? "bg-muted/40 text-muted-foreground italic"
          : "bg-muted/60 text-muted-foreground"; // muted (default)

  return (
    <Badge variant="secondary" className={cn(base, tone, className)}>
      {children}
    </Badge>
  );
}
