"use client";

import type { ReactNode } from "react";

interface PrimaryPanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * PrimaryPanel — Single prominent work surface per page.
 * Takes ~60-70% of viewport on desktop (lg:col-span-8 in 12-col grid).
 * Enterprise density: tighter padding, compact header.
 * Exactly ONE PrimaryPanel per page — enforced by convention.
 */
export function PrimaryPanel({
  title,
  subtitle,
  children,
  actions,
  className,
}: PrimaryPanelProps) {
  return (
    <div
      className={["surface-panel rounded-lg", className ?? ""].join(" ").trim()}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border/50">
        <div className="min-w-0 flex-1">
          <h2 className="text-[length:var(--dash-panel-title-size)] font-semibold text-foreground truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[length:var(--dash-subtitle-size)] text-muted-foreground mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      {/* Content */}
      <div className="p-4">{children}</div>
    </div>
  );
}
