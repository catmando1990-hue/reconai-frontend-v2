"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";
import { TrendingUp, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * TopDriversPanel - Horizontal bar chart showing top spend drivers
 *
 * CANONICAL LAWS:
 * - Token-only colors (uses CSS variables via chart tokens)
 * - Loading/error/empty states that don't break layout
 * - Manual refresh only (no polling)
 * - Desktop-first layout
 */

interface DriverData {
  name: string;
  value: number;
  count?: number;
}

interface TopDriversPanelProps {
  data: DriverData[] | null;
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

function formatValue(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DriverData }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-foreground">{data.name}</p>
      <p className="text-sm text-muted-foreground">
        {formatValue(data.value)}
        {data.count !== undefined && ` (${data.count} txns)`}
      </p>
    </div>
  );
}

export function TopDriversPanel({
  data,
  loading = false,
  error = null,
  title = "Top Drivers",
  subtitle = "Highest spend categories",
  onRefresh,
  className,
}: TopDriversPanelProps) {
  // Process data for chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    // Sort by value descending and take top 5
    return [...data]
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 5);
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

      {/* Chart Container */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="h-full flex flex-col justify-center gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-20 h-4 bg-muted rounded animate-pulse" />
                <div
                  className="h-6 bg-muted rounded animate-pulse"
                  style={{ width: `${90 - i * 15}%` }}
                />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
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
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                No Data Yet
              </p>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Connect accounts to see your top spend categories
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                width={80}
                tick={{
                  fill: "var(--muted-foreground)",
                  fontSize: 12,
                }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

export type { DriverData, TopDriversPanelProps };
