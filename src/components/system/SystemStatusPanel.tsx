"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { Activity, Database, Clock, AlertCircle, RefreshCw } from "lucide-react";

interface SystemStatusData {
  ok: boolean;
  api: string;
  maintenance: boolean;
  signals_24h: number;
  audit_total: number;
  last_plaid_sync: string | null;
  timestamp: string;
}

/**
 * BUILD 11: System health status panel for admin dashboard.
 * Manual refresh only - no polling.
 * Uses authenticated apiFetch.
 */
export default function SystemStatusPanel() {
  // Manual-first UX: No polling. User triggers refresh manually.
  const { data, error, isLoading, mutate } = useSWR<SystemStatusData>(
    "/api/system/status",
    apiFetch,
    {
      revalidateOnFocus: false,
    },
  );

  if (isLoading) {
    return (
      <div className="text-xs text-muted-foreground">
        Loading system status...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-400">
        <AlertCircle className="h-3 w-3" />
        <span>Status unavailable</span>
      </div>
    );
  }

  const formatTimestamp = (ts: string | null): string => {
    if (!ts) return "Never";
    try {
      const date = new Date(ts);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
      return `${Math.floor(diffMins / 1440)}d ago`;
    } catch {
      return ts;
    }
  };

  return (
    <div className="flex items-center gap-4 text-xs">
      {/* Manual Refresh Button */}
      <button
        onClick={() => mutate()}
        disabled={isLoading}
        className="flex items-center gap-1 rounded border border-white/10 bg-card/60 px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground disabled:opacity-50"
        title="Refresh status"
      >
        <RefreshCw className={`h-2.5 w-2.5 ${isLoading ? "animate-spin" : ""}`} />
      </button>

      {/* API Status */}
      <div className="flex items-center gap-1.5">
        <Activity
          className={`h-3 w-3 ${data.api === "ok" ? "text-green-400" : "text-red-400"}`}
        />
        <span className="text-muted-foreground">
          API: {data.api === "ok" ? "Healthy" : "Degraded"}
        </span>
      </div>

      {/* Signals 24h */}
      <div className="flex items-center gap-1.5">
        <Database className="h-3 w-3 text-muted-foreground" />
        <span className="text-muted-foreground">
          {data.signals_24h} signals (24h)
        </span>
      </div>

      {/* Last Plaid Sync */}
      <div className="flex items-center gap-1.5">
        <Clock className="h-3 w-3 text-muted-foreground" />
        <span className="text-muted-foreground">
          Plaid: {formatTimestamp(data.last_plaid_sync)}
        </span>
      </div>

      {/* Maintenance indicator */}
      {data.maintenance && (
        <div className="rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-400">
          Maintenance ON
        </div>
      )}
    </div>
  );
}
