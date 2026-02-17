"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { Download, RefreshCw, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { InlineCategoryEditor } from "@/components/transactions/InlineCategoryEditor";
import type { CategorySource } from "@/lib/categories";

const PAGE_SIZE = 15;

type Transaction = {
  id: string;
  date: string;
  // API returns these fields
  merchant?: string | null;
  description?: string | null;
  account?: string | null;
  // Legacy fields from direct Plaid data
  merchant_name?: string | null;
  name?: string | null;
  account_id?: string | null;
  account_name?: string;
  amount: number;
  category: string[] | string | null;
  category_source?: CategorySource;
  pending: boolean;
  transaction_type?: string;
  payment_channel?: string;
};

interface AutoCategorizeResponse {
  ok: boolean;
  categorized: number;
  total_analyzed: number;
  applied?: Array<{ merchant: string; category: string }>;
  message?: string;
  request_id: string;
}

/**
 * FIX: Backend response may be either:
 * - Legacy: Transaction[] (direct array)
 * - New: { items: Transaction[], request_id: string }
 */
type TransactionsResponse =
  | Transaction[]
  | { items: Transaction[]; request_id: string };

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

function getCategory(cat: string[] | string | null): string {
  if (!cat) return "Uncategorized";
  if (Array.isArray(cat)) return cat.join(" > ");
  return cat;
}

export function TransactionLedger() {
  const { apiFetch, auditedPost } = useApi();
  const { isLoaded } = useOrg();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [categorizing, setCategorizing] = useState(false);
  const [categorizeResult, setCategorizeResult] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<TransactionsResponse>("/api/transactions");

      // FIX: Normalize response - handle both array and object formats
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : [];

      // Sort by date descending
      const sorted = [...items].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setTransactions(sorted);
    } catch (e) {
      // Surface request_id on errors
      const requestId = crypto.randomUUID();
      const msg = e instanceof Error ? e.message : "Failed to load";
      setError(`${msg} (request_id: ${requestId})`);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!isLoaded) return;
    fetchData();
  }, [isLoaded, fetchData]);

  const handleAutoCategorize = async () => {
    try {
      setCategorizing(true);
      setCategorizeResult(null);
      setError(null);

      const response = await auditedPost<AutoCategorizeResponse>(
        "/api/intelligence/auto-categorize",
        {},
      );

      if (response.categorized > 0) {
        setCategorizeResult(
          `✨ Categorized ${response.categorized} transactions using AI`,
        );
        // Refresh to show updated categories
        await fetchData();
      } else {
        setCategorizeResult(
          response.message || "All transactions are already categorized",
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Auto-categorize failed";
      setError(msg);
    } finally {
      setCategorizing(false);
    }
  };

  const handleCategoryChange = (
    txId: string,
    newCategory: string,
    newSource: CategorySource,
  ) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === txId
          ? { ...tx, category: newCategory, category_source: newSource }
          : tx,
      ),
    );
  };

  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return transactions.slice(start, start + PAGE_SIZE);
  }, [transactions, currentPage]);

  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    const headers = [
      "Date",
      "Merchant",
      "Amount",
      "Type",
      "Account",
      "Category",
      "Status",
      "Channel",
    ];
    const rows = transactions.map((tx) => [
      tx.date,
      tx.merchant || tx.merchant_name || tx.description || tx.name || "",
      tx.amount.toString(),
      tx.amount < 0 ? "Outflow" : "Inflow",
      tx.account_name || tx.account || tx.account_id || "",
      getCategory(tx.category),
      tx.pending ? "Pending" : "Posted",
      tx.payment_channel || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transaction-ledger-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startItem =
    transactions.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, transactions.length);

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold">Transaction Ledger</h3>
          <p className="text-xs text-muted-foreground">
            Complete, immutable list of all transactions • Audit baseline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoCategorize}
            disabled={categorizing || transactions.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Sparkles
              className={`h-3.5 w-3.5 ${categorizing ? "animate-pulse" : ""}`}
            />
            {categorizing ? "Categorizing..." : "Auto-Categorize"}
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
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

      {categorizeResult && (
        <div className="mx-4 mt-4 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-emerald-600">{categorizeResult}</p>
          <button
            type="button"
            onClick={() => setCategorizeResult(null)}
            className="text-emerald-600 hover:text-emerald-700 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {!loading && !error && transactions.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          No transactions found. Connect a bank account to import transactions.
        </div>
      )}

      {!loading && !error && transactions.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Merchant</th>
                  <th className="px-4 py-2 font-medium text-right">Amount</th>
                  <th className="px-4 py-2 font-medium">Account</th>
                  <th className="px-4 py-2 font-medium">Category</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedRows.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="max-w-[200px] truncate">
                        {tx.merchant ||
                          tx.merchant_name ||
                          tx.description ||
                          tx.name ||
                          "—"}
                      </div>
                    </td>
                    <td
                      className={[
                        "px-4 py-2.5 text-right font-mono whitespace-nowrap",
                        tx.amount > 0 ? "text-destructive" : "text-emerald-600",
                      ].join(" ")}
                    >
                      {tx.amount > 0 ? "-" : "+"}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      <div className="max-w-[120px] truncate">
                        {tx.account_name ||
                          (tx.account
                            ? tx.account.slice(-8)
                            : tx.account_id
                              ? tx.account_id.slice(-8)
                              : "—")}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <InlineCategoryEditor
                        transactionId={tx.id}
                        currentCategory={
                          Array.isArray(tx.category)
                            ? tx.category[0]
                            : tx.category
                        }
                        categorySource={tx.category_source || "plaid"}
                        onCategoryChange={(newCat, newSource) =>
                          handleCategoryChange(tx.id, newCat, newSource)
                        }
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={[
                          "inline-flex rounded-full px-2 py-0.5 text-xs",
                          tx.pending
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-emerald-500/10 text-emerald-600",
                        ].join(" ")}
                      >
                        {tx.pending ? "Pending" : "Posted"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-xs text-muted-foreground">
              Showing {startItem}–{endItem} of {transactions.length}{" "}
              transactions
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              <span className="text-xs text-muted-foreground px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
