"use client";

import * as React from "react";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";

type FinancialControl = {
  org_id: string;
  soft_spending_limit_cents?: number;
  approval_threshold_cents?: number;
  upgrade_cap_tier?: string;
  alerts_mode: "audit_only" | "notify";
  request_id: string;
};

type Alert = {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  threshold_cents?: number;
  current_cents?: number;
};

type AlertsResponse = {
  request_id: string;
  alerts: Alert[];
};

export function BillingFinancialControlsPanel({
  apiBase,
}: {
  apiBase: string;
}) {
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [controls, setControls] = React.useState<FinancialControl | null>(null);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [showAlerts, setShowAlerts] = React.useState(false);

  // Form state
  const [softLimit, setSoftLimit] = React.useState("");
  const [approvalThreshold, setApprovalThreshold] = React.useState("");
  const [upgradeCap, setUpgradeCap] = React.useState("");

  const fetchControls = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const json = await auditedFetch<FinancialControl>(
        `${apiBase}/api/billing/controls`,
        { credentials: "include" },
      );
      setControls(json);
      if (json.soft_spending_limit_cents)
        setSoftLimit(String(json.soft_spending_limit_cents / 100));
      if (json.approval_threshold_cents)
        setApprovalThreshold(String(json.approval_threshold_cents / 100));
      if (json.upgrade_cap_tier) setUpgradeCap(json.upgrade_cap_tier);
    } catch (e: unknown) {
      if (e instanceof AuditProvenanceError) {
        setErr(`Provenance error: ${e.message}`);
      } else if (e instanceof HttpError) {
        setErr(`HTTP ${e.status}: ${e.message}`);
      } else {
        setErr(e instanceof Error ? e.message : "Failed to load controls");
      }
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const fetchAlerts = React.useCallback(async () => {
    try {
      const json = await auditedFetch<AlertsResponse>(
        `${apiBase}/api/billing/controls/alerts`,
        { credentials: "include" },
      );
      setAlerts(json.alerts || []);
    } catch {
      // Ignore alert fetch errors
    }
  }, [apiBase]);

  const saveControls = async () => {
    setSaving(true);
    setErr(null);
    try {
      const body: Record<string, unknown> = {};
      if (softLimit)
        body.soft_spending_limit_cents = Math.round(
          parseFloat(softLimit) * 100,
        );
      if (approvalThreshold)
        body.approval_threshold_cents = Math.round(
          parseFloat(approvalThreshold) * 100,
        );
      if (upgradeCap) body.upgrade_cap_tier = upgradeCap;

      const json = await auditedFetch<FinancialControl>(
        `${apiBase}/api/billing/controls`,
        {
          method: "POST",
          credentials: "include",
          body: JSON.stringify(body),
        },
      );

      setControls(json);
    } catch (e: unknown) {
      if (e instanceof AuditProvenanceError) {
        setErr(`Provenance error: ${e.message}`);
      } else if (e instanceof HttpError) {
        setErr(`HTTP ${e.status}: ${e.message}`);
      } else {
        setErr(e instanceof Error ? e.message : "Failed to save controls");
      }
    } finally {
      setSaving(false);
    }
  };

  React.useEffect(() => {
    // Manual-first UX: fetch once on mount only (no polling).
    fetchControls();
    fetchAlerts();
  }, [fetchControls, fetchAlerts]);

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Financial Controls</div>
          <div className="text-xs opacity-70">
            Soft limits and approval thresholds (audit-only alerts).
          </div>
        </div>
        <button
          type="button"
          onClick={fetchControls}
          disabled={loading}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {err ? <div className="mt-3 text-sm text-red-500">{err}</div> : null}

      <div className="mt-4 grid gap-3">
        <div>
          <label className="text-xs opacity-70 block mb-1">
            Soft Spending Limit ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={softLimit}
            onChange={(e) => setSoftLimit(e.target.value)}
            placeholder="e.g. 1000.00"
            className="rounded-lg border px-3 py-2 text-sm w-full"
          />
        </div>
        <div>
          <label className="text-xs opacity-70 block mb-1">
            Approval Threshold ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={approvalThreshold}
            onChange={(e) => setApprovalThreshold(e.target.value)}
            placeholder="e.g. 500.00"
            className="rounded-lg border px-3 py-2 text-sm w-full"
          />
        </div>
        <div>
          <label className="text-xs opacity-70 block mb-1">
            Upgrade Cap Tier
          </label>
          <select
            value={upgradeCap}
            onChange={(e) => setUpgradeCap(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm w-full"
          >
            <option value="">No cap</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <button
          type="button"
          onClick={saveControls}
          disabled={saving}
          className="rounded-xl border bg-blue-600 text-white px-4 py-2 text-sm mt-2"
        >
          {saving ? "Saving..." : "Save Controls"}
        </button>
      </div>

      {controls ? (
        <div className="mt-4 rounded-xl border p-3 text-sm">
          <div className="flex justify-between">
            <span className="opacity-70">Alerts Mode</span>
            <span>{controls.alerts_mode}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">Request ID</span>
            <span className="font-mono text-xs">{controls.request_id}</span>
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowAlerts(!showAlerts)}
          className="text-sm text-blue-600 underline"
        >
          {showAlerts ? "Hide Alerts" : `Show Alerts (${alerts.length})`}
        </button>
        {showAlerts && alerts.length > 0 ? (
          <div className="mt-2 grid gap-2">
            {alerts.map((a) => (
              <div key={a.id} className="rounded-lg border p-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{a.type}</span>
                  <span className="text-xs opacity-70">{a.timestamp}</span>
                </div>
                <div className="text-xs opacity-70 mt-1">{a.message}</div>
              </div>
            ))}
          </div>
        ) : showAlerts ? (
          <div className="mt-2 text-sm opacity-70">No alerts.</div>
        ) : null}
      </div>
    </div>
  );
}
