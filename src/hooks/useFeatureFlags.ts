// hooks/useFeatureFlags.ts
// Step 19: Feature Flags Hook

"use client";

import { useEffect, useState, useCallback } from "react";

interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  run_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface UseFeatureFlagsResult {
  flags: FeatureFlag[];
  flagNames: string[];
  isEnabled: (name: string) => boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export function useFeatureFlags(): UseFeatureFlagsResult {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${API_BASE}/governance/features?enabled_only=true`,
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch feature flags: ${res.status}`);
      }

      const data = await res.json();
      setFlags(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load feature flags",
      );
      setFlags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const isEnabled = useCallback(
    (name: string): boolean => {
      const flag = flags.find((f) => f.name === name);
      return flag?.enabled ?? false;
    },
    [flags],
  );

  const flagNames = flags.filter((f) => f.enabled).map((f) => f.name);

  return {
    flags,
    flagNames,
    isEnabled,
    loading,
    error,
    refresh: fetchFlags,
  };
}

export default useFeatureFlags;
