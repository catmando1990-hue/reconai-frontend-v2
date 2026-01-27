"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useOrg } from "@/lib/org-context";
import { useFinancialEvidence } from "@/lib/financial-evidence-context";
import {
  CreditCard,
  GraduationCap,
  Home,
  Wallet,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Clock,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

type LiabilityItem = {
  account_id: string;
  institution_name: string;
  account_name: string;
  account_mask: string;
  reported_balance: number;
  interest_rate?: number | null;
  apr?: number | null;
  as_of?: string | null;
  minimum_payment?: number | null;
  origination_date?: string | null;
  property_address?: string | null;
  loan_type?: string;
};

type LiabilitiesData = {
  credit: LiabilityItem[];
  student: LiabilityItem[];
  mortgage: LiabilityItem[];
  other: LiabilityItem[];
  fetched_at: string;
};

type LiabilitiesResponse = {
  ok: boolean;
  liabilities: LiabilitiesData | null;
  error?: string;
  request_id: string;
};

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatPercent(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return "—";
  return `${rate.toFixed(2)}%`;
}

function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoString;
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * LiabilitiesPanel — Read-only liabilities view grouped by type
 *
 * Phase 8C Requirements:
 * - RBAC gated: Only visible to admin or org:admin roles
 * - Manual "Load Liabilities" action only (NO auto-fetch, NO polling)
 * - Grouped by: Credit Cards, Student Loans, Mortgages, Other Loans
 * - Uses "Reported balance" and "As of" language
 * - Never uses "Current", "Live", "Real-time"
 * - All errors include request_id
 */
export function LiabilitiesPanel() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: orgLoaded } = useOrg();
  const evidenceContext = useFinancialEvidence();

  // Data state
  const [data, setData] = useState<LiabilitiesData | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["credit", "student", "mortgage", "other"])
  );

  // ==========================================================================
  // RBAC CHECK
  // ==========================================================================

  const publicMetadata = user?.publicMetadata as
    | Record<string, unknown>
    | undefined;
  const role = publicMetadata?.role as string | undefined;
  const isAdmin = role === "admin" || role === "org:admin";

  // ==========================================================================
  // REPORT TO CONSISTENCY CONTEXT (Phase 8D)
  // ==========================================================================

  useEffect(() => {
    if (!evidenceContext) return;
    if (status !== "success") return;

    const hasData = data !== null && (
      data.credit.length > 0 ||
      data.student.length > 0 ||
      data.mortgage.length > 0 ||
      data.other.length > 0
    );

    evidenceContext.updateLiabilities({
      loaded: true,
      hasData,
      fetchedAt: data?.fetched_at || null,
    });
  }, [evidenceContext, status, data]);

  // Don't render until auth is loaded
  if (!userLoaded || !orgLoaded) return null;

  // RBAC: Hide completely if not admin (no disabled buttons, no hints)
  if (!isAdmin) return null;

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleLoad = async () => {
    if (status === "loading") return;

    setStatus("loading");
    setError(null);
    setRequestId(null);
    setData(null);

    try {
      const res = await fetch("/api/plaid/liabilities/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const reqId = res.headers.get("x-request-id");
      setRequestId(reqId);

      const json: LiabilitiesResponse = await res.json();

      if (!json.ok || !res.ok) {
        setStatus("error");
        setError(json.error || `Failed to load liabilities (${res.status})`);
        return;
      }

      setData(json.liabilities);
      setStatus("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setStatus("error");
      setError(message);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const renderSection = (
    title: string,
    key: string,
    icon: React.ReactNode,
    items: LiabilityItem[]
  ) => {
    const isExpanded = expandedSections.has(key);
    const total = items.reduce((sum, item) => sum + item.reported_balance, 0);

    return (
      <div key={key} className="rounded-lg border">
        <button
          type="button"
          onClick={() => toggleSection(key)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
              {icon}
            </div>
            <div className="text-left">
              <div className="font-medium">{title}</div>
              <div className="text-xs text-muted-foreground">
                {items.length} account{items.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">{formatCurrency(total)}</div>
            <div className="text-xs text-muted-foreground">Reported balance</div>
          </div>
        </button>

        {isExpanded && items.length > 0 && (
          <div className="border-t">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="text-left">
                  <th className="p-3 font-medium">Institution</th>
                  <th className="p-3 font-medium">Account</th>
                  <th className="p-3 font-medium text-right">Reported Balance</th>
                  <th className="p-3 font-medium text-right">Interest Rate</th>
                  <th className="p-3 font-medium text-right">As Of</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.account_id || idx} className="border-t">
                    <td className="p-3">{item.institution_name}</td>
                    <td className="p-3">
                      <div>{item.account_name}</div>
                      <div className="text-xs text-muted-foreground">
                        ****{item.account_mask}
                      </div>
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(item.reported_balance)}
                    </td>
                    <td className="p-3 text-right text-muted-foreground">
                      {formatPercent(item.interest_rate ?? item.apr)}
                    </td>
                    <td className="p-3 text-right text-muted-foreground text-xs">
                      {formatDate(item.as_of)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isExpanded && items.length === 0 && (
          <div className="border-t p-4 text-sm text-muted-foreground">
            No {title.toLowerCase()} found.
          </div>
        )}
      </div>
    );
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const totalLiabilities = data
    ? [...data.credit, ...data.student, ...data.mortgage, ...data.other].reduce(
        (sum, item) => sum + item.reported_balance,
        0
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Liabilities</h2>
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            Source: Plaid
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Read-only liabilities view. Manual actions only.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
        <strong>Disclaimer:</strong> Reported balances reflect data as of the
        fetch time. This is not a live balance and may differ from your actual
        account balance.
      </div>

      {/* Load Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleLoad()}
          disabled={status === "loading"}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {status === "loading" ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              Load Liabilities
            </>
          )}
        </button>

        {status === "success" && data && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>As of {formatDate(data.fetched_at)}</span>
          </div>
        )}
      </div>

      {/* Error State */}
      {status === "error" && error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">{error}</p>
              {requestId && (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  request_id: {requestId}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {status === "success" && data && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Total Reported Liabilities
            </span>
            <span className="text-lg font-semibold">
              {formatCurrency(totalLiabilities)}
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {status === "success" && data &&
       data.credit.length === 0 &&
       data.student.length === 0 &&
       data.mortgage.length === 0 &&
       data.other.length === 0 && (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          No liabilities found. Connect accounts with liability data to see them
          here.
        </div>
      )}

      {/* Liability Sections */}
      {status === "success" && data && (
        <div className="space-y-3">
          {renderSection(
            "Credit Cards",
            "credit",
            <CreditCard className="h-4 w-4 text-muted-foreground" />,
            data.credit
          )}
          {renderSection(
            "Student Loans",
            "student",
            <GraduationCap className="h-4 w-4 text-muted-foreground" />,
            data.student
          )}
          {renderSection(
            "Mortgages",
            "mortgage",
            <Home className="h-4 w-4 text-muted-foreground" />,
            data.mortgage
          )}
          {renderSection(
            "Other Loans",
            "other",
            <Wallet className="h-4 w-4 text-muted-foreground" />,
            data.other
          )}
        </div>
      )}

      {/* Footer Advisory */}
      <div className="rounded-lg border p-3 text-[10px] text-muted-foreground">
        Admin only. Manual actions required. No automatic refresh. All balances
        shown are reported "as of" fetch time — not live data. All operations
        logged with request_id for audit provenance.
      </div>
    </div>
  );
}

export default LiabilitiesPanel;
