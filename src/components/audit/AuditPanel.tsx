"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { Clock, FileText, User, ChevronRight, RefreshCw } from "lucide-react";

interface AuditEntry {
  actor: string;
  action: string;
  entity: string;
  entity_id: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

interface AuditResponse {
  ok: boolean;
  entries: AuditEntry[];
  total: number;
  filtered_count: number;
}

const fetcher = (url: string) => apiFetch<AuditResponse>(url);

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getActionColor(action: string): string {
  if (action.includes("override")) return "text-yellow-400 bg-yellow-500/10";
  if (action.includes("removed") || action.includes("delete"))
    return "text-red-400 bg-red-500/10";
  if (action.includes("sync") || action.includes("create"))
    return "text-green-400 bg-green-500/10";
  return "text-blue-400 bg-blue-500/10";
}

export default function AuditPanel() {
  // Manual-first UX: No polling. User triggers refresh manually.
  const { data, error, isLoading, mutate } = useSWR(
    "/api/audit?limit=50",
    fetcher,
  );

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/5 bg-card/70 p-6 backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-medium text-foreground">Audit Log</h2>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-card/30" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-white/5 bg-card/70 p-6 backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-medium text-foreground">Audit Log</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Unable to load audit log. Backend may be unavailable.
        </p>
      </div>
    );
  }

  if (!data || !data.entries || data.entries.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 bg-card/70 p-6 backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-medium text-foreground">Audit Log</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          No audit entries recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-card/70 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/5 p-5">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-medium text-foreground">Audit Log</h2>
            <p className="text-xs text-muted-foreground">
              {data.total} total entries
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground disabled:opacity-50"
            title="Refresh audit log"
          >
            <RefreshCw
              className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Read-Only
          </span>
        </div>
      </div>

      <div className="max-h-96 divide-y divide-white/5 overflow-y-auto">
        {data.entries.map((entry, idx) => (
          <div
            key={`${entry.entity_id}-${entry.timestamp}-${idx}`}
            className="group flex items-start gap-4 p-4 transition-colors hover:bg-white/[0.02]"
          >
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${getActionColor(entry.action)}`}
            >
              <FileText className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${getActionColor(entry.action)}`}
                >
                  {entry.action.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {entry.entity}
                </span>
              </div>

              <p className="truncate text-sm text-foreground">
                {entry.entity_id}
              </p>

              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {entry.actor}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimestamp(entry.timestamp)}
                </span>
              </div>

              {entry.payload && Object.keys(entry.payload).length > 0 && (
                <div className="mt-2 rounded bg-card/30 p-2">
                  <pre className="overflow-x-auto text-xs text-muted-foreground">
                    {JSON.stringify(entry.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        ))}
      </div>

      <div className="border-t border-white/5 p-3 text-center">
        <p className="text-xs text-muted-foreground">
          Showing {data.entries.length} of {data.total} entries
        </p>
      </div>
    </div>
  );
}
