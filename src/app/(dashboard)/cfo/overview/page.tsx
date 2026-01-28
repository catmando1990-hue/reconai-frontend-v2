"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { TierGate } from "@/components/legal/TierGate";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import PolicyBanner from "@/components/policy/PolicyBanner";
import { OverviewSnapshot } from "@/components/overview/OverviewSnapshot";
import { Download, Info, RefreshCw } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { auditedFetch } from "@/lib/auditedFetch";

/**
 * CFO Overview Page
 *
 * Design: Self-contained dual-mode (light/dark) hex colors.
 */

type CfoMetrics = {
  total_revenue: number;
  total_expenses: number;
  net_position: number;
  transaction_count: number;
  period: string;
};

type CfoOverviewResponse = {
  cfo_version: string;
  lifecycle: "success" | "pending" | "failed" | "stale";
  reason_code: string | null;
  reason_message: string | null;
  metrics: CfoMetrics | null;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function MetricWithReason({
  label,
  value,
  lifecycle,
  reasonCode,
  isPositive,
}: {
  label: string;
  value: string | number | null;
  lifecycle: string | null;
  reasonCode: string | null;
  isPositive?: boolean;
}) {
  if (value !== null && lifecycle === "success") {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">{label}</span>
        <span
          className={`text-lg font-medium ${
            isPositive === true
              ? "text-[#059669] dark:text-[#10b981]"
              : isPositive === false
                ? "text-[#dc2626] dark:text-[#ef4444]"
                : "text-[#111827] dark:text-[#f9fafb]"
          }`}
        >
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">{label}</span>
      <div className="flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
        <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
          {lifecycle === "pending"
            ? "Computing…"
            : lifecycle === "stale"
              ? "Stale"
              : reasonCode === "insufficient_data"
                ? "Insufficient data"
                : reasonCode === "not_configured"
                  ? "Not configured"
                  : "Awaiting data"}
        </span>
      </div>
    </div>
  );
}

function CfoOverviewBody() {
  const { apiFetch } = useApi();
  const { isLoaded } = useOrg();

  const [data, setData] = useState<CfoOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFetch<CfoOverviewResponse>("/api/cfo/overview");
      setData(result);
    } catch {
      setData({
        cfo_version: "1",
        lifecycle: "failed",
        reason_code: "computation_error",
        reason_message: "Failed to load metrics",
        metrics: null,
      });
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!isLoaded) return;
    fetchMetrics();
  }, [isLoaded, fetchMetrics]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await auditedFetch<Response>("/api/cfo/export", {
        method: "POST",
        rawResponse: true,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cfo-overview-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const lifecycle = data?.lifecycle || null;
  const reasonCode = data?.reason_code || null;
  const metrics = data?.metrics;

  return (
    <RouteShell
      title="CFO Overview"
      subtitle="Executive surfaces across financial posture and risk"
      right={
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || !metrics}
          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium bg-[#f3f4f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f9fafb] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] disabled:opacity-50 transition-colors"
        >
          {exporting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export Report
        </button>
      }
    >
      <PolicyBanner
        policy="accounting"
        message="Financial reports and metrics are for informational purposes. Consult a licensed accountant for official financial statements and compliance requirements."
        context="cfo-overview"
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Primary Panel - Overview Snapshot */}
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Financial Overview"
            subtitle="Aggregate financial posture and key metrics"
          >
            <OverviewSnapshot />
          </PrimaryPanel>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Key Metrics">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-5 w-5 animate-spin text-[#6b7280] dark:text-[#a1a1aa]" />
              </div>
            ) : (
              <div className="space-y-4">
                <MetricWithReason
                  label="Total Revenue"
                  value={metrics ? formatCurrency(metrics.total_revenue) : null}
                  lifecycle={lifecycle}
                  reasonCode={reasonCode}
                  isPositive={true}
                />
                <MetricWithReason
                  label="Total Expenses"
                  value={
                    metrics ? formatCurrency(metrics.total_expenses) : null
                  }
                  lifecycle={lifecycle}
                  reasonCode={reasonCode}
                  isPositive={false}
                />
                <MetricWithReason
                  label="Net Position"
                  value={metrics ? formatCurrency(metrics.net_position) : null}
                  lifecycle={lifecycle}
                  reasonCode={reasonCode}
                  isPositive={metrics ? metrics.net_position >= 0 : undefined}
                />
                {/* Period context */}
                {metrics?.period && (
                  <div className="pt-2 border-t border-[#e5e7eb] dark:border-[#27272a]">
                    <p className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">
                      Period: {metrics.period}
                    </p>
                    <p className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">
                      {metrics.transaction_count} transactions analyzed
                    </p>
                  </div>
                )}
                {/* Lifecycle context */}
                <div className={metrics?.period ? "" : "pt-2 border-t border-[#e5e7eb] dark:border-[#27272a]"}>
                  <p className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">
                    {lifecycle === "success"
                      ? "Metrics from connected financial sources"
                      : lifecycle === "pending"
                        ? "Computing metrics from financial data…"
                        : lifecycle === "stale"
                          ? "Data is stale - refresh recommended"
                          : "Connect financial sources to populate metrics"}
                  </p>
                </div>
              </div>
            )}
          </SecondaryPanel>

          <SecondaryPanel title="Report Purpose">
            <div className="space-y-3 text-sm text-[#6b7280] dark:text-[#a1a1aa]">
              <p>
                The CFO Overview aggregates financial data across all connected
                sources to provide a unified executive view.
              </p>
              <p>
                Use this report for board presentations, investor updates, and
                strategic planning sessions.
              </p>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Quick Links" collapsible>
            <div className="space-y-2 text-sm">
              <Link
                href="/cfo/executive-summary"
                className="block text-[#4f46e5] dark:text-[#6366f1] hover:underline"
              >
                Executive summary
              </Link>
              <Link
                href="/cfo/compliance"
                className="block text-[#4f46e5] dark:text-[#6366f1] hover:underline"
              >
                Compliance
              </Link>
              <Link
                href="/core/reports"
                className="block text-[#4f46e5] dark:text-[#6366f1] hover:underline"
              >
                Financial reports
              </Link>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}

export default function CfoOverviewPage() {
  return (
    <TierGate
      tier="cfo"
      title="CFO Overview"
      subtitle="Upgrade or request access to unlock CFO tools."
    >
      <CfoOverviewBody />
    </TierGate>
  );
}
