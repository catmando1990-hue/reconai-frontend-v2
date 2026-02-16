"use client";

import { useMemo } from "react";
import { MapPin, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * GeographyPanel - Geographic distribution visualization
 *
 * Shows transaction distribution by state/region with visual heat bars.
 * Lightweight alternative to heavy map libraries.
 *
 * CANONICAL LAWS:
 * - Token-only colors (uses CSS variables via chart tokens)
 * - Loading/error/empty states that don't break layout
 * - Manual refresh only (no polling)
 * - No heavy map dependencies
 * - Desktop-first layout
 */

interface GeoData {
  region: string;
  code: string;
  value: number;
  count?: number;
}

interface GeographyPanelProps {
  data: GeoData[] | null;
  loading?: boolean;
  error?: string | null;
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  className?: string;
}

// Heat color gradient from cool to warm (using chart tokens)
function getHeatColor(ratio: number): string {
  if (ratio >= 0.8) return "var(--chart-5)"; // Hot
  if (ratio >= 0.6) return "var(--chart-4)"; // Warm
  if (ratio >= 0.4) return "var(--chart-3)"; // Medium
  if (ratio >= 0.2) return "var(--chart-2)"; // Cool
  return "var(--chart-1)"; // Cold
}

function formatValue(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function GeographyPanel({
  data,
  loading = false,
  error = null,
  title = "Geography",
  subtitle = "Transaction distribution by region",
  onRefresh,
  className,
}: GeographyPanelProps) {
  // Process data for visualization
  const { sortedData, maxValue } = useMemo(() => {
    if (!data || data.length === 0) {
      return { sortedData: [], maxValue: 0 };
    }
    const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 8);
    const max = Math.max(...sorted.map((d) => d.value));
    return { sortedData: sorted, maxValue: max };
  }, [data]);

  const hasData = sortedData.length > 0;

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

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-4 bg-muted rounded animate-pulse" />
                <div className="flex-1 h-6 bg-muted rounded animate-pulse" />
                <div className="w-16 h-4 bg-muted rounded animate-pulse" />
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
              <MapPin className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                Geographic distribution not enabled
              </p>
              <p className="text-xs text-muted-foreground max-w-55">
                Enable location enrichment in ingestion settings to populate
                this panel with regional data.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedData.map((item) => {
              const ratio = maxValue > 0 ? item.value / maxValue : 0;
              const barWidth = Math.max(ratio * 100, 5);

              return (
                <div key={item.code} className="flex items-center gap-3 group">
                  {/* Region code */}
                  <div className="w-8 flex-shrink-0">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {item.code}
                    </span>
                  </div>

                  {/* Heat bar */}
                  <div className="flex-1 h-6 bg-muted/30 rounded relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded transition-all duration-300"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: getHeatColor(ratio),
                      }}
                    />
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-xs font-medium text-foreground truncate">
                        {item.region}
                      </span>
                    </div>
                  </div>

                  {/* Value */}
                  <div className="w-20 flex-shrink-0 text-right">
                    <span className="text-sm font-medium text-foreground tabular-nums">
                      {formatValue(item.value)}
                    </span>
                    {item.count !== undefined && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({item.count})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer legend */}
      {hasData && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-4">
            <span className="text-xs text-muted-foreground">Volume:</span>
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: "var(--chart-1)" }}
              />
              <span className="text-xs text-muted-foreground">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: "var(--chart-3)" }}
              />
              <span className="text-xs text-muted-foreground">Med</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: "var(--chart-5)" }}
              />
              <span className="text-xs text-muted-foreground">High</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export type { GeoData, GeographyPanelProps };
