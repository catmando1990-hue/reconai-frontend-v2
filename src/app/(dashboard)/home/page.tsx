"use client";

import { useMemo } from "react";
import Link from "next/link";
import { RouteShell } from "@/components/dashboard/RouteShell";
import PageHelp from "@/components/dashboard/PageHelp";
import FirstRunSystemBanner from "@/components/dashboard/FirstRunSystemBanner";
import SignalsPanel from "@/components/signals/SignalsPanel";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useDashboardState } from "@/hooks/useDashboardState";
import {
  renderIfAvailable,
  formatCurrency,
  formatCount,
} from "@/lib/renderGuards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  FileText,
  Receipt,
  Users,
  Building2,
  AlertTriangle,
  HelpCircle,
  Clock,
  RefreshCw,
  Banknote,
} from "lucide-react";

/**
 * State-of-Business Dashboard
 *
 * CANONICAL LAWS COMPLIANCE:
 * - Sections only render if backing data exists
 * - null → "—" (em dash), unknown → "Unknown", never coerce to 0
 * - Fail-closed: missing data is explicit, not hidden
 * - Delete (don't hide) any widget without backing signal
 *
 * STRUCTURE:
 * 1. Live State (top) - What needs attention RIGHT NOW
 * 2. Evidence (middle) - Real data from backend
 * 3. Navigation (bottom) - Only if other sections rendered
 */

// =============================================================================
// SECTION 1: LIVE STATE
// =============================================================================

interface LiveStateProps {
  documentsWaiting: {
    available: boolean;
    count: number | null;
  };
  bankSync: {
    available: boolean;
    status: string | null;
    isStale: boolean;
    lastSyncedAt: string | null;
  };
  healthStatus: "ok" | "attention" | "unknown";
}

/**
 * LiveStateSection - Shows what needs attention RIGHT NOW
 * Only renders if there's actionable state to display
 */
function LiveStateSection({
  documentsWaiting,
  bankSync,
  healthStatus,
}: LiveStateProps) {
  // Determine if any live state signals exist
  const hasDocumentsWaiting =
    documentsWaiting.available && (documentsWaiting.count ?? 0) > 0;
  const hasBankStale = bankSync.available && bankSync.isStale;
  const hasBankIssue =
    bankSync.available &&
    (bankSync.status === "login_required" || bankSync.status === "error");
  const hasAttention = healthStatus === "attention";

  // If no live state signals, don't render this section
  if (!hasDocumentsWaiting && !hasBankStale && !hasBankIssue && !hasAttention) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Requires Attention
      </h2>

      <div className="flex flex-wrap gap-2">
        {/* Health Status Chip */}
        {healthStatus === "unknown" ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            Status unavailable
          </span>
        ) : healthStatus === "attention" ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            Amounts due
          </span>
        ) : null}

        {/* Documents Waiting */}
        {hasDocumentsWaiting && (
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors"
          >
            <Clock className="h-4 w-4" />
            {documentsWaiting.count} document{documentsWaiting.count !== 1 ? "s" : ""} processing
          </Link>
        )}

        {/* Bank Sync Issues */}
        {hasBankIssue && (
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <Banknote className="h-4 w-4" />
            Bank connection {bankSync.status === "login_required" ? "needs re-auth" : "error"}
          </Link>
        )}

        {/* Bank Sync Stale */}
        {hasBankStale && !hasBankIssue && (
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-medium text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Bank sync stale (&gt;24h)
          </Link>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SECTION 2: EVIDENCE
// =============================================================================

interface EvidenceProps {
  metricsAvailable: boolean;
  totalInvoiced: number | null;
  totalInvoicePaid: number | null;
  totalInvoiceDue: number | null;
  totalBilled: number | null;
  totalBillPaid: number | null;
  totalBillDue: number | null;
  invoices: number | null;
  bills: number | null;
  customers: number | null;
  vendors: number | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * EvidenceSection - Shows real data from backend
 * Only renders if metrics are available
 */
function EvidenceSection({
  metricsAvailable,
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
  isLoading,
  error,
}: EvidenceProps) {
  // If metrics unavailable and not loading, don't render section
  if (!metricsAvailable && !isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card/50 p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <HelpCircle className="h-5 w-5" />
          <span className="text-sm">
            {error
              ? "Unable to load financial data. Showing safe defaults."
              : "Financial metrics unavailable."}
          </span>
        </div>
      </div>
    );
  }

  // Check if we have any meaningful data to show
  const hasInvoiceData = totalInvoiced !== null || invoices !== null;
  const hasBillData = totalBilled !== null || bills !== null;
  const hasCountData = customers !== null || vendors !== null;

  if (!hasInvoiceData && !hasBillData && !hasCountData && !isLoading) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Financial Evidence
      </h2>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Accounts Summary
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Actual inflow/outflow data from connected accounts.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="h-32 bg-card/30 rounded-xl" />
                <div className="h-32 bg-card/30 rounded-xl" />
              </div>
            </div>
          ) : (
            <>
              {/* Invoice and Bill Summary - only render if data exists */}
              {(hasInvoiceData || hasBillData) && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Invoicing Panel */}
                  {renderIfAvailable(
                    hasInvoiceData ? { totalInvoiced, invoices } : null,
                    () => (
                      <div className="rounded-xl border border-border bg-background p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium">Invoicing</div>
                            <div className="mt-1 text-2xl font-semibold tracking-tight">
                              {formatCurrency(totalInvoiced)}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Paid {formatCurrency(totalInvoicePaid)} • Due{" "}
                              {formatCurrency(totalInvoiceDue)}
                            </div>
                          </div>
                          <div className="h-10 w-10 rounded-xl border border-border bg-card flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatCount(invoices)} invoice{invoices !== 1 ? "s" : ""}
                          </span>
                          <Button asChild size="sm" variant="secondary">
                            <Link href="/invoicing">
                              Review <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )
                  )}

                  {/* Bills Panel */}
                  {renderIfAvailable(
                    hasBillData ? { totalBilled, bills } : null,
                    () => (
                      <div className="rounded-xl border border-border bg-background p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium">Bills</div>
                            <div className="mt-1 text-2xl font-semibold tracking-tight">
                              {formatCurrency(totalBilled)}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Paid {formatCurrency(totalBillPaid)} • Due{" "}
                              {formatCurrency(totalBillDue)}
                            </div>
                          </div>
                          <div className="h-10 w-10 rounded-xl border border-border bg-card flex items-center justify-center">
                            <Receipt className="h-5 w-5 text-primary" />
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatCount(bills)} bill{bills !== 1 ? "s" : ""}
                          </span>
                          <Button asChild size="sm" variant="secondary">
                            <Link href="/core-dashboard">
                              Open Core <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Customer and Vendor Counts - only render if data exists */}
              {hasCountData && (
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {renderIfAvailable(customers, (count) => (
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Customers</div>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="mt-1 text-xl font-semibold tracking-tight">
                        {formatCount(count)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Active customer records
                      </div>
                    </div>
                  ))}

                  {renderIfAvailable(vendors, (count) => (
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Vendors</div>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="mt-1 text-xl font-semibold tracking-tight">
                        {formatCount(count)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Active vendor records
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Signals Panel - manual fetch, advisory only */}
      <SignalsPanel />
    </div>
  );
}

// =============================================================================
// SECTION 3: NAVIGATION
// =============================================================================

interface NavigationProps {
  showNavigation: boolean;
}

/**
 * NavigationSection - Quick paths into the system
 * Only renders if other sections rendered (user has context)
 */
function NavigationSection({ showNavigation }: NavigationProps) {
  if (!showNavigation) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Quick Actions
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Button
          asChild
          variant="secondary"
          className="h-auto py-4 justify-start"
        >
          <Link href="/core/transactions" className="flex flex-col items-start gap-1">
            <span className="font-medium">Review Transactions</span>
            <span className="text-xs text-muted-foreground font-normal">
              View and categorize recent activity
            </span>
          </Link>
        </Button>

        <Button
          asChild
          variant="secondary"
          className="h-auto py-4 justify-start"
        >
          <Link href="/intelligence-dashboard" className="flex flex-col items-start gap-1">
            <span className="font-medium">Run Intelligence</span>
            <span className="text-xs text-muted-foreground font-normal">
              Analyze patterns and anomalies
            </span>
          </Link>
        </Button>

        <Button
          asChild
          variant="secondary"
          className="h-auto py-4 justify-start"
        >
          <Link href="/cfo-dashboard" className="flex flex-col items-start gap-1">
            <span className="font-medium">CFO Overview</span>
            <span className="text-xs text-muted-foreground font-normal">
              High-level financial summary
            </span>
          </Link>
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function HomeDashboardPage() {
  const { metrics, isLoading: metricsLoading, error: metricsError } = useDashboardMetrics();
  const { state: dashboardState, isLoading: stateLoading } = useDashboardState();

  const derived = useMemo(() => {
    const m = metrics;

    /**
     * P0 FIX: Check availability BEFORE accessing any nested fields.
     * If metrics are unavailable, return early with safe defaults.
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
     */
    const canDetermineHealth =
      totalInvoiceDue !== null && totalBillDue !== null;

    const health: "ok" | "attention" | "unknown" = !canDetermineHealth
      ? "unknown"
      : totalInvoiceDue > 0 || totalBillDue > 0
        ? "attention"
        : "ok";

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
    };
  }, [metrics]);

  // Determine if navigation should show (only if other sections rendered)
  const showNavigation =
    derived.metricsAvailable ||
    dashboardState.documentsWaiting.available ||
    dashboardState.bankSync.available;

  return (
    <RouteShell
      title="Dashboard"
      subtitle="State-of-business overview. Shows what's happening and what needs attention."
      right={
        <div className="flex items-center gap-2">
          <PageHelp
            title="Dashboard"
            description="Your state-of-business overview. Displays metrics from connected accounts and surfaces priority signals."
          />
          <Button asChild size="sm">
            <Link href="/core-dashboard">Open Core</Link>
          </Button>
        </div>
      }
    >
      <FirstRunSystemBanner />

      <div className="space-y-8">
        {/* SECTION 1: Live State - What needs attention now */}
        <LiveStateSection
          documentsWaiting={dashboardState.documentsWaiting}
          bankSync={dashboardState.bankSync}
          healthStatus={derived.health}
        />

        {/* SECTION 2: Evidence - Real data from backend */}
        <EvidenceSection
          metricsAvailable={derived.metricsAvailable}
          totalInvoiced={derived.totalInvoiced}
          totalInvoicePaid={derived.totalInvoicePaid}
          totalInvoiceDue={derived.totalInvoiceDue}
          totalBilled={derived.totalBilled}
          totalBillPaid={derived.totalBillPaid}
          totalBillDue={derived.totalBillDue}
          invoices={derived.invoices}
          bills={derived.bills}
          customers={derived.customers}
          vendors={derived.vendors}
          isLoading={metricsLoading || stateLoading}
          error={metricsError}
        />

        {/* SECTION 3: Navigation - Only if other sections rendered */}
        <NavigationSection showNavigation={showNavigation} />
      </div>
    </RouteShell>
  );
}
