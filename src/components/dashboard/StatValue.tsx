"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatValueProps {
  label: string;
  value: string | number | null | undefined;
  emptyText?: string;
  /** Treat 0, "$0", "$0.00" as empty (default: false) */
  emptyWhenZero?: boolean;
  /** Treat "" as empty (default: true) */
  emptyWhenBlankString?: boolean;
  hint?: ReactNode;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

/**
 * StatValue — Standardized KPI/stat display component.
 * Enterprise density: uses --dash-stat-* tokens for consistent sizing.
 *
 * Empty state logic:
 * - null/undefined: always treated as empty
 * - "" (blank string): empty by default, opt-out with emptyWhenBlankString={false}
 * - 0, "$0", "$0.00": NOT empty by default, opt-in with emptyWhenZero={true}
 *
 * Token-only styling, no hardcoded colors.
 */
export function StatValue({
  label,
  value,
  emptyText = "No data",
  emptyWhenZero = false,
  emptyWhenBlankString = true,
  hint,
  trend,
  variant = "default",
  className,
}: StatValueProps) {
  // Determine if value should be treated as empty
  const isNullish = value === null || value === undefined;
  const isBlankString = value === "" && emptyWhenBlankString;
  const isZeroValue =
    emptyWhenZero && (value === 0 || value === "$0" || value === "$0.00");

  const isEmpty = isNullish || isBlankString || isZeroValue;

  // Variant-based text color (uses theme tokens)
  const valueColorClass =
    variant === "success"
      ? "text-chart-1"
      : variant === "warning"
        ? "text-chart-4"
        : variant === "error"
          ? "text-destructive"
          : "";

  return (
    <div className={cn("dash-stat", className)}>
      <span className="dash-stat-label">{label}</span>
      <span
        className={cn("dash-stat-value", valueColorClass)}
        data-empty={isEmpty ? "true" : undefined}
      >
        {isEmpty ? emptyText : value}
        {trend === "up" && !isEmpty && (
          <span className="ml-1 text-chart-1" aria-label="Increasing">
            ↑
          </span>
        )}
        {trend === "down" && !isEmpty && (
          <span className="ml-1 text-destructive" aria-label="Decreasing">
            ↓
          </span>
        )}
      </span>
      {hint && <span className="dash-stat-hint">{hint}</span>}
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: string | number | null | undefined;
  emptyText?: string;
  /** Treat 0, "$0", "$0.00" as empty (default: false) */
  emptyWhenZero?: boolean;
  /** Treat "" as empty (default: true) */
  emptyWhenBlankString?: boolean;
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

/**
 * StatRow — Horizontal stat display (label left, value right).
 * Uses dash-stat-row class for consistent spacing.
 *
 * Same empty-state logic as StatValue.
 */
export function StatRow({
  label,
  value,
  emptyText = "—",
  emptyWhenZero = false,
  emptyWhenBlankString = true,
  variant = "default",
  className,
}: StatRowProps) {
  const isNullish = value === null || value === undefined;
  const isBlankString = value === "" && emptyWhenBlankString;
  const isZeroValue =
    emptyWhenZero && (value === 0 || value === "$0" || value === "$0.00");

  const isEmpty = isNullish || isBlankString || isZeroValue;

  // Variant-based text color (uses theme tokens)
  const valueColorClass =
    variant === "success"
      ? "text-chart-1"
      : variant === "warning"
        ? "text-chart-4"
        : variant === "error"
          ? "text-destructive"
          : "";

  return (
    <div className={cn("dash-stat-row", className)}>
      <span className="text-[length:var(--dash-body-size)] text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "text-[length:var(--dash-body-size)] font-medium tabular-nums",
          isEmpty ? "text-muted-foreground" : "text-foreground",
          !isEmpty && valueColorClass,
        )}
      >
        {isEmpty ? emptyText : value}
      </span>
    </div>
  );
}
