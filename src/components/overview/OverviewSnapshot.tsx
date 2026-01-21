"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  StatusChip,
  type StatusVariant,
} from "@/components/dashboard/StatusChip";
import { cn } from "@/lib/utils";

type SystemStatus = {
  ok: boolean;
  maintenance?:
    | { enabled: boolean }
    | { enabled: boolean; reason?: string | null };
  maintenance_enabled?: boolean;
  signals_24h?: number;
  audit_total?: number;
  last_plaid_sync?: string | null;
};

type TxRow = {
  id: string | number;
  duplicate?: boolean;
};

function fmtRelative(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function healthVariant(ok?: boolean): StatusVariant {
  return ok ? "ok" : "warn";
}

export function OverviewSnapshot({ className }: { className?: string }) {
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [txs, setTxs] = useState<TxRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [sys, tx] = await Promise.all([
          apiFetch<SystemStatus>("/api/system/status"),
          apiFetch<TxRow[]>("/api/transactions").catch(() => []),
        ]);
        if (cancelled) return;
        setSystem(sys);
        setTxs(tx ?? []);
      } catch {
        if (cancelled) return;
        setSystem(null);
        setTxs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const txCount = txs?.length ?? 0;
  const dupCount = useMemo(
    () => (txs ?? []).filter((t) => Boolean(t.duplicate)).length,
    [txs],
  );

  const maintenanceEnabled =
    (typeof system?.maintenance === "object" && system.maintenance?.enabled) ||
    system?.maintenance_enabled ||
    false;

  const tiles: Array<{
    label: string;
    value: string;
    chip: { label: string; variant: StatusVariant };
    sub?: string;
  }> = [
    {
      label: "API Health",
      value: system ? (system.ok ? "OK" : "Degraded") : loading ? "…" : "—",
      chip: {
        label: system ? (system.ok ? "OK" : "Warn") : "—",
        variant: healthVariant(system?.ok),
      },
      sub: "Authenticated health surface",
    },
    {
      label: "Maintenance",
      value: system ? (maintenanceEnabled ? "ON" : "OFF") : loading ? "…" : "—",
      chip: {
        label: system ? (maintenanceEnabled ? "Active" : "Normal") : "—",
        variant: maintenanceEnabled ? "warn" : "ok",
      },
      sub: maintenanceEnabled
        ? "Protected routes blocked for non-admin"
        : "System open",
    },
    {
      // P0 FIX: Don't coerce null/undefined to 0 - show "—" for unknown values
      label: "Signals (24h)",
      value: system
        ? system.signals_24h !== null && system.signals_24h !== undefined
          ? String(system.signals_24h)
          : "—"
        : loading
          ? "…"
          : "—",
      chip: {
        label: system
          ? system.signals_24h !== null && system.signals_24h !== undefined
            ? system.signals_24h > 0
              ? "Review"
              : "Quiet"
            : "Unknown"
          : "—",
        variant: system
          ? system.signals_24h !== null && system.signals_24h !== undefined
            ? system.signals_24h > 0
              ? "warn"
              : "ok"
            : "unknown"
          : "muted",
      },
      sub: "Server-side signals surface",
    },
    {
      // P0 FIX: Don't coerce null/undefined to 0 - show "—" for unknown values
      label: "Audit Events",
      value: system
        ? system.audit_total !== null && system.audit_total !== undefined
          ? String(system.audit_total)
          : "—"
        : loading
          ? "…"
          : "—",
      chip: { label: "Read-only", variant: "muted" },
      sub: "Compliance trail",
    },
    {
      label: "Transactions",
      value: txs ? String(txCount) : loading ? "…" : "—",
      chip: { label: "Read-only", variant: "muted" },
      sub: "Normalized feed",
    },
    {
      label: "Duplicates",
      value: txs ? String(dupCount) : loading ? "…" : "—",
      chip: {
        label: txs ? (dupCount > 0 ? "Investigate" : "Clear") : "—",
        variant: txs ? (dupCount > 0 ? "warn" : "ok") : "muted",
      },
      sub: "Duplicate flag from backend",
    },
    {
      label: "Plaid Sync",
      value: system
        ? fmtRelative(system.last_plaid_sync ?? null)
        : loading
          ? "…"
          : "—",
      chip: { label: "Guarded", variant: "muted" },
      sub: "Sync hardening enforced",
    },
  ];

  return (
    <Card className={cn("border bg-card/50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Operational Snapshot
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Read-only telemetry across integrity, compliance, and ingestion.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t) => (
            <div
              key={t.label}
              className="rounded-xl border border-border/70 bg-background/40 p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-medium text-muted-foreground">
                  {t.label}
                </div>
                <StatusChip variant={t.chip.variant}>{t.chip.label}</StatusChip>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-2xl font-semibold tracking-tight">
                  {t.value}
                </div>
              </div>
              {t.sub ? (
                <div className="mt-1 text-xs text-muted-foreground">
                  {t.sub}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
