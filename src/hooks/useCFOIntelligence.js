import { useState, useEffect, useCallback, useRef } from "react";
import { cfoApi } from "@/api";

/**
 * useCFOIntelligence Hook
 *
 * CFO module's AI signal surface for executive finance.
 *
 * Categories:
 * - runway risk
 * - burn anomalies
 * - forecast deviation
 * - cash flow volatility
 * - receivables/payables risk
 *
 * Canonical behavior:
 * - Auto and manual refresh
 * - Confidence-gated by default
 * - Fail-closed on errors
 * - Auth-gated and org-scoped
 */

// Signal categories
export const SIGNAL_CATEGORIES = {
  RUNWAY_RISK: "runway_risk",
  BURN_ANOMALY: "burn_anomaly",
  FORECAST_DEVIATION: "forecast_deviation",
  CASH_FLOW_VOLATILITY: "cash_flow_volatility",
  RECEIVABLES_RISK: "receivables_risk",
  PAYABLES_RISK: "payables_risk",
};

// Severity levels
export const SEVERITY = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  INFO: "info",
};

// Default confidence threshold - signals below this are filtered by default
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.7;

// Auto-refresh interval (5 minutes)
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;

// Fail-closed default state
const FAILED_STATE = {
  signals: [],
  lifecycle: "failed",
  reason_code: "fetch_error",
  reason_message: "Unable to load CFO Intelligence signals",
};

/**
 * Normalize a single signal from the backend response.
 * Handles snake_case → camelCase where needed, keeping the shape
 * that SignalCard and EvidenceModal expect.
 */
function normalizeSignal(raw) {
  return {
    id: raw.id,
    category: raw.category,
    severity: raw.severity,
    confidence: raw.confidence,
    title: raw.title,
    description: raw.description,
    evidence: raw.evidence ?? null,
    advisory_disclaimer:
      raw.advisory_disclaimer ?? raw.advisoryDisclaimer ?? null,
    created_at: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
  };
}

/**
 * Fetch CFO intelligence signals from the backend.
 * Combines alerts and insights into a unified signal list.
 */
async function fetchCFOIntelligence() {
  // Fetch alerts and insights in parallel
  const [alertsRaw, insightsRaw] = await Promise.all([
    cfoApi.getAlerts().catch((err) => {
      console.warn("[useCFOIntelligence] Failed to fetch alerts:", err.message);
      return null;
    }),
    cfoApi.getInsights().catch((err) => {
      console.warn(
        "[useCFOIntelligence] Failed to fetch insights:",
        err.message,
      );
      return null;
    }),
  ]);

  // Both failed — bubble up
  if (!alertsRaw && !insightsRaw) {
    throw new Error("Failed to fetch both alerts and insights");
  }

  // Merge and normalize signals from both endpoints
  const alertSignals = Array.isArray(alertsRaw?.signals)
    ? alertsRaw.signals
    : Array.isArray(alertsRaw)
      ? alertsRaw
      : [];
  const insightSignals = Array.isArray(insightsRaw?.signals)
    ? insightsRaw.signals
    : Array.isArray(insightsRaw)
      ? insightsRaw
      : [];

  const allRawSignals = [...alertSignals, ...insightSignals];
  const signals = allRawSignals.map(normalizeSignal);

  // Derive lifecycle from the responses
  const lifecycle =
    alertsRaw?.lifecycle === "pending" || insightsRaw?.lifecycle === "pending"
      ? "pending"
      : alertsRaw?.lifecycle === "failed" && insightsRaw?.lifecycle === "failed"
        ? "failed"
        : "success";

  return {
    lifecycle,
    reason_code: alertsRaw?.reason_code ?? insightsRaw?.reason_code ?? null,
    reason_message:
      alertsRaw?.reason_message ?? insightsRaw?.reason_message ?? null,
    signals,
  };
}

/**
 * useCFOIntelligence Hook
 *
 * @param {Object} options
 * @param {boolean} options.includeLowConfidence - Include signals below threshold
 * @param {boolean} options.autoRefresh - Enable auto-refresh
 * @returns {Object} Hook state and methods
 */
export function useCFOIntelligence(options = {}) {
  const { includeLowConfidence = false, autoRefresh = true } = options;

  const [state, setState] = useState({
    signals: [],
    allSignals: [],
    isLoading: true,
    error: null,
    lifecycle: "loading",
    reasonCode: null,
    reasonMessage: null,
    lastUpdated: null,
  });

  const autoRefreshRef = useRef(null);

  const fetch = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetchCFOIntelligence();

      // Handle lifecycle states
      if (response.lifecycle === "success") {
        const allSignals = response.signals || [];
        const filteredSignals = includeLowConfidence
          ? allSignals
          : allSignals.filter(
              (s) => s.confidence >= DEFAULT_CONFIDENCE_THRESHOLD,
            );

        setState({
          signals: filteredSignals,
          allSignals: allSignals,
          isLoading: false,
          error: null,
          lifecycle: "success",
          reasonCode: null,
          reasonMessage: null,
          lastUpdated: new Date(),
        });
      } else if (response.lifecycle === "pending") {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: new Error("Intelligence processing in progress"),
          lifecycle: "pending",
          reasonCode: response.reason_code,
          reasonMessage:
            response.reason_message ||
            "CFO Intelligence is processing. Please wait.",
        }));
      } else if (response.lifecycle === "failed") {
        setState((prev) => ({
          ...prev,
          signals: [],
          allSignals: [],
          isLoading: false,
          error: new Error(
            response.reason_message || "Intelligence analysis failed",
          ),
          lifecycle: "failed",
          reasonCode: response.reason_code,
          reasonMessage:
            response.reason_message ||
            "Unable to complete intelligence analysis",
          lastUpdated: null,
        }));
      } else {
        // Unknown lifecycle - fail closed
        setState({
          ...FAILED_STATE,
          allSignals: [],
          isLoading: false,
          error: new Error("Unknown response lifecycle"),
          lastUpdated: null,
        });
      }
    } catch (err) {
      // Fetch failed - fail closed
      console.error("[useCFOIntelligence] Fetch failed:", err);
      setState({
        signals: [],
        allSignals: [],
        isLoading: false,
        error: err,
        lifecycle: "failed",
        reasonCode: "fetch_error",
        reasonMessage: err.message || "Unable to load CFO Intelligence signals",
        lastUpdated: null,
      });
    }
  }, [includeLowConfidence]);

  // Re-filter when includeLowConfidence changes
  useEffect(() => {
    if (state.allSignals.length > 0) {
      const filteredSignals = includeLowConfidence
        ? state.allSignals
        : state.allSignals.filter(
            (s) => s.confidence >= DEFAULT_CONFIDENCE_THRESHOLD,
          );
      // eslint-disable-next-line react-hooks/set-state-in-effect -- legacy filter sync; tracked for hook migration
      setState((prev) => ({ ...prev, signals: filteredSignals }));
    }
  }, [includeLowConfidence, state.allSignals]);

  // Initial fetch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch; tracked for hook migration
    fetch();
  }, [fetch]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(fetch, AUTO_REFRESH_INTERVAL);
    }

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [autoRefresh, fetch]);

  return {
    signals: state.signals,
    signalCount: state.signals.length,
    totalSignalCount: state.allSignals.length,
    isLoading: state.isLoading,
    error: state.error,
    lifecycle: state.lifecycle,
    reasonCode: state.reasonCode,
    reasonMessage: state.reasonMessage,
    lastUpdated: state.lastUpdated,
    refetch: fetch,
  };
}

export default useCFOIntelligence;
