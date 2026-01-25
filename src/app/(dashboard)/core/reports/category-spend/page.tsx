"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { Download } from "lucide-react";

type CategoryRow = {
  category: string;
  total: number;
  count: number;
  percent_of_total: number;
};

type Summary = {
  total_spend: number;
  category_count: number;
  transaction_count: number;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function CategorySpendReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startDate = searchParams.get("start_date") || "";
  const endDate = searchParams.get("end_date") || "";

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);

      const res = await fetch(`/api/reports/category-spend?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error?.message || "Failed to load report");
      }

      setRows(data.data || []);
      setSummary(data.summary || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.push(`/core/reports/category-spend?${params.toString()}`);
  };

  const handleExportCSV = () => {
    if (rows.length === 0) return;

    const headers = ["Category", "Total", "Transactions", "% of Total"];
    const csvRows = rows.map((r) => [r.category, r.total, r.count, r.percent_of_total]);

    const csv = [headers, ...csvRows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `category-spend-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate max for bar chart scaling
  const maxTotal = rows.length > 0 ? Math.max(...rows.map((r) => r.total)) : 0;

  return (
    <RouteShell
      title="Category Spend"
      subtitle="Aggregated spending by category"
      breadcrumbs={[
        { label: "Reports", href: "/core/reports" },
        { label: "Category Spend" },
      ]}
    >
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card/50 p-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => updateParams({ start_date: e.target.value })}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => updateParams({ end_date: e.target.value })}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => updateParams({ start_date: null, end_date: null })}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
        >
          Clear Filters
        </button>
        <div className="ml-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary */}
      {!loading && summary && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="text-xs text-muted-foreground">Total Spend</div>
            <div className="mt-1 text-2xl font-semibold">{formatCurrency(summary.total_spend)}</div>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="text-xs text-muted-foreground">Categories</div>
            <div className="mt-1 text-2xl font-semibold">{summary.category_count}</div>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="text-xs text-muted-foreground">Transactions</div>
            <div className="mt-1 text-2xl font-semibold">{summary.transaction_count}</div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Category List with Visual Bars */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-semibold">Spending by Category</h3>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground">
            No spending data found
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((row, i) => (
              <div key={row.category} className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                    <span className="font-medium">{row.category}</span>
                    <span className="text-xs text-muted-foreground">({row.count} txns)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">{row.percent_of_total}%</span>
                    <span className="font-mono font-semibold tabular-nums">{formatCurrency(row.total)}</span>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-all"
                    style={{ width: `${maxTotal > 0 ? (row.total / maxTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RouteShell>
  );
}
