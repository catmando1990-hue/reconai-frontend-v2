import api from "./client";

/**
 * CFO endpoints — verified against backend route map.
 *
 * Backend mounts:
 *   - cfo router       → /cfo (legacy snapshot)
 *   - cfo_controls_api → /api/cfo (overview/forecast/exceptions/stats)
 *   - dashboard router → /api/dashboard, /dashboard
 */

// ── CFO snapshot (legacy) ──

/** GET /cfo/snapshot — basic CFO snapshot (legacy router) */
export function getSnapshot() {
  return api.get("/cfo/snapshot");
}

// ── CFO Financial Controls (cfo_controls_api) ──

/** GET /api/cfo/overview — financial controls overview (cash flow, burn, runway) */
export function getOverview() {
  return api.get("/api/cfo/overview");
}

/** GET /api/cfo/forecast — financial forecasts and projections */
export function getForecast() {
  return api.get("/api/cfo/forecast");
}

/** GET /api/cfo/exceptions — exception detection (alerts, soft limits) */
export function getExceptions() {
  return api.get("/api/cfo/exceptions");
}

/** GET /api/cfo/stats — CFO summary stats */
export function getStats() {
  return api.get("/api/cfo/stats");
}

// ── Unified Dashboard Overview (dashboard_overview router) ──

/** GET /api/dashboard/overview — unified CFO dashboard (cash in/out, runway, top vendors) */
export function getDashboard() {
  return api.get("/api/dashboard/overview");
}

/** GET /dashboard/metrics — chart data, signal summaries (dashboard_metrics_api) */
export function getMetrics() {
  return api.get("/dashboard/metrics");
}

// ── Intelligence (re-exported for CFO Intelligence page) ──

/** GET /intelligence/alerts — financial alerts/anomalies */
export function getAlerts() {
  return api.get("/intelligence/alerts");
}

/** GET /intelligence/insights — intelligence summary */
export function getInsights() {
  return api.get("/intelligence/insights");
}

/** GET /api/intelligence/cashflow/insights — cashflow insights, burn rate, runway */
export function getCashflowInsights() {
  return api.get("/api/intelligence/cashflow/insights");
}

/** GET /api/intelligence/duplicates — duplicate transaction detection */
export function getDuplicates() {
  return api.get("/api/intelligence/duplicates");
}

/** GET /api/intelligence/status — intelligence feature status */
export function getIntelligenceStatus() {
  return api.get("/api/intelligence/status");
}
