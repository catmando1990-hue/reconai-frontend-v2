"use client";

// src/lib/hooks/useInsightsSummary.tsx
// Phase 35: Real hook (stateful, retryable) with mock fallback through fetchers.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import type { InsightsSummaryResponse } from "@/lib/api/types";
import { fetchInsightsSummary } from "@/lib/api/fetchers";

export type UseInsightsSummaryState = {
  data: InsightsSummaryResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useInsightsSummary(): UseInsightsSummaryState {
  const { apiFetch } = useApi();

  const [data, setData] = useState<InsightsSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchInsightsSummary(apiFetch, {});
      setData(res);
    } catch {
      setError("Unable to load insights.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return useMemo(
    () => ({ data, isLoading, error, refetch }),
    [data, isLoading, error, refetch],
  );
}
