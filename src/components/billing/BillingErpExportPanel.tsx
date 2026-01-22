"use client";

import * as React from "react";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";
import { AuditEvidence } from "@/components/audit/AuditEvidence";

type ErpFormat = {
  id: string;
  name: string;
  description: string;
  fields: string[];
};

type FormatsResponse = {
  request_id: string;
  formats: ErpFormat[];
};

type ExportResult = {
  request_id: string;
  status: string;
  format: string;
  record_count: number;
  csv_data?: string;
  audit_logged: boolean;
};

export function BillingErpExportPanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [formats, setFormats] = React.useState<ErpFormat[]>([]);
  const [selectedFormat, setSelectedFormat] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [result, setResult] = React.useState<ExportResult | null>(null);

  const fetchFormats = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const json = await auditedFetch<FormatsResponse>(
        `${apiBase}/api/billing/erp/formats`,
        { credentials: "include" },
      );
      setFormats(json.formats || []);
      if (json.formats?.length > 0 && !selectedFormat) {
        setSelectedFormat(json.formats[0].id);
      }
    } catch (e: unknown) {
      if (e instanceof AuditProvenanceError) {
        setErr(`Provenance error: ${e.message}`);
      } else if (e instanceof HttpError) {
        setErr(`HTTP ${e.status}: ${e.message}`);
      } else {
        setErr(e instanceof Error ? e.message : "Failed to load ERP formats");
      }
    } finally {
      setLoading(false);
    }
  }, [apiBase, selectedFormat]);

  const exportToErp = async () => {
    if (!selectedFormat) {
      setErr("Please select an ERP format.");
      return;
    }

    setExporting(true);
    setErr(null);
    setResult(null);
    try {
      const body: Record<string, string> = { format: selectedFormat };
      if (startDate) body.start_date = startDate;
      if (endDate) body.end_date = endDate;

      const json = await auditedFetch<ExportResult>(
        `${apiBase}/api/billing/erp/export`,
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
        setErr(e instanceof Error ? e.message : "Failed to export to ERP");
      }
    } finally {
      setExporting(false);
    }
  };

  const downloadCsv = () => {
    if (!result?.csv_data) return;

    const blob = new Blob([result.csv_data], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `erp-export-${result.format}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    // Manual-first UX: fetch once on mount only (no polling).
    fetchFormats();
  }, [fetchFormats]);

  const selectedFormatInfo = formats.find((f) => f.id === selectedFormat);

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">ERP Export</div>
          <div className="text-xs opacity-70">
            Export billing data to NetSuite, QuickBooks (manual trigger only).
          </div>
        </div>
        <button
          type="button"
          onClick={fetchFormats}
          disabled={loading}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {err ? (
        <div className="mt-3">
          <div className="text-sm text-red-500">{err}</div>
          <AuditEvidence requestId={result?.request_id} variant="error" />
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        <div>
          <label className="text-xs opacity-70 block mb-1">ERP System</label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm w-full"
          >
            {formats.length === 0 ? (
              <option value="">Loading formats...</option>
            ) : (
              formats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))
            )}
          </select>
        </div>

        {selectedFormatInfo ? (
          <div className="rounded-lg border p-2 text-xs">
            <div className="opacity-70 mb-1">
              {selectedFormatInfo.description}
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedFormatInfo.fields.map((field) => (
                <span key={field} className="rounded bg-gray-100 px-2 py-0.5">
                  {field}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex gap-3 flex-wrap">
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
            onClick={exportToErp}
            disabled={exporting || !selectedFormat}
            className="rounded-xl border bg-blue-600 text-white px-4 py-2 text-sm disabled:opacity-50"
          >
            {exporting ? "Exporting..." : "Export to ERP"}
          </button>
          {result?.csv_data ? (
            <button
              type="button"
              onClick={downloadCsv}
              className="rounded-xl border bg-green-600 text-white px-4 py-2 text-sm"
            >
              Download CSV
            </button>
          ) : null}
        </div>
      </div>

      {result ? (
        <div className="mt-4 rounded-xl border p-3 text-sm">
          <div className="flex justify-between">
            <span className="opacity-70">Status</span>
            <span>{result.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">Format</span>
            <span>{result.format}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">Records</span>
            <span>{result.record_count}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">Audit Logged</span>
            <span>{result.audit_logged ? "Yes" : "No"}</span>
          </div>
          <AuditEvidence requestId={result.request_id} variant="success" />
        </div>
      ) : null}
    </div>
  );
}
