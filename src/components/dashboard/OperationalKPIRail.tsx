"use client";

import { useMemo } from "react";
import {
  ArrowRightLeft,
  CheckCircle,
  AlertTriangle,
  Download,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * OperationalKPIRail - 6 operational KPI tiles for dashboard bottom row
 *
 * CANONICAL LAWS:
 * - Token-only colors (no hardcoded hex/rgb)
 * - Tabular numbers for metrics
 * - Loading skeleton states
 * - Empty states with explanation
 * - Desktop-first (6 columns on wide, 3 on medium, 2 on smaller)
 */

interface OperationalKPIs {
  transactions30d: number | null;
  reconciledPercent: number | null;
  flaggedCount: number | null;
  duplicatesCount: number | null;
  exportsReady: number | null;
  signalsCount: number | null; // >=0.85 confidence only
}

interface OperationalKPIRailProps {
  data: OperationalKPIs | null;
  loading?: boolean;
  className?: string;
}

// KPI tile component
interface KPITileProps {
  label: string;
  value: string | number | null;
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error";
  hint?: string;
  loading?: boolean;
  emptyText?: string;
  emptyHint?: string;
}

function KPITile({
  label,
  value,
  icon,
  variant = "default",
  hint,
  loading,
  emptyText = "--",
  emptyHint,
}: KPITileProps) {
  const isEmpty = value === null || value === undefined;
  const displayValue = isEmpty ? emptyText : value;

  const valueColorClass =
    variant === "success"
      ? "text-chart-1"
      : variant === "warning"
        ? "text-chart-4"
        : variant === "error"
          ? "text-destructive"
          : "text-foreground";

  return (
    <div className="p-4 md:p-5">
      {/* Icon + Label */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>

      {/* Value */}
      {loading ? (
        <div className="h-8 w-16 bg-muted rounded animate-pulse" />
      ) : (
        <div
          className={cn(
            "text-2xl font-semibold font-mono tabular-nums",
            isEmpty ? "text-muted-foreground" : valueColorClass,
          )}
        >
          {displayValue}
        </div>
      )}

      {/* Hint */}
      {!loading && (
        <div className="mt-1 text-xs text-muted-foreground">
          {isEmpty && emptyHint ? emptyHint : hint || "\u00A0"}
        </div>
      )}
    </div>
  );
}

export function OperationalKPIRail({
  data,
  loading = false,
  className,
}: OperationalKPIRailProps) {
  // Format values for display
  const formattedValues = useMemo(() => {
    if (!data) {
      return {
        transactions: null,
        reconciled: null,
        flagged: null,
        duplicates: null,
        exports: null,
        signals: null,
      };
    }

    return {
      transactions:
        data.transactions30d !== null
          ? data.transactions30d.toLocaleString()
          : null,
      reconciled:
        data.reconciledPercent !== null
          ? `${Math.round(data.reconciledPercent)}%`
          : null,
      flagged: data.flaggedCount !== null ? data.flaggedCount : null,
      duplicates: data.duplicatesCount !== null ? data.duplicatesCount : null,
      exports: data.exportsReady !== null ? data.exportsReady : null,
      signals: data.signalsCount !== null ? data.signalsCount : null,
    };
  }, [data]);

  // Determine variants based on data
  const variants = useMemo(() => {
    if (!data) {
      return {
        reconciled: "default" as const,
        flagged: "default" as const,
        duplicates: "default" as const,
        signals: "default" as const,
      };
    }

    return {
      reconciled:
        data.reconciledPercent !== null && data.reconciledPercent >= 95
          ? ("success" as const)
          : data.reconciledPercent !== null && data.reconciledPercent < 80
            ? ("warning" as const)
            : ("default" as const),
      flagged:
        data.flaggedCount !== null && data.flaggedCount > 0
          ? ("warning" as const)
          : ("default" as const),
      duplicates:
        data.duplicatesCount !== null && data.duplicatesCount > 0
          ? ("warning" as const)
          : ("success" as const),
      signals:
        data.signalsCount !== null && data.signalsCount > 0
          ? ("success" as const)
          : ("default" as const),
    };
  }, [data]);

  return (
    <section
      aria-label="Operational KPIs"
      className={cn("rounded-2xl border border-border bg-card", className)}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 divide-x divide-y md:divide-y-0 divide-border">
        {/* Transactions (30d) */}
        <KPITile
          label="Transactions"
          value={formattedValues.transactions}
          icon={<ArrowRightLeft className="h-4 w-4" />}
          loading={loading}
          hint="Last 30 days"
          emptyHint="Connect accounts"
        />

        {/* Reconciled % */}
        <KPITile
          label="Reconciled"
          value={formattedValues.reconciled}
          icon={<CheckCircle className="h-4 w-4" />}
          variant={variants.reconciled}
          loading={loading}
          hint="Matched transactions"
          emptyHint="No data yet"
        />

        {/* Flagged */}
        <KPITile
          label="Flagged"
          value={formattedValues.flagged}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={variants.flagged}
          loading={loading}
          hint="Needs review"
          emptyHint="No flags"
        />

        {/* Duplicates */}
        <KPITile
          label="Duplicates"
          value={formattedValues.duplicates}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={variants.duplicates}
          loading={loading}
          hint="Potential duplicates"
          emptyHint="None detected"
        />

        {/* Exports Ready */}
        <KPITile
          label="Exports"
          value={formattedValues.exports}
          icon={<Download className="h-4 w-4" />}
          loading={loading}
          hint="Ready to download"
          emptyHint="No exports"
        />

        {/* AI Signals */}
        <KPITile
          label="AI Signals"
          value={formattedValues.signals}
          icon={<Sparkles className="h-4 w-4" />}
          variant={variants.signals}
          loading={loading}
          hint="High confidence (≥85%)"
          emptyHint="Run analysis"
        />
      </div>
    </section>
  );
}

export type { OperationalKPIs, OperationalKPIRailProps };
