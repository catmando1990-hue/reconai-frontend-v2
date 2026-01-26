"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DashTable,
  type DashTableColumn,
  type SeverityLevel,
} from "@/components/dashboard/DashTable";
import { EmptyState } from "@/components/dashboard/EmptyState";

const PAGE_SIZE = 25;

type TransactionRow = {
  id: string | number;
  date?: string;
  merchant?: string;
  description?: string;
  amount?: string | number;
  account?: string;
  category?: string;
  duplicate?: boolean;
};

function formatCurrency(amount: string | number | undefined): string {
  if (typeof amount === "number") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }
  return amount ?? "—";
}

const columns: DashTableColumn<TransactionRow>[] = [
  {
    key: "date",
    header: "Date",
    render: (tx) => tx.date ?? "—",
  },
  {
    key: "merchant",
    header: "Merchant",
    render: (tx) => (
      <span className="max-w-[200px] truncate block">
        {tx.merchant ?? tx.description ?? "—"}
      </span>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    render: (tx) => (
      <span className="font-mono tabular-nums">
        {formatCurrency(tx.amount)}
      </span>
    ),
  },
  {
    key: "account",
    header: "Account",
    render: (tx) => (
      <span className="text-muted-foreground">{tx.account ?? "—"}</span>
    ),
  },
  {
    key: "category",
    header: "Category",
    render: (tx) => (
      <span className="text-muted-foreground">
        {tx.category ?? "Uncategorized"}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    align: "right",
    render: (tx) =>
      tx.duplicate ? (
        <span className="inline-flex items-center gap-1 text-chart-4">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs">Duplicate</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-chart-1">
          <CheckCircle2 className="h-4 w-4" />
        </span>
      ),
  },
];

/**
 * P0 FIX: Auth Propagation
 * - Uses useApi() hook for org context and auth headers
 * - Gates fetch behind isLoaded to prevent fetching before Clerk is ready
 */
export default function TransactionsTable() {
  const { apiFetch } = useApi();
  const { isLoaded: authReady } = useOrg();

  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<TransactionRow[]>("/api/transactions");
      setRows(data);
    } catch (err) {
      // P1 FIX: Surface errors to user instead of silent failure
      setError(
        err instanceof Error ? err.message : "Failed to load transactions",
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    // P0 FIX: Do NOT fetch until Clerk auth is fully loaded
    if (!authReady) return;
    fetchTransactions();
  }, [authReady, fetchTransactions]);

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return rows.slice(start, end);
  }, [rows, currentPage]);

  const getRowSeverity = (tx: TransactionRow): SeverityLevel | undefined => {
    if (tx.duplicate) return "warning";
    return undefined;
  };

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  };

  const startItem = rows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, rows.length);

  return (
    <div className="mt-6">
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 p-3">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchTransactions}
            className="text-red-400 hover:text-red-300"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      )}
      <DashTable
        data={paginatedRows}
        columns={columns}
        getRowKey={(tx) => tx.id}
        getRowSeverity={getRowSeverity}
        loading={loading}
        loadingRows={5}
        className="min-w-[800px]"
        emptyContent={
          <EmptyState
            title="No Transactions Yet"
            description="ReconAI imports transactions automatically from your connected bank accounts. Once synced, transactions appear here for categorization, duplicate detection, and reconciliation."
            action={{ label: "Connect Bank", href: "/connect-bank" }}
          />
        }
      />

      {/* Pagination Controls */}
      {!loading && rows.length > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {startItem}–{endItem} of {rows.length} transactions
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 rounded-lg border bg-card/40 px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-card/60"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border bg-card/40 px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-card/60"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
