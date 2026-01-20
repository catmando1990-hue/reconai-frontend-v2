"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  DashTable,
  type DashTableColumn,
  type SeverityLevel,
} from "@/components/dashboard/DashTable";
import { EmptyState } from "@/components/dashboard/EmptyState";

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

export default function TransactionsTable() {
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiFetch<TransactionRow[]>("/api/transactions");
        if (alive) setRows(data);
      } catch {
        // Silent: empty array on failure
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const getRowSeverity = (tx: TransactionRow): SeverityLevel | undefined => {
    if (tx.duplicate) return "warning";
    return undefined;
  };

  return (
    <div className="mt-6">
      <DashTable
        data={rows}
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
    </div>
  );
}
