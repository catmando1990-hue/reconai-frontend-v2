"use client";

import * as React from "react";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";

type ExportResult = {
  request_id: string;
  org_id: string;
  export: string;
  format: string;
  count?: number;
  invoices?: unknown[];
  data?: string;
  notes?: string;
};

export function InvoiceExportPanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ExportResult | null>(null);
  const [format, setFormat] = React.useState<"json" | "csv">("json");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  const exportInvoices = async () => {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const body: Record<string, string> = { format };
      if (startDate) body.start_date = startDate;
      if (endDate) body.end_date = endDate;

      const json = await auditedFetch<ExportResult>(
        `${apiBase}/api/billing/invoices/export`,
        {
          method: "POST",
          credentials: "include",
          body: JSON.stringify(body),
        },
      );

      setResult(json);
    } catch (e: unknown) {
      if (e instanceof AuditProvenanceError) {
        setErr(`Provenance error: ${e.message}`);
      } else if (e instanceof HttpError) {
        setErr(`HTTP ${e.status}: ${e.message}`);
      } else {
        setErr(e instanceof Error ? e.message : "Failed to export invoices");
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (result.format === "csv" && result.data) {
      content = result.data;
      filename = `invoices-export-${new Date().toISOString().split("T")[0]}.csv`;
      mimeType = "text/csv";
    } else {
      content = JSON.stringify(result.invoices || [], null, 2);
      filename = `invoices-export-${new Date().toISOString().split("T")[0]}.json`;
      mimeType = "application/json";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Invoice Export</div>
          <div className="text-xs opacity-70">
            Export invoice data from Stripe (manual, read-only).
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="flex gap-3 flex-wrap">
          <div>
            <label className="text-xs opacity-70 block mb-1">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as "json" | "csv")}
              className="rounded-lg border px-2 py-1 text-sm"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <div>
            <label className="text-xs opacity-70 block mb-1">
              Start Date (optional)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs opacity-70 block mb-1">
              End Date (optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border px-2 py-1 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportInvoices}
            disabled={loading}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            {loading ? "Exporting..." : "Export Invoices"}
          </button>
          {result && (
            <button
              type="button"
              onClick={downloadResult}
              className="rounded-xl border bg-green-600 text-white px-3 py-2 text-sm"
            >
              Download {result.format?.toUpperCase()}
            </button>
          )}
        </div>
      </div>

      {err ? <div className="mt-3 text-sm text-red-500">{err}</div> : null}

      {result ? (
        <div className="mt-3 rounded-xl border p-3 text-sm">
          <div className="flex justify-between">
            <span className="opacity-70">Status</span>
            <span>{result.export}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">Format</span>
            <span>{result.format}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">Count</span>
            <span>{result.count ?? 0} invoices</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">Request ID</span>
            <span className="font-mono text-xs">{result.request_id}</span>
          </div>
          {result.notes ? (
            <div className="mt-2 text-xs opacity-70">{result.notes}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
