"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

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

  if (loading) {
    return (
      <div className="-mx-4 mt-6 px-4 sm:mx-0 sm:px-0">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-card/20 rounded" />
          <div className="h-8 bg-card/20 rounded" />
          <div className="h-8 bg-card/20 rounded" />
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
        <h3 className="text-foreground font-medium mb-2">
          No Transactions Yet
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          ReconAI imports transactions automatically from your connected bank
          accounts. Once synced, transactions appear here for categorization,
          duplicate detection, and reconciliation.
        </p>
        <p className="text-muted-foreground text-xs">
          Next step: Connect a bank account via Plaid to start importing
          transactions.
        </p>
      </div>
    );
  }

  return (
    <div className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="whitespace-nowrap py-3 pr-4 font-medium">Date</th>
            <th className="whitespace-nowrap py-3 pr-4 font-medium">
              Merchant
            </th>
            <th className="whitespace-nowrap py-3 pr-4 font-medium">Amount</th>
            <th className="whitespace-nowrap py-3 pr-4 font-medium">Account</th>
            <th className="whitespace-nowrap py-3 pr-4 font-medium">
              Category
            </th>
            <th className="whitespace-nowrap py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((tx) => (
            <tr
              key={tx.id}
              className="border-b border-border/50 hover:bg-card/30 transition-colors"
            >
              <td className="whitespace-nowrap py-3 pr-4 text-foreground">
                {tx.date}
              </td>
              <td className="max-w-[200px] truncate py-3 pr-4 text-foreground">
                {tx.merchant ?? tx.description ?? "—"}
              </td>
              <td className="whitespace-nowrap py-3 pr-4 font-mono text-foreground">
                {typeof tx.amount === "number"
                  ? new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(tx.amount)
                  : (tx.amount ?? "—")}
              </td>
              <td className="whitespace-nowrap py-3 pr-4 text-muted-foreground">
                {tx.account ?? "—"}
              </td>
              <td className="whitespace-nowrap py-3 pr-4 text-muted-foreground">
                {tx.category ?? "Uncategorized"}
              </td>
              <td className="whitespace-nowrap py-3">
                {tx.duplicate ? (
                  <span className="inline-flex items-center gap-1 text-amber-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs">Duplicate</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
