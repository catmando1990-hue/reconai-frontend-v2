'use client';

import * as React from 'react';

/**
 * STEP 21 — Investor Audit Trail & Export Receipts Panel
 *
 * Read-only views for:
 * - Export receipts list
 * - Receipt details (export_id, timestamp, fields included, redaction summary)
 * - Audit summary statistics
 *
 * Manual refresh only. Dashboard-only.
 */

type Receipt = {
  receipt_id: string;
  export_id: string;
  org_id: string;
  user_id: string;
  org_tier: string;
  export_type: 'json' | 'pdf';
  timestamp: string;
  fields_included: string[];
  fields_count: number;
  redaction_summary: {
    pii_fields_redacted: string[];
    redaction_applied: boolean;
    allowlist_applied: boolean;
  };
  classification: string;
  hardening_applied: {
    rate_limiting: boolean;
    pii_redaction: boolean;
    allowlist_filtering: boolean;
    size_cap: boolean;
    watermark: boolean;
  };
  integrity_hash: string;
};

type AuditSummary = {
  total_exports: number;
  by_type: {
    json: number;
    pdf: number;
  };
  latest_export: string | null;
  hardening_status: {
    pii_redaction: string;
    allowlist_filtering: string;
    rate_limiting: string;
    pdf_watermark: string;
  };
};

type ReceiptsResponse = {
  request_id: string;
  receipts: Receipt[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
  timestamp: string;
};

type SummaryResponse = {
  request_id: string;
  summary: AuditSummary;
  timestamp: string;
};

export function InvestorAuditPanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [receipts, setReceipts] = React.useState<Receipt[]>([]);
  const [summary, setSummary] = React.useState<AuditSummary | null>(null);
  const [selectedReceipt, setSelectedReceipt] = React.useState<Receipt | null>(null);
  const [requestId, setRequestId] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [receiptsRes, summaryRes] = await Promise.all([
        fetch(`${apiBase}/api/investor/audit/receipts`, { credentials: 'include' }),
        fetch(`${apiBase}/api/investor/audit/summary`, { credentials: 'include' }),
      ]);

      if (!receiptsRes.ok) throw new Error(`Receipts: HTTP ${receiptsRes.status}`);
      if (!summaryRes.ok) throw new Error(`Summary: HTTP ${summaryRes.status}`);

      const receiptsData: ReceiptsResponse = await receiptsRes.json();
      const summaryData: SummaryResponse = await summaryRes.json();

      setReceipts(receiptsData.receipts);
      setSummary(summaryData.summary);
      setRequestId(receiptsData.request_id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load audit data');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateReceipt = async (exportType: 'json' | 'pdf') => {
    setGenerating(true);
    setErr(null);
    try {
      const res = await fetch(
        `${apiBase}/api/investor/audit/receipts/generate?export_type=${exportType}`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );
      if (!res.ok) throw new Error(`Generate: HTTP ${res.status}`);
      // Refresh data after generation
      await fetchData();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to generate receipt');
    } finally {
      setGenerating(false);
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Investor Audit Trail</div>
          <div className="text-xs opacity-70">
            Export receipts and audit summary. Read-only.
          </div>
        </div>
        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {err ? <div className="mt-3 text-sm text-red-500">{err}</div> : null}

      {/* Summary Section */}
      {summary ? (
        <div className="mt-4 rounded-xl border p-4">
          <div className="font-medium mb-3">Audit Summary</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {summary.total_exports}
              </div>
              <div className="text-xs opacity-70">Total Exports</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-medium">{summary.by_type.json}</div>
              <div className="text-xs opacity-70">JSON Exports</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-medium">{summary.by_type.pdf}</div>
              <div className="text-xs opacity-70">PDF Exports</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">
                {summary.latest_export
                  ? formatTimestamp(summary.latest_export)
                  : 'None'}
              </div>
              <div className="text-xs opacity-70">Latest Export</div>
            </div>
          </div>

          {/* Hardening Status */}
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm font-medium mb-2">Hardening Status</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.hardening_status).map(([key, status]) => (
                <span
                  key={key}
                  className={`px-2 py-1 rounded text-xs ${
                    status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {key.replace(/_/g, ' ')}: {status}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Generate Receipt Buttons */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => handleGenerateReceipt('json')}
          disabled={generating}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          {generating ? 'Generating...' : 'Generate JSON Receipt'}
        </button>
        <button
          type="button"
          onClick={() => handleGenerateReceipt('pdf')}
          disabled={generating}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          {generating ? 'Generating...' : 'Generate PDF Receipt'}
        </button>
      </div>

      {/* Receipts List */}
      <div className="mt-4">
        <div className="font-medium mb-3">Export Receipts</div>
        {receipts.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <div className="text-sm text-gray-500">No export receipts yet</div>
            <div className="text-xs text-gray-400 mt-1">
              Generate a receipt using the buttons above
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {receipts.map((receipt) => (
              <div
                key={receipt.receipt_id}
                className={`rounded-xl border p-3 cursor-pointer transition-colors ${
                  selectedReceipt?.receipt_id === receipt.receipt_id
                    ? 'border-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedReceipt(receipt)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        receipt.export_type === 'json'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {receipt.export_type.toUpperCase()}
                    </span>
                    <span className="text-sm font-mono">
                      {receipt.export_id.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="text-xs opacity-70">
                    {formatTimestamp(receipt.timestamp)}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs opacity-70">
                  <span>{receipt.fields_count} fields</span>
                  <span>
                    {receipt.redaction_summary.pii_fields_redacted.length} PII
                    redacted
                  </span>
                  <span className="font-mono text-xs">
                    #{receipt.integrity_hash}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Receipt Details */}
      {selectedReceipt ? (
        <div className="mt-4 rounded-xl border p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">Receipt Details</div>
            <button
              type="button"
              onClick={() => setSelectedReceipt(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs opacity-70">Export ID</div>
                <div className="font-mono">{selectedReceipt.export_id}</div>
              </div>
              <div>
                <div className="text-xs opacity-70">Timestamp</div>
                <div>{formatTimestamp(selectedReceipt.timestamp)}</div>
              </div>
              <div>
                <div className="text-xs opacity-70">Export Type</div>
                <div className="capitalize">{selectedReceipt.export_type}</div>
              </div>
              <div>
                <div className="text-xs opacity-70">Organization Tier</div>
                <div className="capitalize">{selectedReceipt.org_tier}</div>
              </div>
            </div>

            <div>
              <div className="text-xs opacity-70 mb-1">Classification</div>
              <div className="text-sm font-medium text-amber-700">
                {selectedReceipt.classification}
              </div>
            </div>

            <div>
              <div className="text-xs opacity-70 mb-1">
                Fields Included ({selectedReceipt.fields_count})
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedReceipt.fields_included.map((field) => (
                  <span
                    key={field}
                    className="px-2 py-0.5 rounded bg-gray-200 text-xs font-mono"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs opacity-70 mb-1">Redaction Summary</div>
              <div className="flex flex-wrap gap-1">
                {selectedReceipt.redaction_summary.pii_fields_redacted.map(
                  (field) => (
                    <span
                      key={field}
                      className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-xs font-mono"
                    >
                      {field}
                    </span>
                  )
                )}
              </div>
            </div>

            <div>
              <div className="text-xs opacity-70 mb-1">Hardening Applied</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(selectedReceipt.hardening_applied).map(
                  ([key, applied]) => (
                    <span
                      key={key}
                      className={`px-2 py-1 rounded text-xs ${
                        applied
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {key.replace(/_/g, ' ')}: {applied ? 'Yes' : 'No'}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="text-xs opacity-70">Integrity Hash</div>
              <div className="font-mono text-sm">
                {selectedReceipt.integrity_hash}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {requestId ? (
        <div className="mt-3 text-xs opacity-50">Request ID: {requestId}</div>
      ) : null}
    </div>
  );
}
