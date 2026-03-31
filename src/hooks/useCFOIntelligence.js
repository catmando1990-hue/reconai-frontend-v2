"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
 * Mock fetch function - replace with actual API call
 */
async function fetchCFOIntelligence() {
  // Simulate network delay
  await new Promise((resolve) =>
    setTimeout(resolve, 800 + Math.random() * 600),
  );

  // Mock response
  return {
    lifecycle: "success",
    reason_code: null,
    reason_message: null,
    signals: [
      {
        id: "sig-001",
        category: SIGNAL_CATEGORIES.RUNWAY_RISK,
        severity: SEVERITY.HIGH,
        confidence: 0.92,
        title: "Runway projection shortened",
        description:
          "Based on current burn rate trends, runway has decreased from 18.5 to 14.2 months over the past 60 days.",
        evidence: {
          current_runway_months: 14.2,
          previous_runway_months: 18.5,
          burn_rate_change: "+23%",
          contributing_factors: [
            "Increased payroll costs (+$45K/mo)",
            "Marketing spend increase (+$18K/mo)",
            "Infrastructure scaling costs",
          ],
        },
        advisory_disclaimer:
          "Runway calculations are based on current cash position and trailing 90-day burn rate averages.",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "sig-002",
        category: SIGNAL_CATEGORIES.BURN_ANOMALY,
        severity: SEVERITY.MEDIUM,
        confidence: 0.85,
        title: "Unusual expense pattern detected",
        description:
          "Marketing spend increased 47% month-over-month without corresponding campaign activity in tracking systems.",
        evidence: {
          expense_category: "Marketing",
          current_month: 68350,
          previous_month: 46500,
          percentage_change: 47,
          expected_range: { min: 42000, max: 52000 },
        },
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "sig-003",
        category: SIGNAL_CATEGORIES.FORECAST_DEVIATION,
        severity: SEVERITY.HIGH,
        confidence: 0.78,
        title: "Q2 revenue forecast at risk",
        description:
          "Current pipeline conversion suggests Q2 revenue may fall 12% below forecast based on historical close rates.",
        evidence: {
          forecast_amount: 920000,
          projected_amount: 809600,
          deviation_percentage: -12,
          pipeline_value: 1840000,
          historical_conversion_rate: 0.44,
          current_conversion_rate: 0.38,
        },
        advisory_disclaimer:
          "Forecast projections are based on historical patterns and may not account for recent strategic changes.",
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "sig-004",
        category: SIGNAL_CATEGORIES.RECEIVABLES_RISK,
        severity: SEVERITY.MEDIUM,
        confidence: 0.88,
        title: "AR aging concentration risk",
        description:
          "3 accounts representing 28% of total AR have exceeded 45-day payment terms.",
        evidence: {
          total_ar: 385000,
          at_risk_ar: 107800,
          at_risk_percentage: 28,
          accounts: [
            { name: "Acme Corp", amount: 52000, days_overdue: 18 },
            { name: "TechStart Inc", amount: 31800, days_overdue: 12 },
            { name: "Global Services", amount: 24000, days_overdue: 8 },
          ],
        },
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "sig-005",
        category: SIGNAL_CATEGORIES.CASH_FLOW_VOLATILITY,
        severity: SEVERITY.LOW,
        confidence: 0.65,
        title: "Increased cash flow variability",
        description:
          "Weekly cash flow standard deviation has increased 35% over the past month.",
        evidence: {
          current_stddev: 42500,
          previous_stddev: 31500,
          change_percentage: 35,
          period: "30 days",
        },
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "sig-006",
        category: SIGNAL_CATEGORIES.PAYABLES_RISK,
        severity: SEVERITY.INFO,
        confidence: 0.55,
        title: "Vendor payment timing optimization",
        description:
          "Analysis suggests potential to improve working capital by adjusting vendor payment schedules.",
        evidence: {
          potential_improvement: 28000,
          vendors_analyzed: 12,
          recommendation: "Extend payment terms with 3 non-critical vendors",
        },
        created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      },
    ],
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

  // Compute filtered signals using useMemo instead of effect
  const filteredSignals = useMemo(() => {
    if (state.allSignals.length === 0) return state.signals;
    return includeLowConfidence
      ? state.allSignals
      : state.allSignals.filter(
          (s) => s.confidence >= DEFAULT_CONFIDENCE_THRESHOLD,
        );
  }, [includeLowConfidence, state.allSignals, state.signals]);

  // Initial fetch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    signals: filteredSignals,
    signalCount: filteredSignals.length,
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
