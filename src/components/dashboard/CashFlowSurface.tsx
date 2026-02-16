"use client";

import { useState, useMemo, useCallback } from "react";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/renderGuards";

/**
 * CashFlowSurface - Dominant financial visualization (70% width)
 *
 * CANONICAL LAWS:
 * - Token-only colors (no hardcoded hex/rgb)
 * - Time range toggle with local state only (no polling)
 * - Minimal chart chrome
 * - Responsive container sizing
 * - Desktop-first layout
 */

type TimeRange = "30" | "90" | "365";

interface CashFlowDataPoint {
  date: string;
  inflow: number;
  outflow: number;
  balance: number;
}

interface CashFlowSurfaceProps {
  data: CashFlowDataPoint[] | null;
  loading?: boolean;
  onRangeChange?: (range: TimeRange) => void;
  className?: string;
}

// Time range toggle button
function RangeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80",
      )}
    >
      {label}
    </button>
  );
}

// Simple bar chart visualization (CSS-based, no heavy chart lib)
function CashFlowChart({
  data,
  loading,
}: {
  data: CashFlowDataPoint[] | null;
  loading: boolean;
}) {
  // Sample data for display (show max 12 bars) - must be called before any returns
  const sampledData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (data.length <= 12) return data;
    const step = Math.ceil(data.length / 12);
    return data.filter((_, i) => i % step === 0).slice(0, 12);
  }, [data]);

  // Calculate max value for scaling
  const maxValue = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return Math.max(
      ...data.flatMap((d) => [Math.abs(d.inflow), Math.abs(d.outflow)]),
    );
  }, [data]);

  if (loading) {
    return (
      <div className="h-75 flex items-center justify-center">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-75 flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            No cash flow data available
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Connect accounts to see cash flow trends
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[300px] flex flex-col">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-chart-1" />
          <span className="text-xs text-muted-foreground">Inflow</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-chart-5" />
          <span className="text-xs text-muted-foreground">Outflow</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 flex items-end gap-1">
        {sampledData.map((point, i) => {
          const inflowHeight =
            maxValue > 0 ? (point.inflow / maxValue) * 100 : 0;
          const outflowHeight =
            maxValue > 0 ? (Math.abs(point.outflow) / maxValue) * 100 : 0;

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1"
              title={`${point.date}: Inflow ${formatCurrency(point.inflow)}, Outflow ${formatCurrency(Math.abs(point.outflow))}`}
            >
              <div className="flex-1 w-full flex flex-col justify-end gap-0.5">
                {/* Inflow bar */}
                <div
                  className="w-full rounded-t bg-chart-1 transition-all duration-300"
                  style={{
                    height: `${inflowHeight}%`,
                    minHeight: inflowHeight > 0 ? 2 : 0,
                  }}
                />
                {/* Outflow bar */}
                <div
                  className="w-full rounded-b bg-chart-5 transition-all duration-300"
                  style={{
                    height: `${outflowHeight}%`,
                    minHeight: outflowHeight > 0 ? 2 : 0,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground truncate max-w-full">
                {new Date(point.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CashFlowSurface({
  data,
  loading = false,
  onRangeChange,
  className,
}: CashFlowSurfaceProps) {
  const [range, setRange] = useState<TimeRange>("90");

  const handleRangeChange = useCallback(
    (newRange: TimeRange) => {
      setRange(newRange);
      onRangeChange?.(newRange);
    },
    [onRangeChange],
  );

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return { totalInflow: null, totalOutflow: null, netFlow: null };
    }

    const totalInflow = data.reduce((sum, d) => sum + d.inflow, 0);
    const totalOutflow = data.reduce((sum, d) => sum + Math.abs(d.outflow), 0);
    const netFlow = totalInflow - totalOutflow;

    return { totalInflow, totalOutflow, netFlow };
  }, [data]);

  return (
    <section
      aria-label="Cash Flow Trend"
      className={cn(
        "rounded-2xl border border-border bg-card",
        "shadow-sm p-6",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Cash Flow Trend
          </h2>
          <p className="text-sm text-muted-foreground">
            Money movement over time
          </p>
        </div>

        {/* Time range toggle */}
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
          <RangeButton
            label="30D"
            active={range === "30"}
            onClick={() => handleRangeChange("30")}
          />
          <RangeButton
            label="90D"
            active={range === "90"}
            onClick={() => handleRangeChange("90")}
          />
          <RangeButton
            label="1Y"
            active={range === "365"}
            onClick={() => handleRangeChange("365")}
          />
        </div>
      </div>

      {/* Summary stats */}
      {!loading && stats.totalInflow !== null && (
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 rounded-xl bg-muted/30">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-chart-1" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Total Inflow
              </span>
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-foreground">
              {formatCurrency(stats.totalInflow)}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-chart-5" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Total Outflow
              </span>
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-foreground">
              {formatCurrency(stats.totalOutflow)}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Net Flow
              </span>
            </div>
            <div
              className={cn(
                "text-xl font-semibold font-mono tabular-nums",
                stats.netFlow !== null && stats.netFlow >= 0
                  ? "text-chart-1"
                  : "text-destructive",
              )}
            >
              {stats.netFlow !== null
                ? `${stats.netFlow >= 0 ? "+" : ""}${formatCurrency(stats.netFlow)}`
                : "--"}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <CashFlowChart data={data} loading={loading} />
    </section>
  );
}

export type { CashFlowDataPoint, CashFlowSurfaceProps, TimeRange };
