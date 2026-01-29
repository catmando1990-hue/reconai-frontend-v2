"use client";

import useSWR from "swr";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import {
  Clock,
  FileText,
  User,
  ChevronRight,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  Settings,
  CreditCard,
} from "lucide-react";

interface AuditEntry {
  id?: string;
  actor: string;
  action: string;
  entity: string;
  entity_id: string;
  payload: Record<string, unknown>;
  timestamp: string;
  event_hash?: string;
}

interface AuditResponse {
  ok: boolean;
  entries: AuditEntry[];
  total: number;
  filtered_count: number;
}

// =============================================================================
// FORMATTING HELPERS
// =============================================================================

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

function formatAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatActorId(actor: string): string {
  // Shorten long actor IDs for display
  if (actor.startsWith("user-") && actor.length > 16) {
    return actor.slice(0, 16) + "…";
  }
  if (actor === "system") return "System";
  return actor;
}

// =============================================================================
// ACTION STYLING
// =============================================================================

interface ActionStyle {
  color: string;
  icon: typeof FileText;
}

function getActionStyle(action: string, entity: string): ActionStyle {
  // Policy events
  if (action === "policy_acknowledged") {
    return { color: "text-green-400 bg-green-500/10", icon: CheckCircle };
  }

  // Override/modification events (yellow warning)
  if (action.includes("override") || action.includes("modified")) {
    return { color: "text-yellow-400 bg-yellow-500/10", icon: AlertTriangle };
  }

  // Delete/remove events (red)
  if (
    action.includes("removed") ||
    action.includes("delete") ||
    action.includes("revoked")
  ) {
    return { color: "text-red-400 bg-red-500/10", icon: AlertTriangle };
  }

  // Sync/create events (green success)
  if (
    action.includes("sync") ||
    action.includes("create") ||
    action.includes("generated")
  ) {
    return { color: "text-green-400 bg-green-500/10", icon: CheckCircle };
  }

  // Settings/config events
  if (entity === "settings" || action.includes("config")) {
    return { color: "text-purple-400 bg-purple-500/10", icon: Settings };
  }

  // Financial/transaction events
  if (entity === "transaction" || entity === "plaid_item") {
    return { color: "text-blue-400 bg-blue-500/10", icon: CreditCard };
  }

  // Security events
  if (
    entity === "auth" ||
    action.includes("login") ||
    action.includes("token")
  ) {
    return { color: "text-orange-400 bg-orange-500/10", icon: Shield };
  }

  // Default
  return { color: "text-blue-400 bg-blue-500/10", icon: FileText };
}

// =============================================================================
// PAYLOAD DISPLAY
// =============================================================================

// Actions where we should HIDE the payload (common/noisy events)
const HIDE_PAYLOAD_ACTIONS = new Set([
  "policy_acknowledged",
  "page_viewed",
  "session_started",
  "session_ended",
]);

// Actions where we show a SUMMARY instead of full payload
const SUMMARY_ACTIONS: Record<
  string,
  (payload: Record<string, unknown>) => string | null
> = {
  transaction_override: (p) => {
    const from = p.old_category || p.from;
    const to = p.new_category || p.to;
    if (from && to) return `Changed category: ${from} → ${to}`;
    return null;
  },
  plaid_sync_completed: (p) => {
    const count = p.transaction_count || p.count;
    if (count !== undefined) return `Synced ${count} transactions`;
    return null;
  },
  export_generated: (p) => {
    const format = p.format || p.type;
    if (format) return `Format: ${format}`;
    return null;
  },
};

interface PayloadDisplayProps {
  action: string;
  payload: Record<string, unknown>;
}

function PayloadDisplay({ action, payload }: PayloadDisplayProps) {
  // No payload or empty payload
  if (!payload || Object.keys(payload).length === 0) {
    return null;
  }

  // Hide payload for noisy/common events
  if (HIDE_PAYLOAD_ACTIONS.has(action)) {
    return null;
  }

  // Check for summary handler
  const summaryFn = SUMMARY_ACTIONS[action];
  if (summaryFn) {
    const summary = summaryFn(payload);
    if (summary) {
      return <p className="mt-1 text-xs text-muted-foreground">{summary}</p>;
    }
  }

  // Filter out internal fields for display
  const displayPayload = Object.entries(payload).filter(
    ([key]) =>
      !["request_id", "version", "event_hash", "prev_hash"].includes(key),
  );

  // If only internal fields, hide
  if (displayPayload.length === 0) {
    return null;
  }

  // Show as key-value pairs (max 3 items)
  const visibleItems = displayPayload.slice(0, 3);
  const hasMore = displayPayload.length > 3;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {visibleItems.map(([key, value]) => (
        <span
          key={key}
          className="inline-flex items-center rounded bg-card/40 px-2 py-0.5 text-xs"
        >
          <span className="text-muted-foreground">{key}:</span>
          <span className="ml-1 text-foreground">
            {typeof value === "string"
              ? value.length > 20
                ? value.slice(0, 20) + "…"
                : value
              : JSON.stringify(value)}
          </span>
        </span>
      ))}
      {hasMore && (
        <span className="text-xs text-muted-foreground">
          +{displayPayload.length - 3} more
        </span>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AuditPanel() {
  const { apiFetch } = useApi();
  const { isLoaded: authReady } = useOrg();

  const { data, error, isLoading, mutate } = useSWR<AuditResponse>(
    authReady ? "/api/audit?limit=50" : null,
    apiFetch,
  );

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-medium text-foreground">Audit Log</h2>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/30" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-medium text-foreground">Audit Log</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Unable to load audit log. Please try again later.
        </p>
      </div>
    );
  }

  if (!data || !data.entries || data.entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
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
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-5">
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
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
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

      {/* Entries */}
      <div className="max-h-[500px] divide-y divide-border overflow-y-auto">
        {data.entries.map((entry, idx) => {
          const style = getActionStyle(entry.action, entry.entity);
          const Icon = style.icon;

          return (
            <div
              key={entry.id || `${entry.entity_id}-${entry.timestamp}-${idx}`}
              className="group flex items-start gap-4 p-4 transition-colors hover:bg-muted/30"
            >
              {/* Icon */}
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.color}`}
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                {/* Action + Entity badges */}
                <div className="mb-1 flex items-center gap-2 flex-wrap">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${style.color}`}
                  >
                    {formatAction(entry.action)}
                  </span>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {entry.entity}
                  </span>
                </div>

                {/* Entity ID */}
                <p className="text-sm font-medium text-foreground truncate">
                  {entry.entity_id}
                </p>

                {/* Actor + Timestamp */}
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {formatActorId(entry.actor)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>

                {/* Smart Payload Display */}
                <PayloadDisplay action={entry.action} payload={entry.payload} />
              </div>

              {/* Chevron on hover */}
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-3 text-center">
        <p className="text-xs text-muted-foreground">
          Showing {data.entries.length} of {data.total} entries
        </p>
      </div>
    </div>
  );
}
