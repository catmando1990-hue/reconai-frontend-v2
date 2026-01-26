"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import {
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

type BalancePoint = {
  date: string;
  balance: number;
  account_id: string;
  account_name: string;
};

type BalanceHistoryResponse = {
  history: BalancePoint[];
  accounts: Array<{
    id: string;
    name: string;
    current_balance: number;
  }>;
  request_id: string;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BalanceHistoryReport() {
  const { apiFetch } = useApi();
  const { isLoaded } = useOrg();

  const [history, setHistory] = useState<BalancePoint[]>([]);
  const [accounts, setAccounts] = useState<
    Array<{ id: string; name: string; current_balance: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<BalanceHistoryResponse>(
        "/api/reports/balance-history",
      );
      setHistory(data.history || []);
      setAccounts(data.accounts || []);
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

  const filteredHistory = useMemo(() => {
    if (selectedAccount === "all") return history;
    return history.filter((h) => h.account_id === selectedAccount);
  }, [history, selectedAccount]);

  // Group by date for combined view
  const groupedByDate = useMemo(() => {
    const dateMap = new Map<string, number>();
    for (const point of filteredHistory) {
      const existing = dateMap.get(point.date) || 0;
      dateMap.set(point.date, existing + point.balance);
    }
    return Array.from(dateMap.entries())
      .map(([date, balance]) => ({ date, balance }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredHistory]);

  const totalCurrentBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.current_balance, 0);
  }, [accounts]);

  const balanceChange = useMemo(() => {
    if (groupedByDate.length < 2) return null;
    const latest = groupedByDate[0]?.balance || 0;
    const earliest = groupedByDate[groupedByDate.length - 1]?.balance || 0;
    return latest - earliest;
  }, [groupedByDate]);

  const handleExportCSV = () => {
    if (groupedByDate.length === 0) return;

    const headers = ["Date", "Balance"];
    const rows = groupedByDate.map((h) => [h.date, h.balance.toFixed(2)]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `balance-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold">Balance History Report</h3>
          <p className="text-xs text-muted-foreground">
            Historical balance changes over time
          </p>
        </div>
        <div className="flex items-center gap-2">
          {accounts.length > 1 && (
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="rounded-lg border bg-background px-2 py-1 text-xs"
            >
              <option value="all">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => void fetchData()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs hover:bg-muted/50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={groupedByDate.length === 0}
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

      {!loading && !error && groupedByDate.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          No balance history available.
        </div>
      )}

      {!loading && !error && groupedByDate.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 border-b bg-muted/20 px-4 py-3">
            <div>
              <div className="text-xs text-muted-foreground">
                Current Balance
              </div>
              <div className="font-mono text-lg font-semibold">
                {formatCurrency(totalCurrentBalance)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Period Change</div>
              <div className="flex items-center gap-1">
                {balanceChange !== null && (
                  <>
                    {balanceChange > 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    ) : balanceChange < 0 ? (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span
                      className={`font-mono text-lg font-semibold ${
                        balanceChange >= 0
                          ? "text-emerald-600"
                          : "text-destructive"
                      }`}
                    >
                      {balanceChange >= 0 ? "+" : ""}
                      {formatCurrency(balanceChange)}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Data Points</div>
              <div className="text-lg font-semibold">
                {groupedByDate.length}
              </div>
            </div>
          </div>

          {/* Balance History Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium text-right">Balance</th>
                  <th className="px-4 py-2 font-medium text-right">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {groupedByDate.map((point, idx) => {
                  const prevPoint = groupedByDate[idx + 1];
                  const change = prevPoint
                    ? point.balance - prevPoint.balance
                    : null;
                  return (
                    <tr key={point.date} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5">{formatDate(point.date)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {formatCurrency(point.balance)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {change !== null ? (
                          <span
                            className={
                              change >= 0
                                ? "text-emerald-600"
                                : "text-destructive"
                            }
                          >
                            {change >= 0 ? "+" : ""}
                            {formatCurrency(change)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Note */}
      <div className="border-t bg-muted/20 px-4 py-2">
        <p className="text-[10px] text-muted-foreground">
          Balance history is computed from transaction data. End-of-day balances
          may differ from bank statements due to pending transactions.
        </p>
      </div>
    </div>
  );
}
