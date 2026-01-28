"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { Download } from "lucide-react";
import { auditedFetch } from "@/lib/auditedFetch";

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

      const data = await auditedFetch<{
        ok: boolean;
        data?: CategoryRow[];
        summary?: Summary;
        error?: { message?: string };
        request_id: string;
      }>(`/api/reports/category-spend?${params.toString()}`, {
        skipBodyValidation: true,
      });

      if (!data.ok) {
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
    const csvRows = rows.map((r) => [
      r.category,
      r.total,
      r.count,
      r.percent_of_total,
    ]);

    const csv = [headers, ...csvRows]
      .map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `category-spend-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxTotal = rows.length > 0 ? Math.max(...rows.map((r) => r.total)) : 0;

  return (
    <RouteShell
      title="Category Spend"
      subtitle="Aggregated spending by category"
    >
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white/50 dark:bg-[#18181b]/50 p-4">
        <div>
          <label className="block text-xs text-[#6b7280] dark:text-[#a1a1aa] mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => updateParams({ start_date: e.target.value })}
            className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-3 py-1.5 text-sm text-[#111827] dark:text-[#f9fafb]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#6b7280] dark:text-[#a1a1aa] mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => updateParams({ end_date: e.target.value })}
            className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-3 py-1.5 text-sm text-[#111827] dark:text-[#f9fafb]"
          />
        </div>
        <button
          type="button"
          onClick={() => updateParams({ start_date: null, end_date: null })}
          className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-3 py-1.5 text-sm text-[#111827] dark:text-[#f9fafb] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors"
        >
          Clear Filters
        </button>
        <div className="ml-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-3 py-1.5 text-sm text-[#111827] dark:text-[#f9fafb] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] disabled:opacity-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary */}
      {!loading && summary && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white/50 dark:bg-[#18181b]/50 p-4">
            <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">Total Spend</div>
            <div className="mt-1 text-2xl font-semibold text-[#111827] dark:text-[#f9fafb]">
              {formatCurrency(summary.total_spend)}
            </div>
          </div>
          <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white/50 dark:bg-[#18181b]/50 p-4">
            <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">Categories</div>
            <div className="mt-1 text-2xl font-semibold text-[#111827] dark:text-[#f9fafb]">
              {summary.category_count}
            </div>
          </div>
          <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white/50 dark:bg-[#18181b]/50 p-4">
            <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">Transactions</div>
            <div className="mt-1 text-2xl font-semibold text-[#111827] dark:text-[#f9fafb]">
              {summary.transaction_count}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-[#dc2626]/50 dark:border-[#ef4444]/50 bg-[#dc2626]/10 dark:bg-[#ef4444]/10 p-4 text-sm text-[#dc2626] dark:text-[#ef4444]">
          {error}
        </div>
      )}

      {/* Category List with Visual Bars */}
      <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b]">
        <div className="border-b border-[#e5e7eb] dark:border-[#27272a] px-4 py-3">
          <h3 className="font-semibold text-[#111827] dark:text-[#f9fafb]">Spending by Category</h3>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-[#f9fafb] dark:bg-[#27272a]" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-12 text-center text-[#6b7280] dark:text-[#a1a1aa]">
            No spending data found
          </div>
        ) : (
          <div className="divide-y divide-[#e5e7eb] dark:divide-[#27272a]">
            {rows.map((row, i) => (
              <div key={row.category} className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#6b7280] dark:text-[#a1a1aa] w-6">
                      {i + 1}.
                    </span>
                    <span className="font-medium text-[#111827] dark:text-[#f9fafb]">{row.category}</span>
                    <span className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">
                      ({row.count} txns)
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">
                      {row.percent_of_total}%
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-[#111827] dark:text-[#f9fafb]">
                      {formatCurrency(row.total)}
                    </span>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="h-2 rounded-full bg-[#f3f4f6] dark:bg-[#27272a] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#4f46e5]/70 dark:bg-[#6366f1]/70 transition-all"
                    style={{
                      width: `${maxTotal > 0 ? (row.total / maxTotal) * 100 : 0}%`,
                    }}
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
