"use client";

import useSWR from "swr";

import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

type SystemStatus = {
  api?: string;
  maintenance?: boolean | { enabled?: boolean };
  enabled?: boolean; // some implementations return { ok, enabled }
  signals_24h?: number;
  audit_total?: number;
  last_plaid_sync?: string | null;
  updated_at?: string | null;
  reason?: string | null;
};

type TransactionRow = {
  id: string | number;
  duplicate?: boolean;
};

function getMaintenanceEnabled(s: SystemStatus | undefined): boolean {
  if (!s) return false;
  if (typeof s.maintenance === "boolean") return s.maintenance;
  if (typeof s.maintenance === "object" && s.maintenance) {
    return Boolean(s.maintenance.enabled);
  }
  if (typeof s.enabled === "boolean") return s.enabled;
  return false;
}

function formatMaybeDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function MetricCard(props: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  const { label, value, sub } = props;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold tracking-tight">
          {value}
        </div>
        {sub ? (
          <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function OverviewSnapshot(props: { refreshMs?: number }) {
  const refreshInterval = props.refreshMs ?? 30000;

  // Disable automatic retries on error to prevent flooding the API
  const swrOptions = {
    refreshInterval,
    errorRetryCount: 1,
    errorRetryInterval: 10000, // Wait 10s before retry on error
    shouldRetryOnError: false, // Don't auto-retry on 401/other errors
  };

  const { data: status } = useSWR<SystemStatus>(
    "/api/system/status",
    (url: string) => apiFetch<SystemStatus>(url),
    swrOptions,
  );

  const { data: txs } = useSWR<TransactionRow[]>(
    "/api/transactions",
    (url: string) => apiFetch<TransactionRow[]>(url),
    swrOptions,
  );

  const txCount = Array.isArray(txs) ? txs.length : 0;
  const dupCount = Array.isArray(txs)
    ? txs.reduce((acc, t) => acc + (t?.duplicate ? 1 : 0), 0)
    : 0;

  const maintenanceEnabled = getMaintenanceEnabled(status);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Transactions"
          value={txCount}
          sub={
            dupCount ? `${dupCount} flagged duplicate` : "No duplicates flagged"
          }
        />
        <MetricCard
          label="Signals (24h)"
          value={status?.signals_24h ?? "—"}
          sub="Server-side detections"
        />
        <MetricCard
          label="Audit entries"
          value={status?.audit_total ?? "—"}
          sub="Compliance trail"
        />
        <MetricCard
          label="Maintenance"
          value={maintenanceEnabled ? "ON" : "OFF"}
          sub={
            maintenanceEnabled
              ? status?.reason
                ? `Reason: ${status.reason}`
                : "System paused"
              : "Normal operation"
          }
        />
        <MetricCard
          label="Last Plaid sync"
          value={formatMaybeDate(status?.last_plaid_sync ?? null)}
          sub="Incremental cursor sync"
        />
        <MetricCard
          label="API"
          value={status?.api ?? "—"}
          sub="Backend health"
        />
      </div>

      {maintenanceEnabled && status?.updated_at ? (
        <div className="text-xs text-muted-foreground">
          Maintenance last updated: {formatMaybeDate(status.updated_at)}
        </div>
      ) : null}
    </div>
  );
}
