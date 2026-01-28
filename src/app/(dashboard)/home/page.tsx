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
 * Design System: Self-contained dual-mode (light/dark)
 * Light: #fafafa bg, #ffffff card, #111827 text, #6b7280 muted, #e5e7eb border
 * Dark: #0a0a0b bg, #18181b card, #f9fafb text, #a1a1aa muted, #27272a border
 */

// =============================================================================
// PRIORITY CONSTANTS
// =============================================================================

const SECTION_PRIORITY = {
  LIVE_STATE: 100,
  SYNC_BANNER: 80,
  EVIDENCE: 60,
  NAVIGATION: 40,
} as const;

// =============================================================================
// SECTION 1: LIVE STATE
// =============================================================================

interface LiveStateProps {
  liveState: CoreState["live_state"];
}

function LiveStateSection({ liveState }: LiveStateProps) {
  const { unpaid_invoices, unpaid_bills, bank_sync } = liveState;

  const hasUnpaidInvoices = unpaid_invoices && unpaid_invoices.count > 0;
  const hasUnpaidBills = unpaid_bills && unpaid_bills.count > 0;
  const hasBankError = bank_sync?.status === "error";
  const hasBankStale = bank_sync?.status === "stale";
  const overdueInvoiceCount =
    unpaid_invoices?.items.filter((i) => i.is_overdue).length ?? 0;
  const overdueBillCount =
    unpaid_bills?.items.filter((b) => b.is_overdue).length ?? 0;

  if (!hasUnpaidInvoices && !hasUnpaidBills && !hasBankError && !hasBankStale) {
    return null;
  }

  return (
    <div
      data-testid="live-state-section"
      data-priority={SECTION_PRIORITY.LIVE_STATE}
      className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] p-4"
    >
      <h2 className="text-sm font-semibold text-[#111827] dark:text-[#f9fafb] uppercase tracking-wide mb-4">
        Requires Attention
      </h2>

      <div className="flex flex-wrap gap-3">
        {hasUnpaidInvoices && (
          <Link
            href="/invoicing"
            className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-4 py-2.5 text-sm font-medium text-[#111827] dark:text-[#f9fafb] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors"
          >
            <FileText className="h-4 w-4 text-[#6b7280] dark:text-[#a1a1aa]" />
            <span>
              {unpaid_invoices.count} unpaid invoice
              {unpaid_invoices.count !== 1 ? "s" : ""}
              {overdueInvoiceCount > 0 && (
                <span className="ml-1 text-[#6b7280] dark:text-[#a1a1aa]">
                  ({overdueInvoiceCount} overdue)
                </span>
              )}
            </span>
            <span className="font-semibold">
              {formatCurrency(unpaid_invoices.total_due)}
            </span>
          </Link>
        )}

        {hasUnpaidBills && (
          <Link
            href="/core-dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-4 py-2.5 text-sm font-medium text-[#111827] dark:text-[#f9fafb] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors"
          >
            <Receipt className="h-4 w-4 text-[#6b7280] dark:text-[#a1a1aa]" />
            <span>
              {unpaid_bills.count} unpaid bill
              {unpaid_bills.count !== 1 ? "s" : ""}
              {overdueBillCount > 0 && (
                <span className="ml-1 text-[#6b7280] dark:text-[#a1a1aa]">
                  ({overdueBillCount} overdue)
                </span>
              )}
            </span>
            <span className="font-semibold">
              {formatCurrency(unpaid_bills.total_due)}
            </span>
          </Link>
        )}

        {hasBankError && (
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-4 py-2.5 text-sm font-medium text-[#111827] dark:text-[#f9fafb] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors"
          >
            <Banknote className="h-4 w-4 text-[#6b7280] dark:text-[#a1a1aa]" />
            <span>Bank connection error</span>
            {bank_sync?.items_needing_attention &&
              bank_sync.items_needing_attention > 0 && (
                <span className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">
                  ({bank_sync.items_needing_attention} item
                  {bank_sync.items_needing_attention !== 1 ? "s" : ""})
                </span>
              )}
          </Link>
        )}

        {hasBankStale && !hasBankError && (
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-4 py-2.5 text-sm font-medium text-[#111827] dark:text-[#f9fafb] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-[#6b7280] dark:text-[#a1a1aa]" />
            <span>Bank sync stale (&gt;24h)</span>
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
  evidence: CoreState["evidence"];
}

function EvidenceSection({ evidence }: EvidenceProps) {
  const { invoices, bills, customers, vendors, recent_transactions } = evidence;

  const hasInvoices = invoices !== null && invoices.total_count > 0;
  const hasBills = bills !== null && bills.total_count > 0;
  const hasCustomers = customers !== null && customers.total_count > 0;
  const hasVendors = vendors !== null && vendors.total_count > 0;
  const hasTransactions =
    recent_transactions !== null && recent_transactions.count > 0;

  if (
    !hasInvoices &&
    !hasBills &&
    !hasCustomers &&
    !hasVendors &&
    !hasTransactions
  ) {
    return null;
  }

  return (
    <div
      data-testid="evidence-section"
      data-priority={SECTION_PRIORITY.EVIDENCE}
      className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] p-4 space-y-4"
    >
      <h2 className="text-sm font-semibold text-[#111827] dark:text-[#f9fafb] uppercase tracking-wide">
        Financial Evidence
      </h2>

      {(hasInvoices || hasBills) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {hasInvoices && (
            <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#111827] dark:text-[#f9fafb]">
                    <FileText className="h-4 w-4 text-[#6b7280] dark:text-[#a1a1aa]" />
                    Invoicing
                  </div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-[#111827] dark:text-[#f9fafb]">
                    {formatCurrency(invoices.total_amount)}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                    <span>Paid {formatCurrency(invoices.paid_amount)}</span>
                    {invoices.due_amount > 0 && (
                      <span>Due {formatCurrency(invoices.due_amount)}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#111827] dark:text-[#f9fafb]">
                    {formatCount(invoices.total_count)}
                  </div>
                  <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">
                    invoices
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Link
                  href="/invoicing"
                  className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium bg-[#f3f4f6] dark:bg-[#3f3f46] text-[#111827] dark:text-[#f9fafb] hover:bg-[#e5e7eb] dark:hover:bg-[#52525b] transition-colors"
                >
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {hasBills && (
            <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#111827] dark:text-[#f9fafb]">
                    <Receipt className="h-4 w-4 text-[#6b7280] dark:text-[#a1a1aa]" />
                    Bills
                  </div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-[#111827] dark:text-[#f9fafb]">
                    {formatCurrency(bills.total_amount)}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                    <span>Paid {formatCurrency(bills.paid_amount)}</span>
                    {bills.due_amount > 0 && (
                      <span>Due {formatCurrency(bills.due_amount)}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#111827] dark:text-[#f9fafb]">
                    {formatCount(bills.total_count)}
                  </div>
                  <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">
                    bills
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Link
                  href="/core-dashboard"
                  className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium bg-[#f3f4f6] dark:bg-[#3f3f46] text-[#111827] dark:text-[#f9fafb] hover:bg-[#e5e7eb] dark:hover:bg-[#52525b] transition-colors"
                >
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {(hasCustomers || hasVendors) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {hasCustomers && (
            <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span className="text-sm font-medium text-[#111827] dark:text-[#f9fafb]">
                    Customers
                  </span>
                </div>
                <div className="text-xl font-bold text-[#111827] dark:text-[#f9fafb]">
                  {formatCount(customers.total_count)}
                </div>
              </div>
            </div>
          )}

          {hasVendors && (
            <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span className="text-sm font-medium text-[#111827] dark:text-[#f9fafb]">
                    Vendors
                  </span>
                </div>
                <div className="text-xl font-bold text-[#111827] dark:text-[#f9fafb]">
                  {formatCount(vendors.total_count)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {hasTransactions && (
        <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb] dark:border-[#27272a]">
            <div className="flex items-center gap-2 text-sm font-medium text-[#111827] dark:text-[#f9fafb]">
              <Activity className="h-4 w-4 text-[#6b7280] dark:text-[#a1a1aa]" />
              Recent Activity
            </div>
            <Link
              href="/core/transactions"
              className="inline-flex items-center gap-1 text-sm text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-[#f9fafb] transition-colors"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-4 space-y-2">
            {recent_transactions.items.slice(0, 3).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2 border-b border-[#e5e7eb] dark:border-[#27272a] last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#111827] dark:text-[#f9fafb] truncate">
                    {tx.merchant_name}
                  </div>
                  <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">
                    {new Date(tx.date).toLocaleDateString()}
                  </div>
                </div>
                <div
                  className={`text-sm font-medium font-mono ${
                    tx.amount > 0
                      ? "text-[#dc2626] dark:text-[#ef4444]"
                      : "text-[#059669] dark:text-[#10b981]"
                  }`}
                >
                  {tx.amount > 0 ? "-" : "+"}
                  {formatCurrency(Math.abs(tx.amount))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SECTION 3: NAVIGATION
// =============================================================================

interface NavigationProps {
  hasEvidence: boolean;
}

function NavigationSection({ hasEvidence }: NavigationProps) {
  if (!hasEvidence) {
    return null;
  }

  return (
    <div
      data-testid="navigation-section"
      data-priority={SECTION_PRIORITY.NAVIGATION}
      className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] p-4 space-y-4"
    >
      <h2 className="text-sm font-semibold text-[#111827] dark:text-[#f9fafb] uppercase tracking-wide">
        Quick Actions
      </h2>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Link
          href="/core/transactions"
          className="flex flex-col items-start gap-1 rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a] px-4 py-4 hover:bg-white dark:hover:bg-[#18181b] transition-colors"
        >
          <span className="font-medium text-[#111827] dark:text-[#f9fafb]">
            Review Transactions
          </span>
          <span className="text-xs text-[#6b7280] dark:text-[#a1a1aa] font-normal">
            View and categorize recent activity
          </span>
        </Link>

        <Link
          href="/intelligence-dashboard"
          className="flex flex-col items-start gap-1 rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a] px-4 py-4 hover:bg-white dark:hover:bg-[#18181b] transition-colors"
        >
          <span className="font-medium text-[#111827] dark:text-[#f9fafb]">
            Intelligence
          </span>
          <span className="text-xs text-[#6b7280] dark:text-[#a1a1aa] font-normal">
            Analyze patterns and anomalies
          </span>
        </Link>

        <Link
          href="/cfo-dashboard"
          className="flex flex-col items-start gap-1 rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a] px-4 py-4 hover:bg-white dark:hover:bg-[#18181b] transition-colors"
        >
          <span className="font-medium text-[#111827] dark:text-[#f9fafb]">
            CFO Overview
          </span>
          <span className="text-xs text-[#6b7280] dark:text-[#a1a1aa] font-normal">
            High-level financial summary
          </span>
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// SUBORDINATE BANNER SLOT
// =============================================================================

interface SubordinateBannerSlotProps {
  children: React.ReactNode;
}

function SubordinateBannerSlot({ children }: SubordinateBannerSlotProps) {
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
// SYNC BANNER
// =============================================================================

interface SyncBannerProps {
  sync: CoreSyncState;
}

function SyncBanner({ sync }: SyncBannerProps) {
  if (sync.status === "success" || sync.status === "never") {
    return null;
  }

  if (sync.status === "running") {
    return (
      <div
        data-testid="sync-banner"
        data-sync-status="running"
        className="inline-flex items-center gap-2 rounded-md border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-3 py-1.5 text-sm text-[#111827] dark:text-[#f9fafb]"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#6b7280] dark:text-[#a1a1aa]" />
        <span>Syncing financial data…</span>
      </div>
    );
  }

  if (sync.status === "failed") {
    return (
      <div
        data-testid="sync-banner"
        data-sync-status="failed"
        className="inline-flex items-center gap-2 rounded-md border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-3 py-1.5 text-sm text-[#111827] dark:text-[#f9fafb]"
      >
        <AlertCircle className="h-3.5 w-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
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
  const { state, isLoading, hasEvidence } = useCoreState();

  if (isLoading) {
    return (
      <RouteShell title="Dashboard" subtitle="Loading state-of-business...">
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-16 rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a]" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="h-40 rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a]" />
              <div className="h-40 rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a]" />
            </div>
          </div>
        </div>
      </RouteShell>
    );
  }

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

        <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b]">
          <div className="p-8 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-[#6b7280] dark:text-[#a1a1aa] mb-4" />
            <h3 className="text-lg font-semibold text-[#111827] dark:text-[#f9fafb] mb-2">
              No Financial Data Yet
            </h3>
            <p className="text-sm text-[#6b7280] dark:text-[#a1a1aa] max-w-md mx-auto mb-6">
              Connect your bank accounts or create invoices to see your
              state-of-business overview.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/connect-bank"
                className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-[#4f46e5] dark:bg-[#6366f1] text-white hover:bg-[#4338ca] dark:hover:bg-[#4f46e5] transition-colors"
              >
                Connect Bank
              </Link>
              <Link
                href="/invoicing"
                className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[#111827] dark:text-[#f9fafb] hover:bg-[#f9fafb] dark:hover:bg-[#27272a] transition-colors"
              >
                Create Invoice
              </Link>
            </div>
          </div>
        </div>
      </RouteShell>
    );
  }

  const showSyncBanner =
    state.sync.status === "running" || state.sync.status === "failed";

  return (
    <RouteShell
      title="Dashboard"
      subtitle="State-of-business overview. Shows what's happening and what needs attention."
      right={
        <div className="flex items-center gap-2">
          <PageHelp
            title="Dashboard"
            description="Your state-of-business overview. Auto-populated from connected accounts."
          />
          <Link
            href="/core-dashboard"
            className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium bg-[#4f46e5] dark:bg-[#6366f1] text-white hover:bg-[#4338ca] dark:hover:bg-[#4f46e5] transition-colors"
          >
            Open Core
          </Link>
        </div>
      }
    >
      <FirstRunSystemBanner />

      <div className="space-y-8" data-testid="dashboard-content">
        <LiveStateSection liveState={state.live_state} />

        {showSyncBanner && (
          <SubordinateBannerSlot>
            <SyncBanner sync={state.sync} />
          </SubordinateBannerSlot>
        )}

        <EvidenceSection evidence={state.evidence} />

        <NavigationSection hasEvidence={hasEvidence} />
      </div>
    </RouteShell>
  );
}
