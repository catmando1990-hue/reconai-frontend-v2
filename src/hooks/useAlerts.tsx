"use client";

// Phase 40 — Alerts hook (stateful, retryable)

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import type { AlertsResponse } from "@/lib/intelligence/types";
import { fetchAlerts } from "@/lib/intelligence/fetchers";

export function useAlerts() {
  const { apiFetch } = useApi();

  const [data, setData] = useState<AlertsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAlerts(apiFetch, {});
      setData(res);
    } catch {
      setError("Unable to load alerts.");
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
