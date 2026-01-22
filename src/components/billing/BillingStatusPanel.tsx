"use client";

import * as React from "react";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";

type BillingStatus = {
  org_id: string;
  tier: string;
  interval?: string;
  status?: string;
  renewal_date?: string;
  source?: string;
  request_id: string;
};

export function BillingStatusPanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [data, setData] = React.useState<BillingStatus | null>(null);

  const fetchStatus = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const json = await auditedFetch<BillingStatus>(
        `${apiBase}/api/billing/status`,
        { credentials: "include" },
      );
      setData(json);
    } catch (e: unknown) {
      if (e instanceof AuditProvenanceError) {
        setErr(`Provenance error: ${e.message}`);
      } else if (e instanceof HttpError) {
        setErr(`HTTP ${e.status}: ${e.message}`);
      } else {
        setErr(
          e instanceof Error ? e.message : "Failed to load billing status",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  React.useEffect(() => {
    // Manual-first UX: fetch once on mount only (no polling).
    fetchStatus();
  }, [fetchStatus]);

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Billing status</div>
          <div className="text-xs opacity-70">
            Stripe-backed, read-only view.
          </div>
        </div>
        <button
          type="button"
          onClick={fetchStatus}
          disabled={loading}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {err ? (
        <div className="mt-3 text-sm">{err}</div>
      ) : data ? (
        <div className="mt-3 grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="opacity-70">Tier</span>
            <span>{data.tier}</span>
          </div>
          {data.interval ? (
            <div className="flex justify-between">
              <span className="opacity-70">Interval</span>
              <span>{data.interval}</span>
            </div>
          ) : null}
          {data.status ? (
            <div className="flex justify-between">
              <span className="opacity-70">Status</span>
              <span>{data.status}</span>
            </div>
          ) : null}
          {data.renewal_date ? (
            <div className="flex justify-between">
              <span className="opacity-70">Renews</span>
              <span>{data.renewal_date}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="opacity-70">Source</span>
            <span>{data.source || "stripe"}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">Request</span>
            <span className="font-mono text-xs">{data.request_id}</span>
          </div>
        </div>
      ) : (
        <div className="mt-3 text-sm opacity-70">No billing data yet.</div>
      )}
    </div>
  );
}
