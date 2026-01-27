"use client";

import { useEffect, useState, useCallback } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useApi } from "@/lib/useApi";

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
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTransactions}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      }
    >
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>Transaction History</span>
            <span className="text-muted-foreground font-normal">
              {transactions.length} transactions
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found. Connect a bank account to sync
              transactions.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Merchant</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="py-3 text-muted-foreground">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-foreground">
                          {tx.merchant || tx.description || "Unknown"}
                        </div>
                        {tx.description &&
                          tx.merchant &&
                          tx.description !== tx.merchant && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {tx.description}
                            </div>
                          )}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {tx.category || "—"}
                      </td>
                      <td
                        className={`py-3 text-right font-medium font-mono ${tx.amount > 0 ? "text-destructive" : "text-emerald-600"}`}
                      >
                        {tx.amount > 0 ? "-" : "+"}{formatCurrency(Math.abs(tx.amount))}
                      </td>
                      <td className="py-3 text-center">
                        {tx.pending ? (
                          <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-500">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                            Posted
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </RouteShell>
  );
}
