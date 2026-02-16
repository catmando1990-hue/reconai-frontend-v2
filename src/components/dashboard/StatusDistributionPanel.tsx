"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * StatusDistributionPanel - Donut chart showing distribution breakdown
 *
 * CANONICAL LAWS:
 * - Token-only colors (uses CSS variables via chart tokens)
 * - Loading/error/empty states that don't break layout
 * - Manual refresh only (no polling)
 * - Desktop-first layout
 */

interface StatusData {
  name: string;
  value: number;
  color?: string;
  [key: string]: string | number | undefined;
}

interface StatusDistributionPanelProps {
  data: StatusData[] | null;
  loading?: boolean;
  error?: string | null;
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  className?: string;
}

// Chart color tokens - using CSS variables for theme support
const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function formatPercent(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

// Custom tooltip component - Stripe-like styling
function CustomTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: Array<{ payload: StatusData }>;
  total: number;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">{data.name}</span>
        <span className="text-sm font-medium text-foreground tabular-nums">
          {formatPercent(data.value, total)}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {data.value.toLocaleString()} items
      </p>
    </div>
  );
}

export function StatusDistributionPanel({
  data,
  loading = false,
  error = null,
  title = "Status Distribution",
  subtitle = "Transaction categorization",
  onRefresh,
  className,
}: StatusDistributionPanelProps) {
  // Process data for chart
  const { chartData, total } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], total: 0 };
    }
    const filtered = data.filter((d) => d.value > 0);
    const sum = filtered.reduce((acc, d) => acc + d.value, 0);
    return { chartData: filtered, total: sum };
  }, [data]);

  const hasData = chartData.length > 0;

  return (
    <section
      aria-label={title}
      className={cn(
        "rounded-2xl border border-border bg-card",
        "p-6 flex flex-col h-full min-h-[360px]",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {onRefresh && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 px-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        )}
      </div>

      {/* Chart Container - explicit min-height prevents ResponsiveContainer -1 warnings */}
      <div className="flex-1 min-h-70 flex items-center">
        {loading ? (
          <div className="w-full flex items-center justify-center">
            <div className="w-40 h-40 rounded-full border-8 border-muted animate-pulse" />
          </div>
        ) : error ? (
          <div className="w-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-destructive">{error}</p>
              {onRefresh && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRefresh}
                  className="mt-2"
                >
                  Retry
                </Button>
              )}
            </div>
          </div>
        ) : !hasData ? (
          <div className="w-full flex items-center justify-center">
            <div className="text-center">
              <PieIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                No Data Yet
              </p>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Transaction status distribution will appear here
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center gap-4">
            {/* Donut Chart with Center Label */}
            <div className="flex-1 min-w-0 h-50 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    stroke="var(--background)"
                    strokeWidth={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.color ||
                          CHART_COLORS[index % CHART_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip total={total} />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-foreground tabular-nums">
                    {total.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-2 min-w-[120px]">
              {chartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{
                      backgroundColor:
                        entry.color ||
                        CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">
                      {entry.name}
                    </p>
                    <p className="text-sm font-medium text-foreground tabular-nums">
                      {formatPercent(entry.value, total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export type { StatusData, StatusDistributionPanelProps };
