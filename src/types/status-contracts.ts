/**
 * ============================================================================
 * PHASE 5: STATUS TRUTH CONTRACTS
 * ============================================================================
 *
 * These types enforce strict status contracts across the frontend.
 * UI components must use these types - no raw strings or booleans.
 *
 * RULES:
 * - null or missing fields MUST map to "unknown"
 * - No implicit conversions allowed
 * - No fallback to "ok", "live", or "connected" without backend confirmation
 * - All status displays must use these typed interfaces
 *
 * ============================================================================
 */

/**
 * Connection Status Contract
 *
 * Used for: Plaid bank connections, API health, data source status
 *
 * - "active": Backend confirms healthy, active connection
 * - "error": Backend reports error state
 * - "requires_action": User action needed (re-auth, reconnect)
 * - "disconnected": Explicitly disconnected by user or system
 * - "unknown": Cannot determine status - FAIL-CLOSED DEFAULT
 */
export type ConnectionStatus =
  | "active"
  | "error"
  | "requires_action"
  | "disconnected"
  | "unknown";

/**
 * Plaid-specific connection status
 * Maps to backend PlaidItemStatus enum
 */
export type PlaidConnectionStatus =
  | "active"
  | "login_required"
  | "error"
  | "unknown"
  | "not_connected";

/**
 * Sync Status Contract
 *
 * Used for: Data sync operations, transaction syncs
 *
 * - "synced": Last sync completed successfully
 * - "syncing": Currently syncing (only show if backend confirms)
 * - "failed": Last sync failed
 * - "pending": Sync requested but not started
 * - "unknown": Cannot determine sync status
 */
export type SyncStatus =
  | "synced"
  | "syncing"
  | "failed"
  | "pending"
  | "unknown";

/**
 * Health Status Contract
 *
 * Used for: System health, API health, service health
 *
 * - "healthy": All checks pass
 * - "degraded": Partial issues but operational
 * - "unhealthy": Critical issues
 * - "unknown": Cannot determine health
 */
export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

/**
 * Data Mode Contract
 *
 * Used for: Indicating whether data is live or demo
 *
 * - "live": Real production data from backend
 * - "demo": Sample/mock data (must be explicitly labeled)
 * - "unknown": Cannot determine data source
 */
export type DataMode = "live" | "demo" | "unknown";

/**
 * Data Freshness Contract
 *
 * NEVER display "Just now", "2m ago", etc. without backend timestamp.
 * If timestamp is null/undefined, show "Unknown".
 */
export interface DataFreshness {
  /**
   * ISO timestamp from backend. If null, freshness is unknown.
   */
  lastUpdated: string | null;

  /**
   * Data source for transparency
   */
  source: "backend" | "cache" | "unknown";
}

/**
 * Plaid Status Response Contract
 *
 * This matches the backend PlaidStatusResponse and frontend API route.
 * All fields are explicitly typed - no implicit "ok" or "connected".
 */
export interface PlaidStatusResponse {
  status: PlaidConnectionStatus;
  items_count: number | null;
  last_synced_at: string | null;
  has_items: boolean;
  environment: string | null;
  source: "backend_items" | "backend_hardening" | "unknown";
}

/**
 * Dashboard Metrics Status
 *
 * Used for: Financial metrics, counts, summaries
 *
 * null means "unknown" - never display as 0 or "--"
 */
export interface MetricValue {
  value: number | null;
  status: "loaded" | "loading" | "error" | "unknown";
}

/**
 * System Status Panel Contract
 */
export interface SystemStatusData {
  api: HealthStatus;
  last_plaid_sync: string | null;
  signals_24h: number | null;
  maintenance: boolean;
}

// ============================================================================
// HELPER FUNCTIONS - Use these to enforce fail-closed behavior
// ============================================================================

/**
 * Safely get connection status - defaults to "unknown" for any falsy value
 */
export function safeConnectionStatus(
  status: string | null | undefined
): ConnectionStatus {
  const validStatuses: ConnectionStatus[] = [
    "active",
    "error",
    "requires_action",
    "disconnected",
    "unknown",
  ];

  if (status && validStatuses.includes(status as ConnectionStatus)) {
    return status as ConnectionStatus;
  }

  // FAIL-CLOSED: Unknown if not explicitly valid
  return "unknown";
}

/**
 * Safely get Plaid status - defaults to "unknown" for any invalid value
 */
export function safePlaidStatus(
  status: string | null | undefined
): PlaidConnectionStatus {
  const validStatuses: PlaidConnectionStatus[] = [
    "active",
    "login_required",
    "error",
    "unknown",
    "not_connected",
  ];

  if (status && validStatuses.includes(status as PlaidConnectionStatus)) {
    return status as PlaidConnectionStatus;
  }

  // FAIL-CLOSED: Unknown if not explicitly valid
  return "unknown";
}

/**
 * Safely get health status - defaults to "unknown" for any invalid value
 */
export function safeHealthStatus(
  status: string | null | undefined
): HealthStatus {
  const validStatuses: HealthStatus[] = [
    "healthy",
    "degraded",
    "unhealthy",
    "unknown",
  ];

  if (status && validStatuses.includes(status as HealthStatus)) {
    return status as HealthStatus;
  }

  // FAIL-CLOSED: Unknown if not explicitly valid
  return "unknown";
}

/**
 * Format timestamp safely - returns "Unknown" if null/invalid
 *
 * NEVER returns fabricated times like "Just now" or "2m ago"
 */
export function safeFormatTimestamp(timestamp: string | null | undefined): string {
  if (!timestamp) {
    return "Unknown";
  }

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return "Unknown";
    }
    return date.toLocaleString();
  } catch {
    return "Unknown";
  }
}

/**
 * Format relative time safely - returns "Unknown" if null/invalid
 *
 * Only use this if you have a REAL timestamp from backend.
 */
export function safeFormatRelativeTime(
  timestamp: string | null | undefined
): string {
  if (!timestamp) {
    return "Unknown";
  }

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return "Unknown";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  } catch {
    return "Unknown";
  }
}

/**
 * Safe metric display - returns "Unknown" for null, actual value otherwise
 *
 * NEVER returns "0" for null values - that's a lie.
 */
export function safeMetricDisplay(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Unknown";
  }
  return value.toLocaleString();
}

/**
 * Safe currency display - returns "Unknown" for null
 */
export function safeCurrencyDisplay(
  value: number | null | undefined,
  currency = "USD"
): string {
  if (value === null || value === undefined) {
    return "Unknown";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

// ============================================================================
// STATUS LABEL MAPS - Consistent, honest labels
// ============================================================================

export const CONNECTION_STATUS_LABELS: Record<ConnectionStatus, string> = {
  active: "Active",
  error: "Error",
  requires_action: "Action Required",
  disconnected: "Disconnected",
  unknown: "Unknown",
};

export const PLAID_STATUS_LABELS: Record<PlaidConnectionStatus, string> = {
  active: "Active",
  login_required: "Needs Re-auth",
  error: "Error",
  unknown: "Unknown",
  not_connected: "Not Connected",
};

export const HEALTH_STATUS_LABELS: Record<HealthStatus, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  unhealthy: "Unhealthy",
  unknown: "Unknown",
};

export const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  synced: "Synced",
  syncing: "Syncing",
  failed: "Failed",
  pending: "Pending",
  unknown: "Unknown",
};
