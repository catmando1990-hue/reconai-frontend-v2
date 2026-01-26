"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { Download, RefreshCw } from "lucide-react";

type Transaction = {
  id: string;
  date: string;
  merchant_name: string | null;
  name: string | null;
  amount: number;
};

type Counterparty = {
  name: string;
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  transactionCount: number;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(amount));
}

export function CounterpartyReport() {
  const { apiFetch } = useApi();
  const { isLoaded } = useOrg();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"volume" | "frequency">("volume");

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

  const counterparties = useMemo(() => {
    const map = new Map<
      string,
      { inflow: number; outflow: number; count: number }
    >();

    for (const tx of transactions) {
      const name = tx.merchant_name || tx.name || "Unknown";
      const existing = map.get(name) || { inflow: 0, outflow: 0, count: 0 };

      if (tx.amount > 0) {
        existing.inflow += tx.amount;
      } else {
        existing.outflow += Math.abs(tx.amount);
      }
      existing.count += 1;
      map.set(name, existing);
    }

    const result: Counterparty[] = Array.from(map.entries()).map(
      ([name, { inflow, outflow, count }]) => ({
        name,
        totalInflow: inflow,
        totalOutflow: outflow,
        netFlow: inflow - outflow,
        transactionCount: count,
      }),
    );

    if (sortBy === "volume") {
      result.sort(
        (a, b) =>
          b.totalInflow + b.totalOutflow - (a.totalInflow + a.totalOutflow),
      );
    } else {
      result.sort((a, b) => b.transactionCount - a.transactionCount);
    }

    return result.slice(0, 50); // Top 50
  }, [transactions, sortBy]);

  const handleExportCSV = () => {
    if (counterparties.length === 0) return;

    const headers = [
      "Counterparty",
      "Total Inflow",
      "Total Outflow",
      "Net Flow",
      "Transaction Count",
    ];
    const rows = counterparties.map((cp) => [
      `"${cp.name}"`,
      cp.totalInflow.toFixed(2),
      cp.totalOutflow.toFixed(2),
      cp.netFlow.toFixed(2),
      cp.transactionCount.toString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `counterparties-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold">Counterparty Report</h3>
          <p className="text-xs text-muted-foreground">
            Who money flows to and from • Top 50 by {sortBy}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "volume" | "frequency")
            }
            className="rounded-lg border bg-background px-2 py-1 text-xs"
          >
            <option value="volume">Sort by Volume</option>
            <option value="frequency">Sort by Frequency</option>
          </select>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={counterparties.length === 0}
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

      {!loading && !error && counterparties.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          No counterparties found.
        </div>
      )}

      {!loading && !error && counterparties.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Counterparty</th>
                <th className="px-4 py-2 font-medium text-right">Inflows</th>
                <th className="px-4 py-2 font-medium text-right">Outflows</th>
                <th className="px-4 py-2 font-medium text-right">Net</th>
                <th className="px-4 py-2 font-medium text-right">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {counterparties.map((cp, i) => (
                <tr key={`${cp.name}-${i}`} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5">
                    <div className="max-w-[200px] truncate font-medium">
                      {cp.name}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-emerald-600">
                    {cp.totalInflow > 0
                      ? `+${formatCurrency(cp.totalInflow)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-destructive">
                    {cp.totalOutflow > 0
                      ? `-${formatCurrency(cp.totalOutflow)}`
                      : "—"}
                  </td>
                  <td
                    className={[
                      "px-4 py-2.5 text-right font-mono font-medium",
                      cp.netFlow >= 0 ? "text-emerald-600" : "text-destructive",
                    ].join(" ")}
                  >
                    {cp.netFlow >= 0 ? "+" : "-"}
                    {formatCurrency(cp.netFlow)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    {cp.transactionCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
