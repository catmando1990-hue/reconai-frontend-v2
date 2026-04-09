import api from "./client";

/**
 * Intelligence endpoints — verified against backend route map.
 *
 * Backend mounts:
 *   - intelligence router               → /intelligence (alerts, insights, worker tasks)
 *   - intelligence_cashflow_api         → /api/intelligence/cashflow/*
 *   - intelligence_duplicates_api       → /api/intelligence/duplicates
 *   - intelligence_status_api           → /api/intelligence/status
 *   - signals router                    → /signals (or wherever mounted)
 */

/** GET /intelligence/alerts — financial alerts and anomalies */
export function getAlerts() {
  return api.get("/intelligence/alerts");
}

/** GET /intelligence/insights — intelligence summary */
export function getInsights() {
  return api.get("/intelligence/insights");
}

/** GET /intelligence/worker/tasks — background worker task queue */
export function getWorkerTasks() {
  return api.get("/intelligence/worker/tasks");
}

/** GET /api/intelligence/duplicates — duplicate detection results */
export function getDuplicates() {
  return api.get("/api/intelligence/duplicates");
}

/** GET /api/intelligence/cashflow/insights — cashflow insights */
export function getCashflowInsights() {
  return api.get("/api/intelligence/cashflow/insights");
}

/** GET /api/intelligence/status — intelligence feature status */
export function getIntelligenceStatus() {
  return api.get("/api/intelligence/status");
}

/** GET /signals — financial signal detection */
export function getSignals() {
  return api.get("/signals");
}
