"use client";

import Link from "next/link";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import PolicyBanner from "@/components/policy/PolicyBanner";
import { OverviewSnapshot } from "@/components/overview/OverviewSnapshot";
import { Button } from "@/components/ui/button";
import { Download, Info } from "lucide-react";
import { useCfoSnapshot } from "@/hooks/useCfoSnapshot";

/**
 * CFO Overview Page
 *
 * P0 FIX: Hierarchy and Lifecycle Enforcement
 * - CFO metrics are SUBORDINATE to CORE (advisory, not authoritative)
 * - Metrics styled smaller than CORE to reinforce hierarchy
 * - Missing data MUST show reason, not ambiguous dashes
 * - Lifecycle status visible inline with metrics
 */

function MetricWithReason({
  label,
  value,
  lifecycle,
  reasonCode,
}: {
  label: string;
  value: string | number | null;
  lifecycle: string | null;
  reasonCode: string | null;
}) {
  // If we have actual data, show it (subordinate styling - text-lg, not text-xl)
  if (value !== null && lifecycle === "success") {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-lg font-medium">{value}</span>
      </div>
    );
  }

  // No data - show WHY with explicit reason
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground italic">
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

export default function CfoOverviewPage() {
  const { lifecycle, reasonCode } = useCfoSnapshot();

  return (
    <RouteShell
      title="CFO Overview"
      subtitle="Executive surfaces across financial posture and risk"
      right={
        <Button
          variant="secondary"
          size="sm"
          disabled
          title="Export requires backend integration"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
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
            <div className="space-y-4">
              {/* P0 FIX: Show reason for missing data, never ambiguous dashes */}
              <MetricWithReason
                label="Total Revenue"
                value={null}
                lifecycle={lifecycle}
                reasonCode={reasonCode}
              />
              <MetricWithReason
                label="Total Expenses"
                value={null}
                lifecycle={lifecycle}
                reasonCode={reasonCode}
              />
              <MetricWithReason
                label="Net Position"
                value={null}
                lifecycle={lifecycle}
                reasonCode={reasonCode}
              />
              {/* Lifecycle context - always visible */}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
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
          </SecondaryPanel>

          <SecondaryPanel title="Report Purpose">
            <div className="space-y-3 text-sm text-muted-foreground">
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
                className="block text-primary hover:underline"
              >
                Executive summary
              </Link>
              <Link
                href="/cfo/compliance"
                className="block text-primary hover:underline"
              >
                Compliance
              </Link>
              <Link
                href="/financial-reports"
                className="block text-primary hover:underline"
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
