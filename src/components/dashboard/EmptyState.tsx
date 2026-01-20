"use client";

import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

/**
 * EmptyState — Graceful empty state display.
 * Replaces all mock/placeholder data throughout dashboard.
 * Enterprise density: compact vertical padding.
 * Token-only styling, no hardcoded colors.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div
        className={[
          "mb-3 flex h-10 w-10 items-center justify-center",
          "rounded-[var(--elevation-radius)]",
          "border border-border/60 bg-muted/30 backdrop-blur-sm",
          "shadow-sm",
        ].join(" ")}
      >
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="text-[length:var(--dash-body-size)] font-medium text-foreground">
        {title}
      </h3>
      <p className="mt-1 max-w-xs text-[length:var(--dash-subtitle-size)] text-muted-foreground">
        {description}
      </p>
      {action && (
        <div className="mt-3">
          {action.href ? (
            <Button asChild variant="secondary" size="sm">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : action.onClick ? (
            <Button variant="secondary" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
