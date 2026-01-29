"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useOrg } from "@/lib/org-context";
import { useFinancialEvidence } from "@/lib/financial-evidence-context";
import { auditedFetch } from "@/lib/auditedFetch";
import {
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Clock,
  Building2,
  ArrowUpDown,
  Calendar,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

type Holding = {
  holding_id: string;
  account_id: string;
  institution_name: string;
  account_name: string;
  account_mask: string;
  security_id: string;
  security_name: string;
  ticker_symbol: string | null;
  security_type: string;
  quantity: number;
  price_as_of: number;
  value_as_of: number;
  cost_basis: number | null;
  as_of: string;
};

type InvestmentTransaction = {
  transaction_id: string;
  account_id: string;
  institution_name: string;
  account_name: string;
  account_mask: string;
  security_id: string;
  security_name: string;
  ticker_symbol: string | null;
  date: string;
  type: string;
  subtype: string | null;
  quantity: number | null;
  price: number | null;
  amount: number;
  fees: number | null;
};

type HoldingsResponse = {
  ok: boolean;
  holdings: Holding[];
  accounts: Array<{
    account_id: string;
    institution_name: string;
    account_name: string;
    account_mask: string;
    account_type: string;
    reported_balance: number;
  }>;
  total_value: number;
  fetched_at: string;
  error?: string;
  request_id: string;
};

type TransactionsResponse = {
  ok: boolean;
  transactions: InvestmentTransaction[];
  start_date: string;
  end_date: string;
  total_count: number;
  fetched_at: string;
  error?: string;
  request_id: string;
};

type RefreshResponse = {
  ok: boolean;
  refreshed_at?: string;
  status?: string;
  accounts_updated?: number;
  error?: string;
  request_id: string;
};

type ActionState = {
  status: "idle" | "loading" | "success" | "error";
  error?: string;
  requestId?: string;
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

function formatQuantity(qty: number | null): string {
  if (qty === null) return "—";
  return qty.toLocaleString("en-US", { maximumFractionDigits: 4 });
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

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * InvestmentsPanel — Read-only investments view with holdings and transactions
 *
 * Phase 8C Requirements:
 * - RBAC gated: Only visible to admin or org:admin roles
 * - Manual actions only (NO auto-fetch, NO polling, NO auto-refresh)
 * - Holdings: Institution, Account, Security, Quantity, Value, As-of timestamp
 * - Transactions: Date-bounded view, read-only
 * - Refresh: Manual action with timestamp + status
 * - Uses "As of" language, never "Current", "Live", "Real-time"
 * - All errors include request_id
 */
export function InvestmentsPanel() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: orgLoaded } = useOrg();
  const evidenceContext = useFinancialEvidence();

  // Active tab
  const [activeTab, setActiveTab] = useState<"holdings" | "transactions">(
    "holdings",
  );

  // Holdings state
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [holdingsTotal, setHoldingsTotal] = useState<number>(0);
  const [holdingsFetchedAt, setHoldingsFetchedAt] = useState<string | null>(
    null,
  );
  const [holdingsState, setHoldingsState] = useState<ActionState>({
    status: "idle",
  });

  // Transactions state
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [txStartDate, setTxStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [txEndDate, setTxEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [txFetchedAt, setTxFetchedAt] = useState<string | null>(null);
  const [transactionsState, setTransactionsState] = useState<ActionState>({
    status: "idle",
  });

  // Refresh state
  const [refreshState, setRefreshState] = useState<ActionState>({
    status: "idle",
  });
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

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

    // Report loaded state when either holdings or transactions have been loaded
    const loaded =
      holdingsState.status === "success" ||
      transactionsState.status === "success";

    evidenceContext.updateInvestments({
      loaded,
      holdingsLoaded: holdingsState.status === "success",
      transactionsLoaded: transactionsState.status === "success",
      holdingsFetchedAt: holdingsFetchedAt,
      transactionsFetchedAt: txFetchedAt,
      refreshedAt: lastRefreshedAt,
    });
  }, [
    evidenceContext,
    holdingsState.status,
    transactionsState.status,
    holdingsFetchedAt,
    txFetchedAt,
    lastRefreshedAt,
  ]);

  // Don't render until auth is loaded
  if (!userLoaded || !orgLoaded) return null;

  // RBAC: Hide completely if not admin
  if (!isAdmin) return null;

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleLoadHoldings = async () => {
    if (holdingsState.status === "loading") return;

    setHoldingsState({ status: "loading" });
    setHoldings([]);

    try {
      const res = await auditedFetch<Response>(
        "/api/plaid/investments/holdings/get",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          rawResponse: true,
        },
      );

      const reqId = res.headers.get("x-request-id");
      const json: HoldingsResponse = await res.json();

      if (!json.ok || !res.ok) {
        setHoldingsState({
          status: "error",
          error: json.error || `Failed to load holdings (${res.status})`,
          requestId: reqId || undefined,
        });
        return;
      }

      setHoldings(json.holdings || []);
      setHoldingsTotal(json.total_value || 0);
      setHoldingsFetchedAt(json.fetched_at);
      setHoldingsState({ status: "success", requestId: reqId || undefined });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setHoldingsState({ status: "error", error: message });
    }
  };

  const handleLoadTransactions = async () => {
    if (transactionsState.status === "loading") return;

    setTransactionsState({ status: "loading" });
    setTransactions([]);

    try {
      const res = await auditedFetch<Response>(
        "/api/plaid/investments/transactions/get",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start_date: txStartDate,
            end_date: txEndDate,
          }),
          rawResponse: true,
        },
      );

      const reqId = res.headers.get("x-request-id");
      const json: TransactionsResponse = await res.json();

      if (!json.ok || !res.ok) {
        setTransactionsState({
          status: "error",
          error: json.error || `Failed to load transactions (${res.status})`,
          requestId: reqId || undefined,
        });
        return;
      }

      setTransactions(json.transactions || []);
      setTxFetchedAt(json.fetched_at);
      setTransactionsState({
        status: "success",
        requestId: reqId || undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setTransactionsState({ status: "error", error: message });
    }
  };

  const handleRefresh = async () => {
    if (refreshState.status === "loading") return;

    setRefreshState({ status: "loading" });

    try {
      const res = await auditedFetch<Response>(
        "/api/plaid/investments/refresh",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          rawResponse: true,
        },
      );

      const reqId = res.headers.get("x-request-id");
      const json: RefreshResponse = await res.json();

      if (!json.ok || !res.ok) {
        setRefreshState({
          status: "error",
          error: json.error || `Failed to refresh investments (${res.status})`,
          requestId: reqId || undefined,
        });
        return;
      }

      setLastRefreshedAt(json.refreshed_at || new Date().toISOString());
      setRefreshState({ status: "success", requestId: reqId || undefined });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setRefreshState({ status: "error", error: message });
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Investments</h2>
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            Source: Plaid
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Read-only investment holdings and transactions. Manual actions only.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
        <strong>Disclaimer:</strong> Values shown are as of the fetch time. This
        is not live market data and may differ from actual portfolio value.
      </div>

      {/* Refresh Section */}
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshState.status === "loading"}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {refreshState.status === "loading" ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Refresh Investments
            </>
          )}
        </button>

        {lastRefreshedAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Refreshed as of {formatTimestamp(lastRefreshedAt)}</span>
          </div>
        )}

        {refreshState.status === "error" && (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>{refreshState.error}</span>
            {refreshState.requestId && (
              <span className="font-mono text-muted-foreground">
                ({refreshState.requestId.slice(0, 8)}...)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("holdings")}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "holdings"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Holdings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("transactions")}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "transactions"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Transactions
          </button>
        </div>
      </div>

      {/* Holdings Tab */}
      {activeTab === "holdings" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void handleLoadHoldings()}
              disabled={holdingsState.status === "loading"}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {holdingsState.status === "loading" ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Load Holdings
                </>
              )}
            </button>

            {holdingsFetchedAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>As of {formatTimestamp(holdingsFetchedAt)}</span>
              </div>
            )}
          </div>

          {/* Holdings Error */}
          {holdingsState.status === "error" && holdingsState.error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">
                    {holdingsState.error}
                  </p>
                  {holdingsState.requestId && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      request_id: {holdingsState.requestId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Holdings Summary */}
          {holdingsState.status === "success" && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Portfolio Value (As of Fetch)
                </span>
                <span className="text-lg font-semibold">
                  {formatCurrency(holdingsTotal)}
                </span>
              </div>
            </div>
          )}

          {/* Holdings Empty */}
          {holdingsState.status === "success" && holdings.length === 0 && (
            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
              No investment holdings found. Connect investment accounts to see
              them here.
            </div>
          )}

          {/* Holdings Table */}
          {holdingsState.status === "success" && holdings.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr className="text-left">
                    <th className="p-3 font-medium">Institution</th>
                    <th className="p-3 font-medium">Account</th>
                    <th className="p-3 font-medium">Security</th>
                    <th className="p-3 font-medium text-right">Quantity</th>
                    <th className="p-3 font-medium text-right">
                      Value (As Of)
                    </th>
                    <th className="p-3 font-medium text-right">As Of</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding) => (
                    <tr key={holding.holding_id} className="border-t">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{holding.institution_name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>{holding.account_name}</div>
                        <div className="text-xs text-muted-foreground">
                          ****{holding.account_mask}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>{holding.security_name}</div>
                        {holding.ticker_symbol && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {holding.ticker_symbol}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {formatQuantity(holding.quantity)}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(holding.value_as_of)}
                      </td>
                      <td className="p-3 text-right text-xs text-muted-foreground">
                        {formatDate(holding.as_of)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          {/* Date Range */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm text-muted-foreground">From:</label>
              <input
                type="date"
                value={txStartDate}
                onChange={(e) => setTxStartDate(e.target.value)}
                className="rounded border border-border bg-background px-2 py-1 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">To:</label>
              <input
                type="date"
                value={txEndDate}
                onChange={(e) => setTxEndDate(e.target.value)}
                className="rounded border border-border bg-background px-2 py-1 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => void handleLoadTransactions()}
              disabled={transactionsState.status === "loading"}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {transactionsState.status === "loading" ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ArrowUpDown className="h-4 w-4" />
                  Load Transactions
                </>
              )}
            </button>

            {txFetchedAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>As of {formatTimestamp(txFetchedAt)}</span>
              </div>
            )}
          </div>

          {/* Transactions Error */}
          {transactionsState.status === "error" && transactionsState.error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">
                    {transactionsState.error}
                  </p>
                  {transactionsState.requestId && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      request_id: {transactionsState.requestId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Transactions Empty */}
          {transactionsState.status === "success" &&
            transactions.length === 0 && (
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                No investment transactions found for the selected date range.
              </div>
            )}

          {/* Transactions Table */}
          {transactionsState.status === "success" &&
            transactions.length > 0 && (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr className="text-left">
                      <th className="p-3 font-medium">Date</th>
                      <th className="p-3 font-medium">Account</th>
                      <th className="p-3 font-medium">Security</th>
                      <th className="p-3 font-medium">Type</th>
                      <th className="p-3 font-medium text-right">Quantity</th>
                      <th className="p-3 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.transaction_id} className="border-t">
                        <td className="p-3 whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="p-3">
                          <div>{tx.account_name}</div>
                          <div className="text-xs text-muted-foreground">
                            ****{tx.account_mask}
                          </div>
                        </td>
                        <td className="p-3">
                          <div>{tx.security_name}</div>
                          {tx.ticker_symbol && (
                            <div className="text-xs text-muted-foreground font-mono">
                              {tx.ticker_symbol}
                            </div>
                          )}
                        </td>
                        <td className="p-3 capitalize text-muted-foreground">
                          {tx.type}
                          {tx.subtype && ` (${tx.subtype})`}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {formatQuantity(tx.quantity)}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}

      {/* Footer Advisory */}
      <div className="rounded-lg border p-3 text-[10px] text-muted-foreground">
        Admin only. Manual actions required. No automatic refresh. All values
        shown are &quot;as of&quot; fetch time — not live market data. All
        operations logged with request_id for audit provenance.
      </div>
    </div>
  );
}

export default InvestmentsPanel;
