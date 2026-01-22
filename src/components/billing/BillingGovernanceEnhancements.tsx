"use client";

import * as React from "react";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";

type GovernanceFilter = {
  id: string;
  label: string;
  field: string;
  operator: string;
  value: string;
};

type GovernanceDiff = {
  id: string;
  timestamp: string;
  field: string;
  old_value: string;
  new_value: string;
  actor: string;
};

type ExportHistoryItem = {
  id: string;
  timestamp: string;
  format: string;
  record_count: number;
  actor: string;
};

type GovernanceData = {
  request_id: string;
  filters?: GovernanceFilter[];
  diffs?: GovernanceDiff[];
  export_history?: ExportHistoryItem[];
};

export function BillingGovernanceEnhancements({
  apiBase,
}: {
  apiBase: string;
}) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<
    "filters" | "diffs" | "exports"
  >("filters");
  const [filters, setFilters] = React.useState<GovernanceFilter[]>([]);
  const [diffs, setDiffs] = React.useState<GovernanceDiff[]>([]);
  const [exportHistory, setExportHistory] = React.useState<ExportHistoryItem[]>(
    [],
  );
  const [requestId, setRequestId] = React.useState<string | null>(null);

  const fetchData = React.useCallback(
    async (endpoint: string) => {
      setLoading(true);
      setErr(null);
      try {
        const json = await auditedFetch<GovernanceData>(
          `${apiBase}/api/billing/governance/${endpoint}`,
          { credentials: "include" },
        );
        setRequestId(json.request_id);
        return json;
      } catch (e: unknown) {
        if (e instanceof AuditProvenanceError) {
          setErr(`Provenance error: ${e.message}`);
        } else if (e instanceof HttpError) {
          setErr(`HTTP ${e.status}: ${e.message}`);
        } else {
          setErr(
            e instanceof Error ? e.message : "Failed to load governance data",
          );
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiBase],
  );

  const loadFilters = React.useCallback(async () => {
    const data = await fetchData("filters");
    if (data?.filters) setFilters(data.filters);
  }, [fetchData]);

  const loadDiffs = React.useCallback(async () => {
    const data = await fetchData("diffs");
    if (data?.diffs) setDiffs(data.diffs);
  }, [fetchData]);

  const loadExportHistory = React.useCallback(async () => {
    const data = await fetchData("export-history");
    if (data?.export_history) setExportHistory(data.export_history);
  }, [fetchData]);

  React.useEffect(() => {
    // Manual-first UX: fetch once on mount only (no polling).
    loadFilters();
  }, [loadFilters]);

  const handleTabChange = async (tab: "filters" | "diffs" | "exports") => {
    setActiveTab(tab);
    if (tab === "filters") await loadFilters();
    else if (tab === "diffs") await loadDiffs();
    else if (tab === "exports") await loadExportHistory();
  };

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Governance UI</div>
          <div className="text-xs opacity-70">
            Read-only view of filters, diffs, and export history.
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2 border-b pb-2">
        {(["filters", "diffs", "exports"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabChange(tab)}
            className={`rounded-lg px-3 py-1 text-sm ${activeTab === tab ? "bg-blue-600 text-white" : "border"}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {err ? <div className="mt-3 text-sm text-red-500">{err}</div> : null}

      {loading ? (
        <div className="mt-3 text-sm opacity-70">Loading...</div>
      ) : activeTab === "filters" ? (
        <div className="mt-3">
          {filters.length === 0 ? (
            <div className="text-sm opacity-70">No saved filters.</div>
          ) : (
            <div className="grid gap-2">
              {filters.map((f) => (
                <div key={f.id} className="rounded-lg border p-2 text-sm">
                  <span className="font-medium">{f.label}</span>
                  <span className="ml-2 opacity-70">
                    {f.field} {f.operator} {f.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "diffs" ? (
        <div className="mt-3">
          {diffs.length === 0 ? (
            <div className="text-sm opacity-70">No change history.</div>
          ) : (
            <div className="grid gap-2">
              {diffs.map((d) => (
                <div key={d.id} className="rounded-lg border p-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{d.field}</span>
                    <span className="text-xs opacity-70">{d.timestamp}</span>
                  </div>
                  <div className="mt-1 text-xs">
                    <span className="line-through opacity-50">
                      {d.old_value}
                    </span>
                    <span className="mx-2">→</span>
                    <span>{d.new_value}</span>
                  </div>
                  <div className="mt-1 text-xs opacity-70">by {d.actor}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3">
          {exportHistory.length === 0 ? (
            <div className="text-sm opacity-70">No export history.</div>
          ) : (
            <div className="grid gap-2">
              {exportHistory.map((e) => (
                <div key={e.id} className="rounded-lg border p-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {e.format.toUpperCase()}
                    </span>
                    <span className="text-xs opacity-70">{e.timestamp}</span>
                  </div>
                  <div className="text-xs opacity-70">
                    {e.record_count} records by {e.actor}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {requestId ? (
        <div className="mt-3 text-xs opacity-50">Request ID: {requestId}</div>
      ) : null}
    </div>
  );
}
