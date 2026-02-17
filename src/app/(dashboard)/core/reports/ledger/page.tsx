"use client";

import { useEffect, useState, useCallback } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { Button } from "@/components/ui/button";
import {
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { auditedFetch, HttpError } from "@/lib/auditedFetch";
import { InlineCategoryEditor } from "@/components/transactions/InlineCategoryEditor";
import type { CategorySource } from "@/lib/categories";

interface Transaction {
  id: string;
  date: string;
  merchant_name: string | null;
  name: string;
  amount: number;
  account_name: string | null;
  account_mask: string | null;
  category: string | null;
  category_source: CategorySource;
  source: "plaid" | "manual" | "upload";
  status: "posted" | "pending";
  iso_currency_code: string | null;
}

interface LedgerResponse {
  ok: boolean;
  transactions: Transaction[];
  total: number;
  page: number;
  page_size: number;
  request_id: string;
}

const PAGE_SIZE = 15;

function formatCurrency(amount: number, currency: string | null): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface AutoCategorizeResponse {
  ok: boolean;
  categorized: number;
  total_analyzed: number;
  applied?: Array<{ merchant: string; category: string }>;
  message?: string;
  request_id: string;
}

export default function TransactionLedgerPage() {
  const [data, setData] = useState<LedgerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [categorizing, setCategorizing] = useState(false);
  const [categorizeResult, setCategorizeResult] = useState<string | null>(null);

  const fetchData = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      const json = await auditedFetch<LedgerResponse>(
        `/api/reports/ledger?page=${pageNum}&page_size=${PAGE_SIZE}`,
        { skipBodyValidation: true },
      );
      setData(json);
    } catch (e) {
      if (e instanceof HttpError) {
        setError(`Failed to fetch ledger (${e.status})`);
      } else {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  const handleAutoCategorize = async () => {
    try {
      setCategorizing(true);
      setCategorizeResult(null);
      setError(null);

      const response = await auditedFetch<AutoCategorizeResponse>(
        "/api/intelligence/auto-categorize",
        { method: "POST", skipBodyValidation: true },
      );

      if (response.categorized > 0) {
        setCategorizeResult(
          `Categorized ${response.categorized} transactions using AI`,
        );
        // Refresh to show updated categories
        await fetchData(page);
      } else {
        setCategorizeResult(
          response.message || "No transactions needed categorization",
        );
      }
    } catch (e) {
      if (e instanceof HttpError) {
        setError(`Auto-categorize failed (${e.status})`);
      } else {
        setError(e instanceof Error ? e.message : "Auto-categorize failed");
      }
    } finally {
      setCategorizing(false);
    }
  };

  const handleExportCSV = () => {
    if (!data?.transactions.length) return;

    const headers = [
      "Date",
      "Merchant",
      "Description",
      "Amount",
      "Account",
      "Category",
      "Source",
      "Status",
    ];
    const rows = data.transactions.map((t) => [
      t.date,
      t.merchant_name || "",
      t.name,
      t.amount.toString(),
      t.account_name ? `${t.account_name} (${t.account_mask || ""})` : "",
      t.category || "Uncategorized",
      t.source,
      t.status,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transaction-ledger-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <RouteShell
      title="Transaction Ledger"
      subtitle="Complete, immutable list of all transactions — audit baseline and source of truth"
      right={
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleAutoCategorize}
            disabled={categorizing || !data?.transactions.length}
          >
            <Sparkles
              className={`mr-2 h-4 w-4 ${categorizing ? "animate-pulse" : ""}`}
            />
            {categorizing ? "Categorizing..." : "Auto-Categorize"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!data?.transactions.length}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchData(page)}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      }
    >
      <div className="mb-4">
        <Link
          href="/core/reports"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Reports
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {categorizeResult && (
        <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4 mb-4 flex items-center justify-between">
          <p className="text-sm text-emerald-600 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {categorizeResult}
          </p>
          <button
            onClick={() => setCategorizeResult(null)}
            className="text-emerald-600 hover:text-emerald-700 text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Merchant</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Account</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Source</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading transactions...
                  </td>
                </tr>
              ) : data?.transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No transactions found. Connect a bank account to import
                    transactions.
                  </td>
                </tr>
              ) : (
                data?.transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="max-w-[150px] truncate block">
                        {tx.merchant_name || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="max-w-[200px] truncate block">
                        {tx.name}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono whitespace-nowrap ${tx.amount > 0 ? "text-destructive" : "text-emerald-600"}`}
                    >
                      {tx.amount > 0 ? "-" : "+"}
                      {formatCurrency(
                        Math.abs(tx.amount),
                        tx.iso_currency_code,
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {tx.account_name ? (
                        <span className="text-xs">
                          {tx.account_name}
                          {tx.account_mask && (
                            <span className="ml-1">••{tx.account_mask}</span>
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <InlineCategoryEditor
                        transactionId={tx.id}
                        currentCategory={tx.category}
                        categorySource={tx.category_source || "plaid"}
                        onCategoryChange={(newCategory, newSource) => {
                          // Optimistic update
                          setData((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  transactions: prev.transactions.map((t) =>
                                    t.id === tx.id
                                      ? {
                                          ...t,
                                          category: newCategory,
                                          category_source: newSource,
                                        }
                                      : t,
                                  ),
                                }
                              : prev,
                          );
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          tx.source === "plaid"
                            ? "bg-blue-500/10 text-blue-600"
                            : tx.source === "manual"
                              ? "bg-yellow-500/10 text-yellow-600"
                              : "bg-purple-500/10 text-purple-600"
                        }`}
                      >
                        {tx.source}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          tx.status === "posted"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-orange-500/10 text-orange-600"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, data.total)} of {data.total}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
        <h3 className="font-medium text-sm">About This Report</h3>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>• Audit baseline — complete record of all transactions</li>
          <li>• Reconciliation source of truth</li>
          <li>
            • Includes date, merchant, amount, account, category, source, and
            status
          </li>
          <li>• Negative amounts indicate money received (inflows)</li>
          <li>• Click any category to change it — the system learns from your corrections</li>
        </ul>
      </div>
    </RouteShell>
  );
}
