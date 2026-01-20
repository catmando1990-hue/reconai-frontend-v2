"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatValueProps {
  label: string;
  value: string | number | null | undefined;
  emptyText?: string;
  hint?: ReactNode;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

/**
 * StatValue — Standardized KPI/stat display component.
 * Enterprise density: uses --dash-stat-* tokens for consistent sizing.
 * Handles empty states: shows emptyText when value is null/undefined/0/$0.
 * Token-only styling, no hardcoded colors.
 */
export function StatValue({
  label,
  value,
  emptyText = "No data",
  hint,
  trend,
  variant = "default",
  className,
}: StatValueProps) {
  // Determine if value should be treated as empty
  const isEmpty =
    value === null ||
    value === undefined ||
    value === "" ||
    value === 0 ||
    value === "$0" ||
    value === "$0.00";

  // Variant-based text color
  const valueColorClass =
    variant === "success"
      ? "text-reconai-success"
      : variant === "warning"
        ? "text-reconai-warning"
        : variant === "error"
          ? "text-reconai-error"
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
          <span className="ml-1 text-reconai-success" aria-label="Increasing">
            ↑
          </span>
        )}
        {trend === "down" && !isEmpty && (
          <span className="ml-1 text-reconai-error" aria-label="Decreasing">
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
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

/**
 * StatRow — Horizontal stat display (label left, value right).
 * Uses dash-stat-row class for consistent spacing.
 */
export function StatRow({
  label,
  value,
  emptyText = "—",
  variant = "default",
  className,
}: StatRowProps) {
  const isEmpty =
    value === null ||
    value === undefined ||
    value === "" ||
    value === 0 ||
    value === "$0" ||
    value === "$0.00";

  const valueColorClass =
    variant === "success"
      ? "text-reconai-success"
      : variant === "warning"
        ? "text-reconai-warning"
        : variant === "error"
          ? "text-reconai-error"
          : "";

  return (
    <div className={cn("dash-stat-row", className)}>
      <span className="text-[length:var(--dash-body-size)] text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "text-[length:var(--dash-body-size)] font-medium font-variant-numeric-tabular-nums",
          isEmpty ? "text-muted-foreground" : "text-foreground",
          !isEmpty && valueColorClass,
        )}
      >
        {isEmpty ? emptyText : value}
      </span>
    </div>
  );
}
