"use client";

import { useState, useCallback, useEffect } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import type {
  IntelligenceSignal,
  UseIntelligenceResult,
} from "@/lib/intelligence-types";
import { DEFAULT_CONFIDENCE_THRESHOLD } from "@/lib/intelligence-types";

/**
 * useGovconIntelligence - Domain-specific hook for GovCon intelligence
 *
 * STRICT ISOLATION: This hook MUST NOT import or reference
 * any non-GovCon intelligence code.
 *
 * Fetches DCAA readiness signals, timekeeping anomalies,
 * indirect rate drift, unallowable cost flags, and audit trail integrity.
 *
 * CANONICAL LAWS:
 * - Manual refresh only (no polling)
 * - Confidence-gated (>= 0.85 by default)
 * - Fail-closed on errors
 * - Auth-gated (org-scoped)
 * - DCAA compliance focus
 */

interface GovconIntelligenceResponse {
  lifecycle: "success" | "pending" | "failed" | "stale";
  reason_code?: string;
  reason_message?: string;
  generated_at: string;
  items: IntelligenceSignal[];
}

export function useGovconIntelligence(): UseIntelligenceResult {
  const { apiFetch } = useApi();
  const { isLoaded: authReady, org_id } = useOrg();

  const [signals, setSignals] = useState<IntelligenceSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showLowConfidence, setShowLowConfidence] = useState(false);

  const fetchSignals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch<GovconIntelligenceResponse>(
        "/api/govcon/intelligence",
      );

      if (response?.lifecycle === "success" && response.items) {
        setSignals(response.items);
        setLastUpdated(response.generated_at);
      } else if (response?.lifecycle === "pending") {
        setError("Intelligence analysis is processing. Check back shortly.");
        setSignals([]);
      } else if (response?.lifecycle === "failed") {
        setError(response.reason_message || "Failed to load intelligence.");
        setSignals([]);
      } else {
        setSignals([]);
        setLastUpdated(null);
      }
    } catch {
      setError("Failed to fetch GovCon intelligence. Please try again.");
      setSignals([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!authReady) return;
    void fetchSignals();
  }, [authReady, org_id, fetchSignals]);

  const filteredSignals = showLowConfidence
    ? signals
    : signals.filter((s) => s.confidence >= DEFAULT_CONFIDENCE_THRESHOLD);

  return {
    signals: filteredSignals,
    loading,
    error,
    lastUpdated,
    refresh: fetchSignals,
    showLowConfidence,
    setShowLowConfidence,
  };
}
