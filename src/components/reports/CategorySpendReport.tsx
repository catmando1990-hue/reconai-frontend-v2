"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { Download, RefreshCw } from "lucide-react";

type Transaction = {
  id: string;
  date: string;
  amount: number;
  category: string[] | string | null;
};

type CategoryTotal = {
  category: string;
  total: number;
  count: number;
  percentOfTotal: number;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(amount));
}

function getCategory(cat: string[] | string | null): string {
  if (!cat) return "Uncategorized";
  if (Array.isArray(cat)) return cat[0] || "Uncategorized";
  return cat;
}

export function CategorySpendReport() {
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

  const { categoryTotals, totalSpend } = useMemo(() => {
    // Only count outflows (negative amounts = spending)
    const outflows = transactions.filter((tx) => tx.amount < 0);
    const totalSpend = outflows.reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0,
    );

    const categoryMap = new Map<string, { total: number; count: number }>();

    for (const tx of outflows) {
      const cat = getCategory(tx.category);
      const existing = categoryMap.get(cat) || { total: 0, count: 0 };
      existing.total += Math.abs(tx.amount);
      existing.count += 1;
      categoryMap.set(cat, existing);
    }

    const categoryTotals: CategoryTotal[] = Array.from(categoryMap.entries())
      .map(([category, { total, count }]) => ({
        category,
        total,
        count,
        percentOfTotal: totalSpend > 0 ? (total / totalSpend) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return { categoryTotals, totalSpend };
  }, [transactions]);

  const handleExportCSV = () => {
    if (categoryTotals.length === 0) return;

    const headers = [
      "Category",
      "Total Spend",
      "Transaction Count",
      "% of Total",
    ];
    const rows = categoryTotals.map((cat) => [
      cat.category,
      cat.total.toFixed(2),
      cat.count.toString(),
      cat.percentOfTotal.toFixed(1) + "%",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `category-spend-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold">Category Spend Report</h3>
          <p className="text-xs text-muted-foreground">
            Aggregated spending by category • Expense analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={categoryTotals.length === 0}
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

      {!loading && !error && categoryTotals.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          No spending transactions found.
        </div>
      )}

      {!loading && !error && categoryTotals.length > 0 && (
        <>
          {/* Summary */}
          <div className="border-b bg-muted/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Spend</span>
              <span className="text-lg font-semibold">
                {formatCurrency(totalSpend)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                {categoryTotals.length} categories •{" "}
                {transactions.filter((t) => t.amount < 0).length} transactions
              </span>
            </div>
          </div>

          {/* Category List */}
          <div className="divide-y">
            {categoryTotals.map((cat) => (
              <div key={cat.category} className="px-4 py-3 hover:bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{cat.category}</div>
                    <div className="text-xs text-muted-foreground">
                      {cat.count} transaction{cat.count !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-mono font-medium">
                      {formatCurrency(cat.total)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cat.percentOfTotal.toFixed(1)}%
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{ width: `${Math.min(cat.percentOfTotal, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
