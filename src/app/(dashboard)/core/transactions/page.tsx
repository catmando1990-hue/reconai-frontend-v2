"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useApi } from "@/lib/useApi";

const PAGE_SIZE = 15;

interface Transaction {
  id: string;
  date: string;
  merchant: string;
  description: string;
  amount: number;
  account: string;
  category: string | null;
  pending: boolean;
}

interface TransactionsResponse {
  items: Transaction[];
  count: number;
  request_id: string;
}

function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(absAmount);
  return amount < 0 ? `-${formatted}` : formatted;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CoreTransactionsPage() {
  const { apiFetch } = useApi();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const paginatedRows = useMemo(
    () => transactions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [transactions, page],
  );

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<TransactionsResponse>(
        "/api/transactions?limit=100",
      );
      setTransactions(data?.items || []);
    } catch (err) {
      console.error("[CoreTransactions] Fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load transactions",
      );
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <RouteShell
      title="Transactions"
      subtitle="All synced transactions from connected bank accounts"
      right={
        <button
          type="button"
          onClick={fetchTransactions}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[#111827] dark:text-[#f9fafb] hover:bg-[#f9fafb] dark:hover:bg-[#27272a] disabled:opacity-50 transition-colors"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      }
    >
      <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b]">
        <div className="px-6 py-4 border-b border-[#e5e7eb] dark:border-[#27272a]">
          <div className="text-sm font-medium text-[#111827] dark:text-[#f9fafb] flex items-center justify-between">
            <span>Transaction History</span>
            <span className="text-[#6b7280] dark:text-[#a1a1aa] font-normal">
              {transactions.length} transactions
            </span>
          </div>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-[#6b7280] dark:text-[#a1a1aa]" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-[#dc2626] dark:text-[#ef4444]">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-[#6b7280] dark:text-[#a1a1aa]">
              No transactions found. Connect a bank account to sync
              transactions.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e7eb] dark:border-[#27272a] text-left text-[#6b7280] dark:text-[#a1a1aa]">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Merchant</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-[#e5e7eb] dark:border-[#27272a] last:border-0"
                    >
                      <td className="py-3 text-[#6b7280] dark:text-[#a1a1aa]">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-[#111827] dark:text-[#f9fafb]">
                          {tx.merchant || tx.description || "Unknown"}
                        </div>
                        {tx.description &&
                          tx.merchant &&
                          tx.description !== tx.merchant && (
                            <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa] truncate max-w-50">
                              {tx.description}
                            </div>
                          )}
                      </td>
                      <td className="py-3 text-[#6b7280] dark:text-[#a1a1aa]">
                        {tx.category || "—"}
                      </td>
                      <td
                        className={`py-3 text-right font-medium font-mono ${tx.amount > 0 ? "text-[#dc2626] dark:text-[#ef4444]" : "text-[#059669] dark:text-[#10b981]"}`}
                      >
                        {tx.amount > 0 ? "-" : "+"}{formatCurrency(Math.abs(tx.amount))}
                      </td>
                      <td className="py-3 text-center">
                        {tx.pending ? (
                          <span className="inline-flex items-center rounded-full bg-[#eab308]/10 px-2 py-0.5 text-xs font-medium text-[#eab308]">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-[#059669]/10 dark:bg-[#10b981]/10 px-2 py-0.5 text-xs font-medium text-[#059669] dark:text-[#10b981]">
                            Posted
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#e5e7eb] dark:border-[#27272a] pt-4 mt-4">
                  <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                    Showing {page * PAGE_SIZE + 1}–
                    {Math.min((page + 1) * PAGE_SIZE, transactions.length)} of{" "}
                    {transactions.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="rounded p-1.5 hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4 text-[#6b7280] dark:text-[#a1a1aa]" />
                    </button>
                    <span className="px-2 text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                      {page + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="rounded p-1.5 hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 text-[#6b7280] dark:text-[#a1a1aa]" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </RouteShell>
  );
}
