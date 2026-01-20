"use client";

import { useMemo } from "react";
import { DollarSign, Clock, AlertTriangle, Store } from "lucide-react";
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

  // Build metrics array for MetricRail
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

    const duplicatesHint =
      data.potentialSavings && data.potentialSavings > 0 ? (
        <span className="text-chart-4">
          ({formatCurrency(data.potentialSavings)} recoverable)
        </span>
      ) : undefined;

    const topVendorHint =
      data.topVendorSpend !== undefined
        ? formatCurrency(data.topVendorSpend)
        : undefined;

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
      {
        id: "runway",
        label: "Runway",
        value: formatRunway(data.runwayMonths),
        icon: Clock,
        variant:
          data.runwayMonths !== undefined && data.runwayMonths < 6
            ? "warning"
            : "default",
      },
      {
        id: "duplicates",
        label: "Duplicates",
        value: data.duplicatesCount ?? 0,
        icon: AlertTriangle,
        variant:
          data.duplicatesCount && data.duplicatesCount > 0
            ? "warning"
            : "default",
        hint: duplicatesHint,
      },
      {
        id: "top-vendor",
        label: "Top Vendor",
        value: data.topVendor || "--",
        icon: Store,
        hint: topVendorHint,
      },
    ];
  }, [data, netCashFlow, isPositiveCashFlow]);

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
