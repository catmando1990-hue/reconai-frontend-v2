"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { Download, RefreshCw, Wallet } from "lucide-react";

type Transaction = {
  id: string;
  date: string;
  amount: number;
  account_id: string;
  account_name?: string;
  pending: boolean;
};

type AccountSummary = {
  account_id: string;
  account_name: string;
  inflows: number;
  outflows: number;
  netChange: number;
  transactionCount: number;
  firstTxDate: string | null;
  lastTxDate: string | null;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(amount));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AccountActivityReport() {
  const { apiFetch } = useApi();
  const { isLoaded } = useOrg();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Transaction[]>("/api/transactions");
      setTransactions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!isLoaded) return;
    fetchData();
  }, [isLoaded, fetchData]);

  const accountSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        inflows: number;
        outflows: number;
        count: number;
        dates: string[];
      }
    >();

    for (const tx of transactions) {
      const key = tx.account_id;
      const existing = map.get(key) || {
        name: tx.account_name || tx.account_id.slice(-8),
        inflows: 0,
        outflows: 0,
        count: 0,
        dates: [],
      };

      if (tx.amount > 0) {
        existing.inflows += tx.amount;
      } else {
        existing.outflows += Math.abs(tx.amount);
      }
      existing.count += 1;
      existing.dates.push(tx.date);
      map.set(key, existing);
    }

    const summaries: AccountSummary[] = Array.from(map.entries()).map(
      ([account_id, data]) => {
        const sortedDates = [...data.dates].sort();
        return {
          account_id,
          account_name: data.name,
          inflows: data.inflows,
          outflows: data.outflows,
          netChange: data.inflows - data.outflows,
          transactionCount: data.count,
          firstTxDate: sortedDates[0] || null,
          lastTxDate: sortedDates[sortedDates.length - 1] || null,
        };
      },
    );

    // Sort by transaction count descending
    summaries.sort((a, b) => b.transactionCount - a.transactionCount);

    return summaries;
  }, [transactions]);

  const handleExportCSV = () => {
    if (accountSummaries.length === 0) return;

    const headers = [
      "Account",
      "Inflows",
      "Outflows",
      "Net Change",
      "Transaction Count",
      "First Transaction",
      "Last Transaction",
    ];
    const rows = accountSummaries.map((acc) => [
      `"${acc.account_name}"`,
      acc.inflows.toFixed(2),
      acc.outflows.toFixed(2),
      acc.netChange.toFixed(2),
      acc.transactionCount.toString(),
      acc.firstTxDate || "",
      acc.lastTxDate || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `account-activity-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totals = useMemo(() => {
    return accountSummaries.reduce(
      (acc, curr) => ({
        inflows: acc.inflows + curr.inflows,
        outflows: acc.outflows + curr.outflows,
        netChange: acc.netChange + curr.netChange,
        count: acc.count + curr.transactionCount,
      }),
      { inflows: 0, outflows: 0, netChange: 0, count: 0 },
    );
  }, [accountSummaries]);

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold">Account Activity Report</h3>
          <p className="text-xs text-muted-foreground">
            Per-account transaction summaries • Bank reconciliation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={accountSummaries.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs hover:bg-muted/50 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="px-4 py-8 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && accountSummaries.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          No account activity found.
        </div>
      )}

      {!loading && !error && accountSummaries.length > 0 && (
        <>
          {/* Totals Summary */}
          <div className="grid grid-cols-4 gap-4 border-b bg-muted/20 px-4 py-3">
            <div>
              <div className="text-xs text-muted-foreground">Total Inflows</div>
              <div className="font-mono text-sm font-semibold text-emerald-600">
                +{formatCurrency(totals.inflows)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Total Outflows
              </div>
              <div className="font-mono text-sm font-semibold text-destructive">
                -{formatCurrency(totals.outflows)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Net Change</div>
              <div
                className={[
                  "font-mono text-sm font-semibold",
                  totals.netChange >= 0
                    ? "text-emerald-600"
                    : "text-destructive",
                ].join(" ")}
              >
                {totals.netChange >= 0 ? "+" : "-"}
                {formatCurrency(totals.netChange)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Transactions</div>
              <div className="text-sm font-semibold">{totals.count}</div>
            </div>
          </div>

          {/* Account List */}
          <div className="divide-y">
            {accountSummaries.map((acc) => (
              <div key={acc.account_id} className="px-4 py-4 hover:bg-muted/20">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium truncate">
                        {acc.account_name}
                      </div>
                      <div
                        className={[
                          "font-mono text-sm font-semibold",
                          acc.netChange >= 0
                            ? "text-emerald-600"
                            : "text-destructive",
                        ].join(" ")}
                      >
                        {acc.netChange >= 0 ? "+" : "-"}
                        {formatCurrency(acc.netChange)}
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-4 gap-4 text-xs">
                      <div>
                        <div className="text-muted-foreground">Inflows</div>
                        <div className="font-mono text-emerald-600">
                          +{formatCurrency(acc.inflows)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Outflows</div>
                        <div className="font-mono text-destructive">
                          -{formatCurrency(acc.outflows)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">
                          Transactions
                        </div>
                        <div>{acc.transactionCount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Period</div>
                        <div>
                          {acc.firstTxDate && acc.lastTxDate
                            ? `${formatDate(acc.firstTxDate)} – ${formatDate(acc.lastTxDate)}`
                            : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Activity bar */}
                    {(acc.inflows > 0 || acc.outflows > 0) && (
                      <div className="mt-2 flex h-1.5 rounded-full overflow-hidden bg-muted">
                        <div
                          className="bg-emerald-500"
                          style={{
                            width: `${
                              (acc.inflows / (acc.inflows + acc.outflows)) * 100
                            }%`,
                          }}
                        />
                        <div
                          className="bg-destructive"
                          style={{
                            width: `${
                              (acc.outflows / (acc.inflows + acc.outflows)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Note */}
      <div className="border-t bg-muted/20 px-4 py-2">
        <p className="text-[10px] text-muted-foreground">
          Opening/closing balances require Plaid Balance product. Currently
          showing net changes from transaction history only.
        </p>
      </div>
    </div>
  );
}
