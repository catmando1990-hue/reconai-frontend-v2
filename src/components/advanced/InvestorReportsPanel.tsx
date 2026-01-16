'use client';

import * as React from 'react';

type InvestorMetrics = {
  mrr_usd: number;
  arr_usd: number;
  active_users_30d: number;
  customer_lifetime_months: number;
  ltv_estimate_usd: number;
  tier: string;
  subscription_status: string;
};

type InvestorSummary = {
  request_id: string;
  org_id: string;
  report_type: string;
  period: string;
  summary: {
    period: string;
    mrr: {
      mrr_usd: number;
      arr_usd: number;
      tier: string;
    };
  };
};

type ExportResult = {
  request_id: string;
  format: string;
  data: string | object;
  filename: string;
};

export function InvestorReportsPanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [metrics, setMetrics] = React.useState<InvestorMetrics | null>(null);
  const [summary, setSummary] = React.useState<InvestorSummary | null>(null);
  const [exportResult, setExportResult] = React.useState<ExportResult | null>(null);
  const [period, setPeriod] = React.useState<'monthly' | 'quarterly' | 'annual'>('quarterly');
  const [exportFormat, setExportFormat] = React.useState<'json' | 'csv'>('json');

  const fetchMetrics = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${apiBase}/api/investor/metrics`, { credentials: 'include' });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setMetrics(json.metrics);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const fetchSummary = React.useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/investor/summary?period=${period}`, { credentials: 'include' });
      if (!res.ok) return;
      const json = await res.json();
      setSummary(json);
    } catch {
      // Ignore summary fetch errors
    }
  }, [apiBase, period]);

  const exportReport = async () => {
    setExporting(true);
    setErr(null);
    setExportResult(null);
    try {
      const res = await fetch(`${apiBase}/api/investor/export`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: exportFormat, period }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setExportResult(json);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const downloadExport = () => {
    if (!exportResult) return;
    const content = typeof exportResult.data === 'string'
      ? exportResult.data
      : JSON.stringify(exportResult.data, null, 2);
    const mimeType = exportResult.format === 'csv' ? 'text/csv' : 'application/json';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    // Manual-first UX: fetch once on mount only (no polling).
    fetchMetrics();
    fetchSummary();
  }, [fetchMetrics, fetchSummary]);

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Investor Reports</div>
          <div className="text-xs opacity-70">GAAP-style summaries and board-ready exports (read-only).</div>
        </div>
        <button
          type="button"
          onClick={() => { fetchMetrics(); fetchSummary(); }}
          disabled={loading}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {err ? <div className="mt-3 text-sm text-red-500">{err}</div> : null}

      {/* Key Metrics */}
      {metrics ? (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border p-3 text-center">
            <div className="text-2xl font-bold">${metrics.mrr_usd}</div>
            <div className="text-xs opacity-70">MRR</div>
          </div>
          <div className="rounded-xl border p-3 text-center">
            <div className="text-2xl font-bold">${metrics.arr_usd}</div>
            <div className="text-xs opacity-70">ARR</div>
          </div>
          <div className="rounded-xl border p-3 text-center">
            <div className="text-2xl font-bold">{metrics.active_users_30d}</div>
            <div className="text-xs opacity-70">Active Users (30d)</div>
          </div>
          <div className="rounded-xl border p-3 text-center">
            <div className="text-2xl font-bold">${metrics.ltv_estimate_usd}</div>
            <div className="text-xs opacity-70">LTV Estimate</div>
          </div>
        </div>
      ) : null}

      {/* Export Controls */}
      <div className="mt-4 rounded-xl border p-3">
        <div className="text-sm font-medium mb-3">Board-Ready Export</div>
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="text-xs opacity-70 block mb-1">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as typeof period)}
              className="rounded-lg border px-2 py-1 text-sm"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div>
            <label className="text-xs opacity-70 block mb-1">Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as typeof exportFormat)}
              className="rounded-lg border px-2 py-1 text-sm"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <button
            type="button"
            onClick={exportReport}
            disabled={exporting}
            className="rounded-xl border bg-blue-600 text-white px-4 py-2 text-sm"
          >
            {exporting ? 'Exporting...' : 'Export Report'}
          </button>
          {exportResult ? (
            <button
              type="button"
              onClick={downloadExport}
              className="rounded-xl border bg-green-600 text-white px-4 py-2 text-sm"
            >
              Download {exportResult.format.toUpperCase()}
            </button>
          ) : null}
        </div>
      </div>

      {summary ? (
        <div className="mt-3 text-xs opacity-50">
          Request ID: {summary.request_id}
        </div>
      ) : null}
    </div>
  );
}
