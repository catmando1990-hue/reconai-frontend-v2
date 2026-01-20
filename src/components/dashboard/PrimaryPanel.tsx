"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
 * Uses surface-panel with elevated treatment.
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
    <Card
      className={["surface-panel", "shadow-md", className ?? ""]
        .join(" ")
        .trim()}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold tracking-tight">
            {title}
          </CardTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
