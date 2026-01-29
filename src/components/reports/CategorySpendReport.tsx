"use client";

import { useEffect, useState, useCallback } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { Download, RefreshCw, PieChart } from "lucide-react";

type CategoryItem = {
  category: string;
  amount: number;
  transaction_count: number;
  percentage: number;
  change_from_previous?: number;
};

type TopMerchant = {
  merchant: string;
  category: string;
  amount: number;
  transaction_count: number;
};

type CategorySpendData = {
  start_date: string;
  end_date: string;
  total_spend: number;
  categories: CategoryItem[];
  top_merchants: TopMerchant[];
};

type CategorySpendResponse = {
  data: CategorySpendData;
  request_id: string;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(amount));
}

function AwaitingDataState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <PieChart className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">Awaiting Data</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        Spending breakdown by category will appear here once transaction data is
        available. Connect a bank account to start tracking expenses.
      </p>
    </div>
  );
}

export function CategorySpendReport() {
  const { apiFetch } = useApi();
  const { isLoaded } = useOrg();

  const [data, setData] = useState<CategorySpendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"30" | "60" | "90">("30");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<CategorySpendResponse>(
        `/api/reports/category-spend?days=${period}`
      );
      // Handle both response formats
      const reportData =
        response?.data ?? (response as unknown as CategorySpendData);
      setData(reportData);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, period]);

  useEffect(() => {
    if (!isLoaded) return;
    fetchData();
  }, [isLoaded, fetchData]);

  const handleExportCSV = () => {
    if (!data || data.categories.length === 0) return;

    const headers = [
      "Category",
      "Total Spend",
      "Transaction Count",
      "% of Total",
    ];
    const rows = data.categories.map((cat) => [
      cat.category,
      cat.amount.toFixed(2),
      cat.transaction_count.toString(),
      cat.percentage.toFixed(1) + "%",
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

  const hasData = data && data.categories.length > 0;

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold">Category Spend Report</h3>
          <p className="text-xs text-muted-foreground">
            Aggregated spending by category
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="rounded-lg border bg-background px-2 py-1 text-xs"
          >
            <option value="30">Last 30 Days</option>
            <option value="60">Last 60 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
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
            disabled={!hasData}
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
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-destructive mb-3">{error}</p>
          <button
            type="button"
            onClick={() => void fetchData()}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs hover:bg-muted/50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {!loading && !error && !hasData && <AwaitingDataState />}

      {!loading && !error && hasData && data && (
        <>
          {/* Summary */}
          <div className="border-b bg-muted/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Spend</span>
              <span className="text-lg font-semibold">
                {formatCurrency(data.total_spend)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                {data.categories.length} categories •{" "}
                {data.categories.reduce((sum, c) => sum + c.transaction_count, 0)}{" "}
                transactions
              </span>
            </div>
          </div>

          {/* Category List */}
          <div className="divide-y">
            {data.categories.map((cat) => (
              <div key={cat.category} className="px-4 py-3 hover:bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{cat.category}</div>
                    <div className="text-xs text-muted-foreground">
                      {cat.transaction_count} transaction
                      {cat.transaction_count !== 1 ? "s" : ""}
                      {cat.change_from_previous !== undefined && (
                        <span
                          className={`ml-2 ${
                            cat.change_from_previous >= 0
                              ? "text-destructive"
                              : "text-emerald-600"
                          }`}
                        >
                          {cat.change_from_previous >= 0 ? "+" : ""}
                          {cat.change_from_previous.toFixed(1)}% vs prior
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-mono font-medium">
                      {formatCurrency(cat.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cat.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Top Merchants */}
          {data.top_merchants && data.top_merchants.length > 0 && (
            <div className="border-t p-4">
              <h4 className="text-sm font-semibold mb-3">Top Merchants</h4>
              <div className="space-y-2">
                {data.top_merchants.slice(0, 5).map((merchant, idx) => (
                  <div
                    key={`${merchant.merchant}-${idx}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{merchant.merchant}</div>
                      <div className="text-xs text-muted-foreground">
                        {merchant.category}
                      </div>
                    </div>
                    <div className="font-mono text-sm ml-4">
                      {formatCurrency(merchant.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
