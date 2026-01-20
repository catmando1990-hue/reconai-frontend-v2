"use client";

import { ReactNode, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricVariant = "default" | "success" | "warning" | "error";
type TrendDirection = "up" | "down" | "neutral";

interface Metric {
  /** Unique key */
  id: string;
  /** Label displayed above value */
  label: string;
  /** Primary value to display */
  value: string | number | null | undefined;
  /** Optional icon */
  icon?: LucideIcon;
  /** Trend indicator */
  trend?: TrendDirection;
  /** Variant for color theming */
  variant?: MetricVariant;
  /** Secondary hint text below value */
  hint?: ReactNode;
  /** Empty text when value is nullish */
  emptyText?: string;
}

interface MetricRailProps {
  /** Array of metrics to display */
  metrics: Metric[];
  /** Loading state */
  loading?: boolean;
  /** Optional refresh callback (adds refresh button) */
  onRefresh?: () => void;
  /** Last updated timestamp */
  lastUpdated?: string | null;
  /** Additional className */
  className?: string;
  /** Aria label for the section */
  ariaLabel?: string;
}

/**
 * MetricRail — Standardized horizontal KPI strip.
 * Enterprise density styling with consistent spacing and typography.
 *
 * Features:
 * - Consistent KPI display across all dashboard modes
 * - Loading skeleton states
 * - Trend indicators with accessible aria-labels
 * - Optional refresh callback for manual-refresh pattern
 * - Token-only colors, desktop-first
 *
 * CANONICAL LAWS:
 * - Read-only: displays data, no mutations
 * - Manual-refresh: no polling/timers
 * - Fail-closed: empty states show fallback UI
 */
export function MetricRail({
  metrics,
  loading = false,
  onRefresh,
  lastUpdated,
  className,
  ariaLabel = "Key metrics",
}: MetricRailProps) {
  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) return null;
    try {
      return new Date(lastUpdated).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  }, [lastUpdated]);

  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        "rounded-[var(--elevation-radius-lg)] border border-border/60",
        "bg-muted/20 backdrop-blur-sm shadow-sm",
        className,
      )}
    >
      <div
        className="flex flex-wrap items-stretch divide-x divide-border/40"
        aria-live="polite"
        aria-busy={loading}
      >
        {metrics.map((metric) => (
          <MetricCell key={metric.id} metric={metric} loading={loading} />
        ))}

        {/* Last Updated + Refresh (if provided) */}
        {(lastUpdated || onRefresh) && (
          <div className="flex-1 min-w-[120px] p-3 flex flex-col justify-center">
            {formattedLastUpdated && (
              <span className="text-[length:var(--dash-label-size)] text-muted-foreground">
                Updated {formattedLastUpdated}
              </span>
            )}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className={cn(
                  "mt-1 inline-flex items-center gap-1",
                  "text-[length:var(--dash-label-size)] text-primary",
                  "hover:text-primary/80 transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
                aria-label="Refresh metrics"
              >
                <svg
                  className={cn("h-3 w-3", loading && "animate-spin")}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

interface MetricCellProps {
  metric: Metric;
  loading: boolean;
}

function MetricCell({ metric, loading }: MetricCellProps) {
  const {
    label,
    value,
    icon: Icon,
    trend,
    variant = "default",
    hint,
    emptyText = "--",
  } = metric;

  const isEmpty = value === null || value === undefined || value === "";
  const displayValue = isEmpty ? emptyText : value;

  // Variant-based text color (uses theme tokens)
  const valueColorClass =
    variant === "success"
      ? "text-chart-1"
      : variant === "warning"
        ? "text-chart-4"
        : variant === "error"
          ? "text-destructive"
          : "text-foreground";

  return (
    <div className="flex-1 min-w-[120px] p-3">
      {/* Label row with optional icon */}
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && (
          <Icon
            className="h-4 w-4 text-muted-foreground flex-shrink-0"
            aria-hidden="true"
          />
        )}
        <span className="dash-stat-label truncate">{label}</span>
      </div>

      {/* Value */}
      {loading ? (
        <div className="h-5 w-16 bg-muted rounded animate-pulse" />
      ) : (
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "dash-stat-value",
              isEmpty ? "text-muted-foreground" : valueColorClass,
            )}
            data-empty={isEmpty ? "true" : undefined}
          >
            {displayValue}
          </span>
          {trend === "up" && !isEmpty && (
            <span className="text-chart-1" aria-label="Increasing">
              ↑
            </span>
          )}
          {trend === "down" && !isEmpty && (
            <span className="text-destructive" aria-label="Decreasing">
              ↓
            </span>
          )}
        </div>
      )}

      {/* Optional hint */}
      {hint && !loading && <div className="dash-stat-hint mt-0.5">{hint}</div>}
    </div>
  );
}

export type { Metric, MetricRailProps, MetricVariant, TrendDirection };
