"use client";

import { useMemo } from "react";
import Link from "next/link";
import { RouteShell } from "@/components/dashboard/RouteShell";
import PageHelp from "@/components/dashboard/PageHelp";
import FirstRunSystemBanner from "@/components/dashboard/FirstRunSystemBanner";
import FirstValueCallout from "@/components/dashboard/FirstValueCallout";
import SignalsPanel from "@/components/signals/SignalsPanel";
import {
  CfoSnapshotStrip,
  type CfoSnapshotData,
} from "@/components/dashboard/CfoSnapshotStrip";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  FileText,
  Receipt,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

/**
 * Format currency value. Returns "--" for null (unknown state).
 * FAIL-CLOSED: null means unknown, displayed explicitly.
 */
function formatCurrency(value: number | null): string {
  if (value === null) return "--";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${Math.round(value).toLocaleString()}`;
  }
}

/**
 * Format count value. Returns "--" for null (unknown state).
 */
function formatCount(value: number | null): string {
  if (value === null) return "--";
  return value.toString();
}

export default function HomeDashboardPage() {
  const { metrics, isLoading, error } = useDashboardMetrics();

  const derived = useMemo(() => {
    const m = metrics;

    /**
     * P0 FIX: Check availability BEFORE accessing any nested fields.
     * If metrics are unavailable, return early with safe defaults.
     * This prevents "Cannot read properties of undefined" crashes.
     */
    if (!m?.available) {
      return {
        metricsAvailable: false,
        totalInvoiced: null,
        totalInvoicePaid: null,
        totalInvoiceDue: null,
        totalBilled: null,
        totalBillPaid: null,
        totalBillDue: null,
        invoices: null,
        bills: null,
        customers: null,
        vendors: null,
        health: "unknown" as const,
        cfoSnapshot: {} as CfoSnapshotData,
      };
    }

    // SAFE: metrics.available === true, all nested objects exist
    const totalInvoiced = m.summary.totalInvoiced;
    const totalInvoicePaid = m.summary.totalInvoicePaid;
    const totalInvoiceDue = m.summary.totalInvoiceDue;

    const totalBilled = m.summary.totalBilled;
    const totalBillPaid = m.summary.totalBillPaid;
    const totalBillDue = m.summary.totalBillDue;

    const invoices = m.counts.invoices;
    const bills = m.counts.bills;
    const customers = m.counts.customers;
    const vendors = m.counts.vendors;

    /**
     * FAIL-CLOSED Health Status Logic:
     * - "unknown": Required data is null (cannot determine health)
     * - "ok": Data exists AND no outstanding amounts due
     * - "attention": Data exists AND amounts are due
     *
     * We NEVER report "ok" when data is unavailable.
     */
    const canDetermineHealth =
      totalInvoiceDue !== null && totalBillDue !== null;

    const health: "ok" | "attention" | "unknown" = !canDetermineHealth
      ? "unknown"
      : totalInvoiceDue > 0 || totalBillDue > 0
        ? "attention"
        : "ok";

    /**
     * CFO Snapshot - Only pass metrics with real backend data.
     * P1 FIX: Removed undefined metrics (runway, potentialSavings, topVendor)
     * that were displaying misleading "--" values.
     */
    const cfoSnapshot: CfoSnapshotData = {
      cashIn: totalInvoicePaid ?? undefined,
      cashOut: totalBillPaid ?? undefined,
    };

    return {
      metricsAvailable: true,
      totalInvoiced,
      totalInvoicePaid,
      totalInvoiceDue,
      totalBilled,
      totalBillPaid,
      totalBillDue,
      invoices,
      bills,
      customers,
      vendors,
      health,
      cfoSnapshot,
    };
  }, [metrics]);

  return (
    <RouteShell
      title="Dashboard"
      subtitle="Operating overview. Review status, surface risks, and take the next action."
      right={
        <div className="flex items-center gap-2">
          <PageHelp
            title="Dashboard"
            description="Your operating overview. Displays metrics from connected accounts and surfaces priority signals."
          />
          <Button asChild size="sm">
            <Link href="/core-dashboard">Open Core</Link>
          </Button>
        </div>
      }
    >
      <FirstRunSystemBanner />
      <FirstValueCallout
        insight="Review your accounts summary below to see outstanding invoices and bills."
        actionLabel="Review transactions"
        onAction={() => (window.location.href = "/core/transactions")}
      />

      {/* Overview header strip (analyst-style, not marketing) */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {derived.health === "unknown" ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                Status unavailable
              </span>
            ) : derived.health === "ok" ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                No outstanding due items detected
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Attention required: amounts due
              </span>
            )}

            {isLoading && (
              <span className="text-xs text-muted-foreground">
                Loading metrics…
              </span>
            )}
            {!isLoading && (error || !derived.metricsAvailable) && (
              <span className="text-xs text-muted-foreground">
                Metrics unavailable. Showing safe defaults.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/invoicing">Invoicing</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/core/transactions">Transactions</Link>
            </Button>
          </div>
        </div>

        <CfoSnapshotStrip data={derived.cfoSnapshot} />
      </div>

      {/* Primary + Secondary panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* PRIMARY PANEL */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Accounts summary
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                High-level inflow/outflow and what requires action.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">Invoicing</div>
                      <div className="mt-1 text-2xl font-semibold tracking-tight">
                        {formatCurrency(derived.totalInvoiced)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Paid {formatCurrency(derived.totalInvoicePaid)} • Due{" "}
                        {formatCurrency(derived.totalInvoiceDue)}
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-xl border border-border bg-card flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatCount(derived.invoices)} invoices
                    </span>
                    <Button asChild size="sm" variant="secondary">
                      <Link href="/invoicing">
                        Review <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">Bills</div>
                      <div className="mt-1 text-2xl font-semibold tracking-tight">
                        {formatCurrency(derived.totalBilled)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Paid {formatCurrency(derived.totalBillPaid)} • Due{" "}
                        {formatCurrency(derived.totalBillDue)}
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-xl border border-border bg-card flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatCount(derived.bills)} bills
                    </span>
                    <Button asChild size="sm" variant="secondary">
                      <Link href="/core-dashboard">
                        Open Core <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Customers</div>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="mt-1 text-xl font-semibold tracking-tight">
                    {formatCount(derived.customers)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Active customer records
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Vendors</div>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="mt-1 text-xl font-semibold tracking-tight">
                    {formatCount(derived.vendors)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Active vendor records
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* REMOVED: DuplicateChargesInsight - P0 Fix #3
           * Mock duplicate data was being displayed in production UI.
           * Component uses hardcoded MOCK_TRANSACTIONS, not backend truth.
           * Removed from Dashboard Home per fail-closed requirements.
           */}
          <SignalsPanel />
        </div>

        {/* SECONDARY PANELS */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Recommended next actions
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Fast paths into the system.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                asChild
                variant="secondary"
                className="w-full justify-between"
              >
                <Link href="/core/transactions">
                  Review transactions
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="w-full justify-between"
              >
                <Link href="/intelligence-dashboard">
                  Run intelligence
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="w-full justify-between"
              >
                <Link href="/cfo-dashboard">
                  Open CFO overview
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                What this dashboard does
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                This page is your operating overview. It summarizes
                inflow/outflow, highlights amounts due, and surfaces priority
                signals.
              </p>
              <p>
                For execution work, use{" "}
                <span className="text-foreground">Core</span>. For analysis, use{" "}
                <span className="text-foreground">Intelligence</span> and{" "}
                <span className="text-foreground">CFO</span>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </RouteShell>
  );
}
