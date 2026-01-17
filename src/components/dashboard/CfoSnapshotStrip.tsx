"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  AlertTriangle,
  Store,
  RefreshCw,
} from "lucide-react";

/**
 * CFO Snapshot Strip - Financial KPIs at a glance
 *
 * CANONICAL LAWS:
 * - Read-only: displays data, no mutations
 * - Manual-refresh: no polling/timers; user clicks to refresh
 * - Advisory-only: metrics are informational
 * - Fail-closed: empty/error states show fallback UI
 *
 * ACCESSIBILITY:
 * - aria-label on section
 * - aria-live="polite" for dynamic updates
 * - Semantic headings and values
 * - Color not sole indicator (icons + text)
 */

export interface CfoSnapshotData {
  cashIn?: number;
  cashOut?: number;
  runwayMonths?: number;
  duplicatesCount?: number;
  potentialSavings?: number;
  topVendor?: string;
  topVendorSpend?: number;
  lastUpdated?: string | null;
}

interface CfoSnapshotStripProps {
  data: CfoSnapshotData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRunway(months: number | undefined): string {
  if (months === undefined || months === null) return "--";
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remaining = months % 12;
    return remaining > 0 ? `${years}y ${remaining.toFixed(0)}m` : `${years}y+`;
  }
  return `${months.toFixed(1)}mo`;
}

export function CfoSnapshotStrip({
  data,
  isLoading = false,
  onRefresh,
}: CfoSnapshotStripProps) {
  const netCashFlow = useMemo(() => {
    if (data.cashIn === undefined || data.cashOut === undefined)
      return undefined;
    return data.cashIn - data.cashOut;
  }, [data.cashIn, data.cashOut]);

  const isPositiveCashFlow = netCashFlow !== undefined && netCashFlow >= 0;

  // Container sizing guard: min-h prevents layout shift
  return (
    <section
      aria-label="CFO financial snapshot"
      className="mb-6 rounded-xl border border-white/5 bg-card/70 backdrop-blur-sm"
      style={{ minHeight: "80px" }} // Container sizing guard
    >
      <div
        className="flex flex-wrap items-stretch gap-0 divide-x divide-white/5"
        aria-live="polite"
        aria-busy={isLoading}
      >
        {/* Cash In/Out */}
        <div className="flex-1 min-w-[140px] p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Cash Flow
            </span>
          </div>
          {isLoading ? (
            <div className="h-6 w-20 bg-card/20 rounded animate-pulse" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span
                className={`font-mono text-lg font-semibold ${
                  isPositiveCashFlow
                    ? "text-reconai-success"
                    : "text-reconai-error"
                }`}
              >
                {netCashFlow !== undefined
                  ? `${isPositiveCashFlow ? "+" : ""}${formatCurrency(netCashFlow)}`
                  : "--"}
              </span>
              {netCashFlow !== undefined &&
                (isPositiveCashFlow ? (
                  <TrendingUp
                    className="h-4 w-4 text-reconai-success"
                    aria-label="Positive trend"
                  />
                ) : (
                  <TrendingDown
                    className="h-4 w-4 text-reconai-error"
                    aria-label="Negative trend"
                  />
                ))}
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            {isLoading ? (
              <div className="h-3 w-24 bg-card/10 rounded animate-pulse" />
            ) : (
              <>
                <span className="text-reconai-success">
                  {formatCurrency(data.cashIn)}
                </span>
                {" in / "}
                <span className="text-reconai-error">
                  {formatCurrency(data.cashOut)}
                </span>
                {" out"}
              </>
            )}
          </div>
        </div>

        {/* Runway */}
        <div className="flex-1 min-w-[120px] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Runway
            </span>
          </div>
          {isLoading ? (
            <div className="h-6 w-16 bg-card/20 rounded animate-pulse" />
          ) : (
            <span
              className={`font-mono text-lg font-semibold ${
                data.runwayMonths !== undefined && data.runwayMonths < 6
                  ? "text-reconai-warning"
                  : "text-foreground"
              }`}
            >
              {formatRunway(data.runwayMonths)}
            </span>
          )}
        </div>

        {/* Duplicates */}
        <div className="flex-1 min-w-[140px] p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Duplicates
            </span>
          </div>
          {isLoading ? (
            <div className="h-6 w-12 bg-card/20 rounded animate-pulse" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span
                className={`font-mono text-lg font-semibold ${
                  data.duplicatesCount && data.duplicatesCount > 0
                    ? "text-reconai-warning"
                    : "text-foreground"
                }`}
              >
                {data.duplicatesCount ?? 0}
              </span>
              {data.potentialSavings && data.potentialSavings > 0 && (
                <span className="text-xs text-reconai-warning">
                  ({formatCurrency(data.potentialSavings)} recoverable)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Top Vendor */}
        <div className="flex-1 min-w-[140px] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Store className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Top Vendor
            </span>
          </div>
          {isLoading ? (
            <div className="h-6 w-24 bg-card/20 rounded animate-pulse" />
          ) : (
            <>
              <span className="font-medium text-foreground truncate block">
                {data.topVendor || "--"}
              </span>
              {data.topVendorSpend !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(data.topVendorSpend)}
                </span>
              )}
            </>
          )}
        </div>

        {/* Last Updated + Refresh */}
        <div className="flex-1 min-w-[140px] p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Updated
            </span>
          </div>
          {isLoading ? (
            <div className="h-6 w-20 bg-card/20 rounded animate-pulse" />
          ) : (
            <span className="text-sm text-muted-foreground">
              {data.lastUpdated
                ? new Date(data.lastUpdated).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "Just now"}
            </span>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
              aria-label="Refresh dashboard data"
            >
              <RefreshCw
                className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
