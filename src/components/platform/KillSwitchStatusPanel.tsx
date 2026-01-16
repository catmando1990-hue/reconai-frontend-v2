"use client";

import * as React from "react";

/**
 * STEP 24 — Kill-Switch Status Panel
 *
 * Read-only view of kill-switch status for all features.
 * Shows intentional, explanatory states when features are disabled.
 *
 * Manual refresh only. Dashboard-only.
 */

type FeatureStatus = {
  env_var: string;
  is_killed: boolean;
  status: "enabled" | "disabled";
};

type KillSwitchResponse = {
  request_id: string;
  features: Record<string, FeatureStatus>;
  summary: {
    total: number;
    enabled: number;
    disabled: number;
    all_enabled: boolean;
  };
  timestamp: string;
};

export function KillSwitchStatusPanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [data, setData] = React.useState<KillSwitchResponse | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${apiBase}/api/killswitch/status`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: unknown) {
      setErr(
        e instanceof Error ? e.message : "Failed to load kill-switch status",
      );
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatFeatureName = (name: string) => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Feature Kill-Switches</div>
          <div className="text-xs opacity-70">
            System-level feature toggles. Read-only.
          </div>
        </div>
        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {err ? <div className="mt-3 text-sm text-red-500">{err}</div> : null}

      {data ? (
        <>
          {/* Summary */}
          <div className="mt-4 rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">System Status</div>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  data.summary.all_enabled
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {data.summary.all_enabled ? "All Enabled" : "Some Disabled"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {data.summary.enabled}
                </div>
                <div className="text-xs opacity-70">Enabled</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  {data.summary.disabled}
                </div>
                <div className="text-xs opacity-70">Disabled</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{data.summary.total}</div>
                <div className="text-xs opacity-70">Total</div>
              </div>
            </div>
          </div>

          {/* Feature List */}
          <div className="mt-4 space-y-2">
            {Object.entries(data.features).map(([feature, status]) => (
              <div
                key={feature}
                className={`flex items-center justify-between rounded-xl border p-3 ${
                  status.is_killed ? "bg-amber-50 border-amber-200" : ""
                }`}
              >
                <div>
                  <div className="font-medium text-sm">
                    {formatFeatureName(feature)}
                  </div>
                  <div className="text-xs opacity-50 font-mono">
                    {status.env_var}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    status.is_killed
                      ? "bg-amber-100 text-amber-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {status.status}
                </span>
              </div>
            ))}
          </div>

          {/* Disabled Features Warning */}
          {!data.summary.all_enabled ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm font-medium text-amber-800">
                Some Features Disabled
              </div>
              <div className="mt-1 text-xs text-amber-600">
                One or more features have been temporarily disabled via
                kill-switch. This is intentional and controlled by system
                administrators. Please try again later.
              </div>
            </div>
          ) : null}

          <div className="mt-3 text-xs opacity-50">
            Request ID: {data.request_id}
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * useKillSwitchStatus - Hook to check kill-switch status
 *
 * Returns status for a specific feature.
 * Use this to conditionally show disabled states.
 */
export function useKillSwitchStatus(apiBase: string) {
  const [features, setFeatures] = React.useState<Record<
    string,
    FeatureStatus
  > | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchStatus = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/killswitch/status`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: KillSwitchResponse = await res.json();
      setFeatures(data.features);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const isFeatureKilled = (feature: string): boolean => {
    if (!features) return false;
    return features[feature]?.is_killed ?? false;
  };

  return {
    features,
    loading,
    error,
    isFeatureKilled,
    refresh: fetchStatus,
  };
}
