// BUILD 18 — Status chip (semantic tokens, light/dark safe)

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusVariant = "ok" | "warn" | "muted";

export function StatusChip({
  variant = "muted",
  children,
  className,
}: {
  variant?: StatusVariant;
  children: React.ReactNode;
  className?: string;
}) {
  // Avoid hardcoded colors. Use semantic tokens + subtle emphasis.
  const base = "text-[11px] font-medium";
  const tone =
    variant === "ok"
      ? "bg-secondary text-secondary-foreground"
      : variant === "warn"
        ? "bg-muted text-foreground"
        : "bg-muted/60 text-muted-foreground";

  return (
    <Badge variant="secondary" className={cn(base, tone, className)}>
      {children}
    </Badge>
  );
}
