'use client';

import * as React from 'react';

/**
 * STEP 25 — Billing ↔ Entitlement Reconciliation Panel
 *
 * Read-only view of reconciliation status between:
 * - Internal tier (stored in DB)
 * - Billing tier (Stripe-derived)
 *
 * Shows diff and recommended manual action.
 * No auto-fixes. Manual refresh only. Dashboard-only.
 */

type EntitlementDiff = {
  feature: string;
  internal: unknown;
  billing: unknown;
};

type ReconcileStatus = {
  is_synced: boolean;
  drift_type: string | null;
  drift_count: number;
};

type StatusResponse = {
  request_id: string;
  org_id: string;
  status: ReconcileStatus;
  internal_tier: string;
  billing_tier: string;
  recommended_action: string | null;
  advisory: string;
  timestamp: string;
};

type DiffResponse = {
  request_id: string;
  org_id: string;
  internal: {
    tier: string;
    tier_name: string;
    source: string;
    entitlements: Record<string, unknown>;
  };
  billing: {
    tier: string;
    tier_name: string;
    source: string;
    stripe_customer_id: string | null;
    subscription_status: string | null;
    entitlements: Record<string, unknown>;
  };
  diff: {
    is_synced: boolean;
    drift_type: string | null;
    entitlement_diffs: EntitlementDiff[];
    diff_count: number;
  };
  recommended_action: {
    action: string | null;
    description: string;
    manual_only: boolean;
  };
  timestamp: string;
};

export function BillingReconcilePanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<StatusResponse | null>(null);
  const [diff, setDiff] = React.useState<DiffResponse | null>(null);
  const [showDiff, setShowDiff] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [statusRes, diffRes] = await Promise.all([
        fetch(`${apiBase}/api/billing/reconcile/status`, { credentials: 'include' }),
        fetch(`${apiBase}/api/billing/reconcile/diff`, { credentials: 'include' }),
      ]);

      if (!statusRes.ok) throw new Error(`Status: HTTP ${statusRes.status}`);
      if (!diffRes.ok) throw new Error(`Diff: HTTP ${diffRes.status}`);

      setStatus(await statusRes.json());
      setDiff(await diffRes.json());
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load reconciliation data');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatValue = (value: unknown): string => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Billing Reconciliation</div>
          <div className="text-xs opacity-70">
            Billing ↔ Entitlement sync status. Read-only.
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

      {status ? (
        <>
          {/* Status Summary */}
          <div
            className={`mt-4 rounded-xl border p-4 ${
              status.status.is_synced
                ? 'border-green-200 bg-green-50'
                : 'border-amber-200 bg-amber-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-medium">Sync Status</div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  status.status.is_synced
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {status.status.is_synced ? 'In Sync' : 'Drift Detected'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-white p-3">
                <div className="text-xs opacity-70">Internal Tier</div>
                <div className="mt-1 text-lg font-medium capitalize">
                  {status.internal_tier}
                </div>
              </div>
              <div className="rounded-lg border bg-white p-3">
                <div className="text-xs opacity-70">Billing Tier</div>
                <div className="mt-1 text-lg font-medium capitalize">
                  {status.billing_tier}
                </div>
              </div>
            </div>

            {!status.status.is_synced && status.recommended_action ? (
              <div className="mt-4 rounded-lg border border-amber-300 bg-white p-3">
                <div className="text-xs font-medium text-amber-800">
                  Recommended Action
                </div>
                <div className="mt-1 text-sm">
                  {status.recommended_action.replace(/_/g, ' ')}
                </div>
              </div>
            ) : null}

            <div className="mt-3 text-xs opacity-70">{status.advisory}</div>
          </div>

          {/* Toggle Detailed Diff */}
          <button
            type="button"
            onClick={() => setShowDiff(!showDiff)}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            {showDiff ? 'Hide' : 'Show'} Detailed Diff
          </button>

          {/* Detailed Diff */}
          {showDiff && diff ? (
            <div className="mt-4 space-y-4">
              {/* Internal Details */}
              <div className="rounded-xl border p-4">
                <div className="font-medium mb-3">Internal Entitlements</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(diff.internal.entitlements).map(
                    ([key, value]) => (
                      <div key={key} className="text-sm">
                        <div className="text-xs opacity-70">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="font-medium">{formatValue(value)}</div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Billing Details */}
              <div className="rounded-xl border p-4">
                <div className="font-medium mb-3">Billing Entitlements</div>
                <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs opacity-70">Stripe Customer</div>
                    <div className="font-mono text-xs">
                      {diff.billing.stripe_customer_id || 'None'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs opacity-70">Subscription Status</div>
                    <div className="capitalize">
                      {diff.billing.subscription_status || 'None'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(diff.billing.entitlements).map(
                    ([key, value]) => (
                      <div key={key} className="text-sm">
                        <div className="text-xs opacity-70">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="font-medium">{formatValue(value)}</div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Entitlement Diffs */}
              {diff.diff.entitlement_diffs.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="font-medium mb-3 text-amber-800">
                    Differences ({diff.diff.diff_count})
                  </div>
                  <div className="space-y-2">
                    {diff.diff.entitlement_diffs.map((d, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border bg-white p-2 text-sm"
                      >
                        <span className="font-medium">
                          {d.feature.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600">
                            {formatValue(d.internal)}
                          </span>
                          <span className="opacity-50">→</span>
                          <span className="text-green-600">
                            {formatValue(d.billing)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                  <div className="text-sm text-green-800">
                    No entitlement differences detected
                  </div>
                </div>
              )}

              {/* Recommended Action Details */}
              <div className="rounded-xl border p-4">
                <div className="font-medium mb-2">Recommended Action</div>
                <div className="text-sm opacity-70">
                  {diff.recommended_action.description}
                </div>
                {diff.recommended_action.manual_only ? (
                  <div className="mt-2 text-xs text-amber-600">
                    This action must be performed manually.
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-3 text-xs opacity-50">
            Request ID: {status.request_id}
          </div>
        </>
      ) : null}
    </div>
  );
}
