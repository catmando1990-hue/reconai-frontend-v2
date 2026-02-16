"use client";

import { useMemo } from "react";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  Sparkles,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/renderGuards";

/**
 * Executive KPI Rail - 4-5 KPI tiles for executive overview
 *
 * CANONICAL LAWS:
 * - Token-only colors (no hardcoded hex/rgb)
 * - Tabular numbers for financial data
 * - Loading skeleton states
 * - Empty states with explanation
 * - Desktop-first (never mobile-like on desktop)
 */

interface KPIData {
  netCashPosition: number | null;
  runway90Days: number | null;
  riskIndex: number | null;
  aiConfidence: number | null;
  complianceStatus: "compliant" | "warning" | "non-compliant" | null;
  dcaaReady?: boolean; // GovCon tier-aware
}

interface ExecutiveKPIRailProps {
  data: KPIData | null;
  loading?: boolean;
  hasGovCon?: boolean;
  className?: string;
}

// KPI tile component
interface KPITileProps {
  label: string;
  value: string | null;
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error";
  hint?: string;
  loading?: boolean;
  emptyText?: string;
}

function KPITile({
  label,
  value,
  icon,
  variant = "default",
  hint,
  loading,
  emptyText = "No data",
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
    <div className="flex-1 min-w-[140px] p-4 md:p-6">
      {/* Label row */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>

      {/* Value */}
      {loading ? (
        <div className="h-10 w-24 bg-muted rounded animate-pulse" />
      ) : (
        <div
          className={cn(
            "text-3xl md:text-4xl font-semibold font-mono tabular-nums",
            isEmpty ? "text-muted-foreground" : valueColorClass,
          )}
        >
          {displayValue}
        </div>
      )}

      {/* Hint */}
      {hint && !loading && (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}

export function ExecutiveKPIRail({
  data,
  loading = false,
  hasGovCon = false,
  className,
}: ExecutiveKPIRailProps) {
  // Format values for display
  const formattedValues = useMemo(() => {
    if (!data) {
      return {
        netCash: null,
        runway: null,
        risk: null,
        confidence: null,
        compliance: null,
      };
    }

    return {
      netCash:
        data.netCashPosition !== null
          ? formatCurrency(data.netCashPosition)
          : null,
      runway: data.runway90Days !== null ? `${data.runway90Days} days` : null,
      risk: data.riskIndex !== null ? `${data.riskIndex}` : null,
      confidence:
        data.aiConfidence !== null
          ? `${Math.round(data.aiConfidence * 100)}%`
          : null,
      compliance:
        data.complianceStatus !== null
          ? data.complianceStatus === "compliant"
            ? "Compliant"
            : data.complianceStatus === "warning"
              ? "Review"
              : "Action Required"
          : null,
    };
  }, [data]);

  // Determine variants based on data
  const variants = useMemo(() => {
    if (!data) {
      return {
        netCash: "default" as const,
        runway: "default" as const,
        risk: "default" as const,
        confidence: "default" as const,
        compliance: "default" as const,
      };
    }

    return {
      netCash:
        data.netCashPosition !== null && data.netCashPosition > 0
          ? ("success" as const)
          : data.netCashPosition !== null && data.netCashPosition < 0
            ? ("error" as const)
            : ("default" as const),
      runway:
        data.runway90Days !== null && data.runway90Days > 90
          ? ("success" as const)
          : data.runway90Days !== null && data.runway90Days < 30
            ? ("error" as const)
            : data.runway90Days !== null && data.runway90Days < 60
              ? ("warning" as const)
              : ("default" as const),
      risk:
        data.riskIndex !== null && data.riskIndex < 30
          ? ("success" as const)
          : data.riskIndex !== null && data.riskIndex > 70
            ? ("error" as const)
            : data.riskIndex !== null && data.riskIndex > 50
              ? ("warning" as const)
              : ("default" as const),
      confidence:
        data.aiConfidence !== null && data.aiConfidence >= 0.85
          ? ("success" as const)
          : data.aiConfidence !== null && data.aiConfidence < 0.5
            ? ("warning" as const)
            : ("default" as const),
      compliance:
        data.complianceStatus === "compliant"
          ? ("success" as const)
          : data.complianceStatus === "warning"
            ? ("warning" as const)
            : data.complianceStatus === "non-compliant"
              ? ("error" as const)
              : ("default" as const),
    };
  }, [data]);

  return (
    <section
      aria-label="Executive KPIs"
      className={cn(
        "rounded-2xl border border-border bg-card",
        "shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-stretch divide-x divide-border">
        {/* Net Cash Position */}
        <KPITile
          label="Net Cash"
          value={formattedValues.netCash}
          icon={<DollarSign className="h-4 w-4" />}
          variant={variants.netCash}
          loading={loading}
          emptyText="--"
        />

        {/* 90-Day Runway */}
        <KPITile
          label="90-Day Runway"
          value={formattedValues.runway}
          icon={<Clock className="h-4 w-4" />}
          variant={variants.runway}
          loading={loading}
          emptyText="--"
          hint={
            data !== null &&
            data.runway90Days !== null &&
            data.runway90Days < 60
              ? "Review cash position"
              : undefined
          }
        />

        {/* Risk Index */}
        <KPITile
          label="Risk Index"
          value={formattedValues.risk}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={variants.risk}
          loading={loading}
          emptyText="--"
          hint="0-100 scale"
        />

        {/* AI Confidence */}
        <KPITile
          label="AI Confidence"
          value={formattedValues.confidence}
          icon={<Sparkles className="h-4 w-4" />}
          variant={variants.confidence}
          loading={loading}
          emptyText="--"
          hint={
            data !== null &&
            data.aiConfidence !== null &&
            data.aiConfidence >= 0.85
              ? "High confidence"
              : undefined
          }
        />

        {/* Compliance Status - GovCon tier shows DCAA readiness */}
        <KPITile
          label={hasGovCon ? "DCAA Ready" : "Compliance"}
          value={
            hasGovCon && data?.dcaaReady !== undefined
              ? data.dcaaReady
                ? "Ready"
                : "Not Ready"
              : formattedValues.compliance
          }
          icon={<Shield className="h-4 w-4" />}
          variant={
            hasGovCon && data?.dcaaReady !== undefined
              ? data.dcaaReady
                ? "success"
                : "warning"
              : variants.compliance
          }
          loading={loading}
          emptyText="--"
        />
      </div>
    </section>
  );
}

export type { KPIData, ExecutiveKPIRailProps };
