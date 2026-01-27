"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusChip } from "@/components/dashboard/StatusChip";
import PolicyBanner from "@/components/policy/PolicyBanner";
import { TierGate } from "@/components/legal/TierGate";
import { ROUTES } from "@/lib/routes";
import { STATUS, EMPTY_STATE, CTA, PANEL_TITLE } from "@/lib/dashboardCopy";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import {
  Building2,
  ArrowLeftRight,
  FileText,
  Upload,
  Link2,
  Settings,
  ChevronRight,
  BarChart3,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

type WorkQueueItem = {
  id: string;
  date: string;
  merchant?: string | null;
  description?: string | null;
  amount: number;
  category?: string | null;
  pending?: boolean;
};

const coreModules = [
  {
    name: "Transactions",
    href: ROUTES.CORE_TRANSACTIONS,
    icon: ArrowLeftRight,
    description: "View and categorize",
    primary: true,
  },
  {
    name: "Accounts",
    href: ROUTES.ACCOUNTS,
    icon: Building2,
    description: "Connected bank accounts",
  },
  {
    name: "Reports",
    href: ROUTES.CORE_REPORTS,
    icon: BarChart3,
    description: "Financial reports",
  },
  {
    name: "Upload",
    href: ROUTES.UPLOAD,
    icon: Upload,
    description: "Import statements",
  },
  {
    name: "Connect Bank",
    href: ROUTES.CONNECT_BANK,
    icon: Link2,
    description: "Link new accounts",
  },
  {
    name: "Settings",
    href: ROUTES.SETTINGS,
    icon: Settings,
    description: "Preferences",
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(amount));
}

export default function CoreOverviewPage() {
  const { apiFetch } = useApi();
  const { isLoaded } = useOrg();
  const [workQueue, setWorkQueue] = useState<WorkQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      type TransactionsResponse =
        | WorkQueueItem[]
        | { items: WorkQueueItem[]; count?: number; request_id?: string };
      const data = await apiFetch<TransactionsResponse>("/api/transactions?limit=10");
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : [];
      // Filter to items needing attention (uncategorized or pending)
      const needsAttention = items.filter(
        (tx) => !tx.category || tx.category === "Uncategorized" || tx.pending,
      );
      setWorkQueue(needsAttention.slice(0, 5));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!isLoaded) return;
    fetchWorkQueue();
  }, [isLoaded, fetchWorkQueue]);

  return (
    <TierGate tier="core" title="Core" subtitle="Structured financial reality">
      <RouteShell
        title="Core"
        subtitle="Structured financial reality. Your operational foundation."
      >
        <PolicyBanner
          policy="bookkeeping"
          message="Transaction categorization is automated but may require review. Verify classifications before using for tax or compliance purposes."
          context="core"
        />

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Primary Panel - Work Queue */}
          <div className="lg:col-span-8">
            <PrimaryPanel
              title="Work Queue"
              subtitle="Items requiring attention"
              actions={
                <Link
                  href={ROUTES.CORE_TRANSACTIONS}
                  className="text-sm text-primary hover:underline"
                >
                  View all transactions
                </Link>
              }
            >
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 py-4 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {!loading && !error && workQueue.length === 0 && (
                <EmptyState
                  icon={FileText}
                  title={EMPTY_STATE.transactions.title}
                  description={EMPTY_STATE.transactions.description}
                  action={{
                    label: CTA.VIEW_DETAILS,
                    href: ROUTES.CORE_TRANSACTIONS,
                  }}
                />
              )}

              {!loading && !error && workQueue.length > 0 && (
                <div className="divide-y">
                  {workQueue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3 px-1"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">
                          {item.merchant || item.description || "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.date}
                          {item.pending && (
                            <span className="ml-2 text-amber-500">Pending</span>
                          )}
                          {(!item.category || item.category === "Uncategorized") && (
                            <span className="ml-2 text-amber-500">Needs categorization</span>
                          )}
                        </div>
                      </div>
                      <div
                        className={[
                          "font-mono text-sm font-medium",
                          item.amount > 0 ? "text-destructive" : "text-emerald-600",
                        ].join(" ")}
                      >
                        {item.amount > 0 ? "-" : "+"}
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                  ))}
                  <div className="pt-3">
                    <Link
                      href={ROUTES.CORE_TRANSACTIONS}
                      className="text-sm text-primary hover:underline"
                    >
                      View all transactions →
                    </Link>
                  </div>
                </div>
              )}
            </PrimaryPanel>
          </div>

          {/* Secondary Panels */}
          <div className="space-y-4 lg:col-span-4">
            <SecondaryPanel title={PANEL_TITLE.quickAccess}>
              <nav className="space-y-1">
                {coreModules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <Link
                      key={module.href}
                      href={module.href}
                      className={[
                        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                        module.primary
                          ? "bg-muted text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      ].join(" ")}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{module.name}</span>
                      <ChevronRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  );
                })}
              </nav>
            </SecondaryPanel>

            <SecondaryPanel title={PANEL_TITLE.systemStatus} collapsible>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Data Sync
                  </span>
                  <StatusChip variant="unknown">
                    {STATUS.NOT_CONFIGURED}
                  </StatusChip>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Categorization
                  </span>
                  <StatusChip variant="unknown">
                    {STATUS.NOT_EVALUATED}
                  </StatusChip>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Reconciliation
                  </span>
                  <StatusChip variant="muted">
                    {STATUS.REQUIRES_SETUP}
                  </StatusChip>
                </div>
              </div>
            </SecondaryPanel>
          </div>
        </div>
      </RouteShell>
    </TierGate>
  );
}
