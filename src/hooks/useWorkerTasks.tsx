"use client";

// Phase 41 — AI Worker tasks hook (stateful, retryable)

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import type { WorkerTasksResponse } from "@/lib/intelligence/types";
import { fetchWorkerTasks } from "@/lib/intelligence/fetchers";

export function useWorkerTasks() {
  const { apiFetch } = useApi();

  const [data, setData] = useState<WorkerTasksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchWorkerTasks(apiFetch, {});
      setData(res);
    } catch {
      setError("Unable to load AI Worker tasks.");
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
