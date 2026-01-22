"use client";

import Link from "next/link";
import { RouteShell } from "@/components/dashboard/RouteShell";
import PageHelp from "@/components/dashboard/PageHelp";
import FirstRunSystemBanner from "@/components/dashboard/FirstRunSystemBanner";
import {
  useCoreState,
  type CoreState,
  type CoreSyncState,
} from "@/hooks/useCoreState";
import { formatCurrency, formatCount } from "@/lib/renderGuards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  FileText,
  Receipt,
  Users,
  Building2,
  RefreshCw,
  Banknote,
  TrendingUp,
  Activity,
  AlertCircle,
  Loader2,
} from "lucide-react";

/**
 * CORE State-of-Business Dashboard
 *
 * P0 FIX: ALL CORE surfaces driven by single /api/core/state fetch.
 *
 * RENDER RULES (NON-NEGOTIABLE):
 * - IF core_state.available === false: Render NOTHING for CORE widgets
 * - IF core_state.available === true: Render ONLY entities that exist
 * - No "--" dashes anywhere
 * - No empty cards rendered
 * - Sections disappear when irrelevant
 * - Unknown data shows NOTHING, not 0
 *
 * VISUAL HIERARCHY (NON-NEGOTIABLE):
 * - Priority ordering enforced in code, not CSS
 * - LiveState (priority=100) ALWAYS precedes SyncBanner (priority=80)
 * - Banners mount in subordinate slot, never header root
 * - No z-index tricks - DOM order determines visual hierarchy
 *
 * BACKGROUND NORMALIZATION (NON-NEGOTIABLE):
 * - Page canvas: Inherits bg-muted from DashboardShell
 * - CORE Live State: bg-background (ONLY instance in entire page)
 * - All other sections (Evidence, Navigation): bg-card
 * - Cards inside sections: bg-muted (subordinate to section wrapper)
 * - Borders over shadows
 * - No gradients, no decorative colors
 *
 * STRUCTURE:
 * 1. Live State (top) - What needs attention NOW (auto-populated)
 * 2. Subordinate Banner Slot - SyncBanner renders here (below Live State)
 * 3. Evidence (middle) - Real data from backend (auto-populated)
 * 4. Navigation (bottom) - Only if other sections rendered
 */

// =============================================================================
// PRIORITY CONSTANTS - Enforce visual hierarchy in code
// =============================================================================

/**
 * PRIORITY ORDERING - Higher number = higher visual precedence
 * These values enforce DOM order at render time.
 * Refactors CANNOT invert this order without changing these constants.
 */
const SECTION_PRIORITY = {
  LIVE_STATE: 100, // Highest - what needs attention NOW
  SYNC_BANNER: 80, // Subordinate to Live State
  EVIDENCE: 60, // Real data from backend
  NAVIGATION: 40, // Quick actions (lowest)
} as const;

// =============================================================================
// SECTION 1: LIVE STATE - What needs attention NOW
// =============================================================================

interface LiveStateProps {
  liveState: CoreState["live_state"];
}

/**
 * LiveStateSection - Shows what needs attention RIGHT NOW
 * ONLY renders if there's actionable state to display
 * NO manual fetch buttons - auto-populated on load
 *
 * PRIORITY: 100 (highest) - Always renders first in visual hierarchy
 */
function LiveStateSection({ liveState }: LiveStateProps) {
  const { unpaid_invoices, unpaid_bills, bank_sync } = liveState;

  // Determine attention items
  const hasUnpaidInvoices = unpaid_invoices && unpaid_invoices.count > 0;
  const hasUnpaidBills = unpaid_bills && unpaid_bills.count > 0;
  const hasBankError = bank_sync?.status === "error";
  const hasBankStale = bank_sync?.status === "stale";
  const overdueInvoiceCount =
    unpaid_invoices?.items.filter((i) => i.is_overdue).length ?? 0;
  const overdueBillCount =
    unpaid_bills?.items.filter((b) => b.is_overdue).length ?? 0;

  // If no attention items, don't render this section
  if (!hasUnpaidInvoices && !hasUnpaidBills && !hasBankError && !hasBankStale) {
    return null;
  }

  // PART 1: CORE Live State uses bg-background (only instance)
  return (
    <div
      data-testid="live-state-section"
      data-priority={SECTION_PRIORITY.LIVE_STATE}
      className="rounded-lg border border-border bg-background p-4"
    >
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
        Requires Attention
      </h2>

      <div className="flex flex-wrap gap-3">
        {/* Unpaid Invoices - border only, no decorative background */}
        {hasUnpaidInvoices && (
          <Link
            href="/invoicing"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>
              {unpaid_invoices.count} unpaid invoice
              {unpaid_invoices.count !== 1 ? "s" : ""}
              {overdueInvoiceCount > 0 && (
                <span className="ml-1 text-muted-foreground">
                  ({overdueInvoiceCount} overdue)
                </span>
              )}
            </span>
            <span className="font-semibold">
              {formatCurrency(unpaid_invoices.total_due)}
            </span>
          </Link>
        )}

        {/* Unpaid Bills - border only, no decorative background */}
        {hasUnpaidBills && (
          <Link
            href="/core-dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <span>
              {unpaid_bills.count} unpaid bill
              {unpaid_bills.count !== 1 ? "s" : ""}
              {overdueBillCount > 0 && (
                <span className="ml-1 text-muted-foreground">
                  ({overdueBillCount} overdue)
                </span>
              )}
            </span>
            <span className="font-semibold">
              {formatCurrency(unpaid_bills.total_due)}
            </span>
          </Link>
        )}

        {/* Bank Sync Error - border only, no decorative background */}
        {hasBankError && (
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Banknote className="h-4 w-4 text-muted-foreground" />
            <span>Bank connection error</span>
            {bank_sync?.items_needing_attention &&
              bank_sync.items_needing_attention > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({bank_sync.items_needing_attention} item
                  {bank_sync.items_needing_attention !== 1 ? "s" : ""})
                </span>
              )}
          </Link>
        )}

        {/* Bank Sync Stale - border only, no decorative background */}
        {hasBankStale && !hasBankError && (
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <span>Bank sync stale (&gt;24h)</span>
          </Link>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SECTION 2: EVIDENCE - Real data from backend
// =============================================================================

interface EvidenceProps {
  evidence: CoreState["evidence"];
}

/**
 * EvidenceSection - Shows real data from backend
 * ONLY renders cards with actual data - no empty cards
 * NO manual fetch buttons - auto-populated on load
 */
function EvidenceSection({ evidence }: EvidenceProps) {
  const { invoices, bills, customers, vendors, recent_transactions } = evidence;

  // Check what data exists
  const hasInvoices = invoices !== null && invoices.total_count > 0;
  const hasBills = bills !== null && bills.total_count > 0;
  const hasCustomers = customers !== null && customers.total_count > 0;
  const hasVendors = vendors !== null && vendors.total_count > 0;
  const hasTransactions =
    recent_transactions !== null && recent_transactions.count > 0;

  // If no evidence at all, don't render section
  if (
    !hasInvoices &&
    !hasBills &&
    !hasCustomers &&
    !hasVendors &&
    !hasTransactions
  ) {
    return null;
  }

  // PART 1: Evidence section uses bg-card wrapper
  return (
    <div
      data-testid="evidence-section"
      data-priority={SECTION_PRIORITY.EVIDENCE}
      className="rounded-lg border border-border bg-card p-4 space-y-4"
    >
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
        Financial Evidence
      </h2>

      {/* Invoice and Bill Summary Cards - no decorative colors */}
      {(hasInvoices || hasBills) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Invoices Card - only if data exists */}
          {hasInvoices && (
            <Card className="border-border bg-muted">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Invoicing
                    </div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                      {formatCurrency(invoices.total_amount)}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                      <span>Paid {formatCurrency(invoices.paid_amount)}</span>
                      {invoices.due_amount > 0 && (
                        <span>Due {formatCurrency(invoices.due_amount)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">
                      {formatCount(invoices.total_count)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      invoices
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/invoicing">
                      View All <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bills Card - only if data exists */}
          {hasBills && (
            <Card className="border-border bg-muted">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      Bills
                    </div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                      {formatCurrency(bills.total_amount)}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                      <span>Paid {formatCurrency(bills.paid_amount)}</span>
                      {bills.due_amount > 0 && (
                        <span>Due {formatCurrency(bills.due_amount)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">
                      {formatCount(bills.total_count)}
                    </div>
                    <div className="text-xs text-muted-foreground">bills</div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/core-dashboard">
                      View All <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Customer and Vendor Counts - only if data exists */}
      {(hasCustomers || hasVendors) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {hasCustomers && (
            <Card className="border-border bg-muted">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      Customers
                    </span>
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {formatCount(customers.total_count)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {hasVendors && (
            <Card className="border-border bg-muted">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      Vendors
                    </span>
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {formatCount(vendors.total_count)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Activity - only if data exists, max 3 items */}
      {hasTransactions && (
        <Card className="border-border bg-muted">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Recent Activity
              </CardTitle>
              <Button asChild size="sm" variant="ghost">
                <Link href="/core/transactions">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2">
              {/* P0 FIX: Max 3 items per list for evidence density */}
              {recent_transactions.items.slice(0, 3).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {tx.merchant_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {tx.amount < 0 ? "-" : "+"}{formatCurrency(Math.abs(tx.amount))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// SECTION 3: NAVIGATION - Only if other sections rendered
// =============================================================================

interface NavigationProps {
  hasEvidence: boolean;
}

/**
 * NavigationSection - Quick paths into the system
 * ONLY renders if Evidence section rendered (user has context)
 * Truth is PRIMARY, Navigation is SECONDARY
 */
function NavigationSection({ hasEvidence }: NavigationProps) {
  // Navigation only shows if user has evidence (data exists)
  if (!hasEvidence) {
    return null;
  }

  // PART 1: Navigation section uses bg-card wrapper
  return (
    <div
      data-testid="navigation-section"
      data-priority={SECTION_PRIORITY.NAVIGATION}
      className="rounded-lg border border-border bg-card p-4 space-y-4"
    >
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
        Quick Actions
      </h2>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Button
          asChild
          variant="outline"
          className="h-auto py-4 justify-start border-border bg-muted hover:bg-background"
        >
          <Link
            href="/core/transactions"
            className="flex flex-col items-start gap-1"
          >
            <span className="font-medium text-foreground">
              Review Transactions
            </span>
            <span className="text-xs text-muted-foreground font-normal">
              View and categorize recent activity
            </span>
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-auto py-4 justify-start border-border bg-muted hover:bg-background"
        >
          <Link
            href="/intelligence-dashboard"
            className="flex flex-col items-start gap-1"
          >
            <span className="font-medium text-foreground">Intelligence</span>
            <span className="text-xs text-muted-foreground font-normal">
              Analyze patterns and anomalies
            </span>
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-auto py-4 justify-start border-border bg-muted hover:bg-background"
        >
          <Link
            href="/cfo-dashboard"
            className="flex flex-col items-start gap-1"
          >
            <span className="font-medium text-foreground">CFO Overview</span>
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
// SUBORDINATE BANNER SLOT - Explicit slot for banners below Live State
// =============================================================================

/**
 * SubordinateBannerSlot - Explicit container for banners
 *
 * P0 HIERARCHY ENFORCEMENT:
 * - This slot MUST render AFTER LiveStateSection in DOM order
 * - Banners are PROHIBITED from mounting in header root
 * - Priority is enforced structurally, not via CSS
 *
 * data-priority attribute enables test assertions on DOM order
 */
interface SubordinateBannerSlotProps {
  children: React.ReactNode;
}

function SubordinateBannerSlot({ children }: SubordinateBannerSlotProps) {
  // Only render if there are children (banners to show)
  if (!children) {
    return null;
  }

  return (
    <div
      data-testid="subordinate-banner-slot"
      data-priority={SECTION_PRIORITY.SYNC_BANNER}
      className="flex flex-wrap gap-2"
    >
      {children}
    </div>
  );
}

// =============================================================================
// SYNC BANNER - Only for "running" or "failed" states
// =============================================================================

interface SyncBannerProps {
  sync: CoreSyncState;
}

/**
 * SyncBanner - Shows sync lifecycle status
 * ONLY renders for "running" or "failed" states
 * P0 FIX: success/never = render NOTHING
 *
 * HIERARCHY RULE: Must render in SubordinateBannerSlot, NEVER in header root
 */
function SyncBanner({ sync }: SyncBannerProps) {
  // P0 RULE: Only render for running/failed states
  if (sync.status === "success" || sync.status === "never") {
    return null;
  }

  // Running state - border only, no decorative background
  if (sync.status === "running") {
    return (
      <div
        data-testid="sync-banner"
        data-sync-status="running"
        className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        <span>Syncing financial data…</span>
      </div>
    );
  }

  // Failed state - border only, no decorative background
  if (sync.status === "failed") {
    return (
      <div
        data-testid="sync-banner"
        data-sync-status="failed"
        className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground"
      >
        <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
        <span>
          Sync failed{sync.error_reason ? `: ${sync.error_reason}` : ""}
        </span>
      </div>
    );
  }

  return null;
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function HomeDashboardPage() {
  // P0 FIX: Single fetch for all CORE data - NO manual triggers
  const { state, isLoading, hasEvidence } = useCoreState();

  // Loading state - border only, no decorative backgrounds
  if (isLoading) {
    return (
      <RouteShell title="Dashboard" subtitle="Loading state-of-business...">
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-16 rounded-lg border border-border bg-muted" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="h-40 rounded-lg border border-border bg-muted" />
              <div className="h-40 rounded-lg border border-border bg-muted" />
            </div>
          </div>
        </div>
      </RouteShell>
    );
  }

  // P0 RULE: IF core_state.available === false, render NOTHING for CORE widgets
  // Optionally render ONE top-level notice
  if (!state.available) {
    return (
      <RouteShell
        title="Dashboard"
        subtitle="State-of-business overview"
        right={
          <div className="flex items-center gap-2">
            <PageHelp
              title="Dashboard"
              description="Your state-of-business overview. Connect your accounts to see financial data."
            />
          </div>
        }
      >
        <FirstRunSystemBanner />

        {/* Single honest notice - border only, no decorative backgrounds */}
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Financial Data Yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Connect your bank accounts or create invoices to see your
              state-of-business overview.
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild variant="default">
                <Link href="/connect-bank">Connect Bank</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/invoicing">Create Invoice</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </RouteShell>
    );
  }

  // P0 RULE: IF core_state.available === true, render ONLY entities that exist
  // Sections disappear when irrelevant

  // Determine if SyncBanner should render (only running/failed states)
  const showSyncBanner =
    state.sync.status === "running" || state.sync.status === "failed";

  return (
    <RouteShell
      title="Dashboard"
      subtitle="State-of-business overview. Shows what's happening and what needs attention."
      right={
        <div className="flex items-center gap-2">
          {/* P0 HIERARCHY: SyncBanner PROHIBITED from header root - renders in subordinate slot below */}
          <PageHelp
            title="Dashboard"
            description="Your state-of-business overview. Auto-populated from connected accounts."
          />
          <Button asChild size="sm">
            <Link href="/core-dashboard">Open Core</Link>
          </Button>
        </div>
      }
    >
      <FirstRunSystemBanner />

      <div className="space-y-8" data-testid="dashboard-content">
        {/*
         * P0 HIERARCHY ENFORCEMENT - Priority-ordered sections
         * Order is structural (in code), not CSS-based
         * LIVE_STATE (100) > SYNC_BANNER (80) > EVIDENCE (60) > NAVIGATION (40)
         */}

        {/* SECTION 1: Live State - Priority 100 (highest) */}
        <LiveStateSection liveState={state.live_state} />

        {/* SECTION 2: Subordinate Banner Slot - Priority 80 (below Live State) */}
        {/* P0 RULE: SyncBanner mounts HERE, never in header root */}
        {showSyncBanner && (
          <SubordinateBannerSlot>
            <SyncBanner sync={state.sync} />
          </SubordinateBannerSlot>
        )}

        {/* SECTION 3: Evidence - Priority 60 */}
        <EvidenceSection evidence={state.evidence} />

        {/* SECTION 4: Navigation - Priority 40 (lowest) */}
        <NavigationSection hasEvidence={hasEvidence} />
      </div>
    </RouteShell>
  );
}
