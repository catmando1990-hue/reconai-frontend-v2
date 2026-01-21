"use client";

import { useMemo } from "react";
import { DollarSign } from "lucide-react";
import { MetricRail, type Metric } from "@/components/dashboard/MetricRail";

/**
 * CFO Snapshot Strip - Financial KPIs at a glance
 *
 * CANONICAL LAWS:
 * - Read-only: displays data, no mutations
 * - Manual-refresh: no polling/timers; user clicks to refresh
 * - Advisory-only: metrics are informational
 * - Fail-closed: empty/error states show fallback UI
 *
 * P1 FIX: Only displays metrics backed by real backend data.
 * Removed: Runway, Duplicates, Top Vendor (not implemented in backend).
 * Displaying undefined metrics as "--" is ambiguous and misleading.
 *
 * ACCESSIBILITY:
 * - aria-label on section
 * - aria-live="polite" for dynamic updates
 * - Semantic headings and values
 * - Color not sole indicator (icons + text)
 *
 * Now uses MetricRail for consistent dashboard styling.
 */

export interface CfoSnapshotData {
  cashIn?: number;
  cashOut?: number;
  // P1 REMOVED: runwayMonths - not implemented in backend
  // P1 REMOVED: duplicatesCount - requires real signal detection
  // P1 REMOVED: potentialSavings - requires real signal detection
  // P1 REMOVED: topVendor - not implemented in backend
  // P1 REMOVED: topVendorSpend - not implemented in backend
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

// P1 REMOVED: formatRunway - metric not backed by backend data

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

  /**
   * P1 FIX: Only show Cash Flow metric - the only metric with real backend data.
   * REMOVED metrics (were showing misleading "--"):
   * - Runway: Not implemented in backend
   * - Duplicates: Requires real signal detection (not mock data)
   * - Top Vendor: Not implemented in backend
   */
  const metrics: Metric[] = useMemo(() => {
    const cashFlowValue =
      netCashFlow !== undefined
        ? `${isPositiveCashFlow ? "+" : ""}${formatCurrency(netCashFlow)}`
        : undefined;

    const cashFlowHint =
      data.cashIn !== undefined && data.cashOut !== undefined ? (
        <span className="flex items-center gap-1">
          <span className="text-chart-1">{formatCurrency(data.cashIn)}</span>
          <span>in /</span>
          <span className="text-destructive">
            {formatCurrency(data.cashOut)}
          </span>
          <span>out</span>
        </span>
      ) : undefined;

    return [
      {
        id: "cash-flow",
        label: "Cash Flow",
        value: cashFlowValue,
        icon: DollarSign,
        trend:
          netCashFlow !== undefined
            ? isPositiveCashFlow
              ? "up"
              : "down"
            : undefined,
        variant:
          netCashFlow !== undefined
            ? isPositiveCashFlow
              ? "success"
              : "error"
            : "default",
        hint: cashFlowHint,
      },
      // P1 REMOVED: runway - not backed by backend data
      // P1 REMOVED: duplicates - requires real signal detection
      // P1 REMOVED: top-vendor - not backed by backend data
    ];
  }, [data.cashIn, data.cashOut, netCashFlow, isPositiveCashFlow]);

  return (
    <MetricRail
      metrics={metrics}
      loading={isLoading}
      onRefresh={onRefresh}
      lastUpdated={data.lastUpdated}
      ariaLabel="CFO financial snapshot"
      className="mb-6"
    />
  );
}
