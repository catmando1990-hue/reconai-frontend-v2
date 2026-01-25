"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { ChevronLeft, ChevronRight, Download, Filter } from "lucide-react";

type LedgerRow = {
  id: string;
  transaction_id: string;
  date: string;
  merchant: string | null;
  description: string | null;
  amount: number;
  account_id: string;
  account_name: string | null;
  category: string;
  subcategory: string | null;
  source: string;
  status: string;
  iso_currency_code: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
};

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    signDisplay: "auto",
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function LedgerReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters from URL
  const page = parseInt(searchParams.get("page") || "1", 10);
  const startDate = searchParams.get("start_date") || "";
  const endDate = searchParams.get("end_date") || "";

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "50");
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);

      const res = await fetch(`/api/reports/ledger?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error?.message || "Failed to load report");
      }

      setRows(data.data || []);
      setPagination(data.pagination || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate]);

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
    router.push(`/core/reports/ledger?${params.toString()}`);
  };

  const handleExportCSV = () => {
    if (rows.length === 0) return;

    const headers = ["Date", "Merchant", "Description", "Amount", "Account", "Category", "Source", "Status"];
    const csvRows = rows.map((r) => [
      r.date,
      r.merchant || "",
      r.description || "",
      r.amount,
      r.account_name || r.account_id,
      r.category,
      r.source,
      r.status,
    ]);

    const csv = [headers, ...csvRows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transaction-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Summary stats
  const summary = useMemo(() => {
    const inflows = rows.filter((r) => r.amount < 0).reduce((sum, r) => sum + Math.abs(r.amount), 0);
    const outflows = rows.filter((r) => r.amount > 0).reduce((sum, r) => sum + r.amount, 0);
    return { inflows, outflows, net: inflows - outflows, count: rows.length };
  }, [rows]);

  return (
    <RouteShell
      title="Transaction Ledger"
      subtitle="Complete, immutable list of all transactions"
      breadcrumbs={[
        { label: "Reports", href: "/core/reports" },
        { label: "Transaction Ledger" },
      ]}
    >
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card/50 p-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => updateParams({ start_date: e.target.value, page: "1" })}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => updateParams({ end_date: e.target.value, page: "1" })}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => updateParams({ start_date: null, end_date: null, page: "1" })}
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

      {/* Summary Stats */}
      {!loading && rows.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="text-xs text-muted-foreground">Transactions</div>
            <div className="mt-1 text-2xl font-semibold">{pagination?.total || summary.count}</div>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="text-xs text-muted-foreground">Inflows</div>
            <div className="mt-1 text-2xl font-semibold text-green-600">{formatCurrency(summary.inflows)}</div>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="text-xs text-muted-foreground">Outflows</div>
            <div className="mt-1 text-2xl font-semibold text-red-600">{formatCurrency(summary.outflows)}</div>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="text-xs text-muted-foreground">Net (this page)</div>
            <div className={`mt-1 text-2xl font-semibold ${summary.net >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(summary.net)}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Merchant</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Account</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Source</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-b-0">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No transactions found
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(row.date)}</td>
                    <td className="px-4 py-3">
                      <div className="max-w-[200px] truncate font-medium">{row.merchant || row.description || "—"}</div>
                      {row.merchant && row.description && row.merchant !== row.description && (
                        <div className="max-w-[200px] truncate text-xs text-muted-foreground">{row.description}</div>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono tabular-nums ${row.amount < 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(Math.abs(row.amount), row.iso_currency_code)}
                      {row.amount < 0 ? " ↓" : " ↑"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.account_name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                        {row.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground uppercase">{row.source}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          row.status === "posted" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.total_pages} ({pagination.total} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateParams({ page: String(pagination.page - 1) })}
                disabled={!pagination.has_prev}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => updateParams({ page: String(pagination.page + 1) })}
                disabled={!pagination.has_next}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-muted"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </RouteShell>
  );
}
