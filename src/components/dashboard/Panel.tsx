"use client";

import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  right?: ReactNode;
}

/**
 * Panel — Generic dashboard panel component.
 * Uses surface-panel elevation (same as PrimaryPanel).
 * Enterprise density: compact padding using --dash-* tokens.
 * Consistent header layout: title left, actions right.
 */
export function Panel({ title, children, className, right }: PanelProps) {
  return (
    <div
      className={["surface-panel rounded-lg", className ?? ""].join(" ").trim()}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/50">
        <h3 className="text-[length:var(--dash-panel-title-size)] font-semibold text-foreground truncate">
          {title}
        </h3>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {/* Content */}
      <div className="p-4">{children}</div>
    </div>
  );
}
