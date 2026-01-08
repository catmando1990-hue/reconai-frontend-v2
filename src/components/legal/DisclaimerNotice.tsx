// Phase 38 – Reusable disclaimer notice component
// Subtle, enterprise-safe, non-alarming presentation

import React from "react";
import { cn } from "@/lib/utils";

export function DisclaimerNotice({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3 text-xs text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
