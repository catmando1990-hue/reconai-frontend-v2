"use client";

import { useEffect, useState, useCallback } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import {
  Download,
  RefreshCw,
  Repeat,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";

type RecurringItem = {
  id: string;
  name: string;
  merchant_name: string | null;
  category: string | null;
  amount: number;
  frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "annual";
  next_expected_date: string | null;
  last_occurrence: string;
  occurrence_count: number;
  confidence: number;
  type: "inflow" | "outflow";
};

type RecurringResponse = {
  recurring: RecurringItem[];
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

function frequencyLabel(freq: string): string {
  const labels: Record<string, string> = {
    weekly: "Weekly",
    biweekly: "Bi-weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    annual: "Annual",
  };
  return labels[freq] || freq;
}

export function RecurringActivityReport() {
  const { apiFetch } = useApi();
  const { isLoaded } = useOrg();

  const [recurring, setRecurring] = useState<RecurringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<RecurringResponse>("/api/reports/recurring");
      setRecurring(data.recurring || []);
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

  const inflows = recurring.filter((r) => r.type === "inflow");
  const outflows = recurring.filter((r) => r.type === "outflow");

  const handleExportCSV = () => {
    if (recurring.length === 0) return;

    const headers = [
      "Name",
      "Merchant",
      "Category",
      "Type",
      "Amount",
      "Frequency",
      "Last Occurrence",
      "Next Expected",
      "Occurrences",
      "Confidence",
    ];
    const rows = recurring.map((r) => [
      `"${r.name}"`,
      `"${r.merchant_name || ""}"`,
      `"${r.category || ""}"`,
      r.type,
      r.amount.toFixed(2),
      r.frequency,
      r.last_occurrence,
      r.next_expected_date || "",
      r.occurrence_count.toString(),
      (r.confidence * 100).toFixed(0) + "%",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recurring-activity-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold">Recurring Activity Report</h3>
          <p className="text-xs text-muted-foreground">
            Detected repeating inflows and outflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchData()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs hover:bg-muted/50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={recurring.length === 0}
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

      {!loading && !error && recurring.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          No recurring transactions detected.
        </div>
      )}

      {!loading && !error && recurring.length > 0 && (
        <div className="divide-y">
          {/* Recurring Inflows */}
          {inflows.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
                <h4 className="text-sm font-semibold">Recurring Inflows</h4>
                <span className="text-xs text-muted-foreground">
                  ({inflows.length} detected)
                </span>
              </div>
              <div className="space-y-2">
                {inflows.map((item) => (
                  <RecurringItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Recurring Outflows */}
          {outflows.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <ArrowDownCircle className="h-4 w-4 text-destructive" />
                <h4 className="text-sm font-semibold">Recurring Outflows</h4>
                <span className="text-xs text-muted-foreground">
                  ({outflows.length} detected)
                </span>
              </div>
              <div className="space-y-2">
                {outflows.map((item) => (
                  <RecurringItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Note */}
      <div className="border-t bg-muted/20 px-4 py-2">
        <p className="text-[10px] text-muted-foreground">
          Recurring transactions are detected based on pattern analysis of your
          transaction history. Confidence indicates detection certainty.
        </p>
      </div>
    </div>
  );
}

function RecurringItemRow({ item }: { item: RecurringItem }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-muted p-2">
          <Repeat className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <div className="font-medium text-sm">{item.name}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{frequencyLabel(item.frequency)}</span>
            <span>•</span>
            <span>{item.occurrence_count} occurrences</span>
            {item.category && (
              <>
                <span>•</span>
                <span>{item.category}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div
          className={`font-mono text-sm font-semibold ${
            item.type === "inflow" ? "text-emerald-600" : "text-destructive"
          }`}
        >
          {item.type === "inflow" ? "+" : "-"}
          {formatCurrency(item.amount)}
        </div>
        <div className="text-xs text-muted-foreground">
          {item.next_expected_date
            ? `Next: ${formatDate(item.next_expected_date)}`
            : `Last: ${formatDate(item.last_occurrence)}`}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {(item.confidence * 100).toFixed(0)}% confidence
        </div>
      </div>
    </div>
  );
}
