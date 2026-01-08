"use client";

// src/lib/hooks/useCfoSnapshot.tsx
// Phase 36: CFO snapshot hook with fallback to mock data.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import type { CfoSnapshotResponse } from "@/lib/api/types";
import { fetchCfoSnapshot } from "@/lib/api/fetchers";

export type UseCfoSnapshotState = {
  data: CfoSnapshotResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useCfoSnapshot(): UseCfoSnapshotState {
  const { apiFetch } = useApi();

  const [data, setData] = useState<CfoSnapshotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchCfoSnapshot(apiFetch, {});
      setData(res);
    } catch {
      setError("Unable to load CFO snapshot.");
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
