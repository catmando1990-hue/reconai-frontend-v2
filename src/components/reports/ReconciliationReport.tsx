"use client";

import { useEffect, useState, useCallback } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import {
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Upload,
} from "lucide-react";

type ReconciliationStatus = "matched" | "unmatched" | "partial";

type ReconciliationItem = {
  id: string;
  statement_date: string;
  statement_amount: number;
  ingested_amount: number | null;
  difference: number | null;
  status: ReconciliationStatus;
  description: string;
  account_name: string;
};

type ReconciliationSummary = {
  total_statement_items: number;
  matched_count: number;
  unmatched_count: number;
  partial_count: number;
  total_difference: number;
  statement_period_start: string | null;
  statement_period_end: string | null;
};

type ReconciliationResponse = {
  items: ReconciliationItem[];
  summary: ReconciliationSummary;
  request_id: string;
};

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

export function ReconciliationReport() {
  const { apiFetch } = useApi();
  const { isLoaded } = useOrg();

  const [items, setItems] = useState<ReconciliationItem[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    ReconciliationStatus | "all"
  >("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ReconciliationResponse>(
        "/api/reports/reconciliation",
        { method: "POST", body: JSON.stringify({}) },
      );
      setItems(data.items || []);
      setSummary(data.summary || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!isLoaded) return;
    fetchData();
  }, [isLoaded, fetchData]);

  const filteredItems =
    filterStatus === "all"
      ? items
      : items.filter((item) => item.status === filterStatus);

  const handleExportCSV = () => {
    if (items.length === 0) return;

    const headers = [
      "Date",
      "Description",
      "Account",
      "Statement Amount",
      "Ingested Amount",
      "Difference",
      "Status",
    ];
    const rows = items.map((item) => [
      item.statement_date,
      `"${item.description}"`,
      `"${item.account_name}"`,
      item.statement_amount.toFixed(2),
      item.ingested_amount?.toFixed(2) || "",
      item.difference?.toFixed(2) || "",
      item.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reconciliation-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusIcon = (status: ReconciliationStatus) => {
    switch (status) {
      case "matched":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case "unmatched":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "partial":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
  };

  const statusLabel = (status: ReconciliationStatus) => {
    switch (status) {
      case "matched":
        return "Matched";
      case "unmatched":
        return "Unmatched";
      case "partial":
        return "Partial Match";
    }
  };

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold">Statement Reconciliation</h3>
          <p className="text-xs text-muted-foreground">
            Compare uploaded statements vs ingested data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as ReconciliationStatus | "all")
            }
            className="rounded-lg border bg-background px-2 py-1 text-xs"
          >
            <option value="all">All Items</option>
            <option value="matched">Matched</option>
            <option value="unmatched">Unmatched</option>
            <option value="partial">Partial</option>
          </select>
          <button
            type="button"
            onClick={() => void fetchData()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs hover:bg-muted/50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Run Reconciliation
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={items.length === 0}
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

      {!loading && !error && items.length === 0 && (
        <div className="px-4 py-12 text-center">
          <Upload className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            No statements available for reconciliation.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Upload bank statements to compare against ingested transactions.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 border-b bg-muted/20 px-4 py-3">
            <div>
              <div className="text-xs text-muted-foreground">Total Items</div>
              <div className="text-lg font-semibold">
                {summary.total_statement_items}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Matched</div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-lg font-semibold text-emerald-600">
                  {summary.matched_count}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Unmatched</div>
              <div className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-lg font-semibold text-destructive">
                  {summary.unmatched_count}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Total Difference
              </div>
              <div
                className={`font-mono text-lg font-semibold ${
                  summary.total_difference === 0
                    ? "text-emerald-600"
                    : "text-amber-500"
                }`}
              >
                {summary.total_difference === 0
                  ? "Balanced"
                  : formatCurrency(summary.total_difference)}
              </div>
            </div>
          </div>

          {/* Statement Period */}
          {summary.statement_period_start && summary.statement_period_end && (
            <div className="border-b px-4 py-2 text-xs text-muted-foreground">
              Statement period: {formatDate(summary.statement_period_start)} –{" "}
              {formatDate(summary.statement_period_end)}
            </div>
          )}

          {/* Reconciliation Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Description</th>
                  <th className="px-4 py-2 font-medium text-right">
                    Statement
                  </th>
                  <th className="px-4 py-2 font-medium text-right">Ingested</th>
                  <th className="px-4 py-2 font-medium text-right">
                    Difference
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {statusIcon(item.status)}
                        <span className="text-xs">
                          {statusLabel(item.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {formatDate(item.statement_date)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="max-w-[200px] truncate">
                        {item.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.account_name}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {formatCurrency(item.statement_amount)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {item.ingested_amount !== null
                        ? formatCurrency(item.ingested_amount)
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {item.difference !== null ? (
                        <span
                          className={
                            item.difference === 0
                              ? "text-emerald-600"
                              : "text-destructive"
                          }
                        >
                          {item.difference === 0
                            ? "Match"
                            : formatCurrency(item.difference)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Note */}
      <div className="border-t bg-muted/20 px-4 py-2">
        <p className="text-[10px] text-muted-foreground">
          Reconciliation compares uploaded bank statements against ingested
          transaction data. Differences may occur due to pending transactions or
          timing differences.
        </p>
      </div>
    </div>
  );
}
