// src/lib/api/fetchers.ts
// Phase 34: Backend-agnostic fetchers.
// CANONICAL LAWS: No silent mock fallback - fail closed when backend unavailable.

import type { ApiFetchOptions } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { CfoSnapshotResponse } from "@/lib/api/types";

export type ApiFetcher = <T = unknown>(
  path: string,
  options?: ApiFetchOptions,
) => Promise<T>;

function isBackendConfigured(baseUrl?: string) {
  // If no API base URL is configured, backend isn't wired yet.
  return !!baseUrl;
}

export async function fetchCfoSnapshot(
  apiFetch: ApiFetcher,
  options: ApiFetchOptions = {},
): Promise<CfoSnapshotResponse | null> {
  // CANONICAL LAWS: Fail closed - return null instead of mock data
  if (!isBackendConfigured(options.baseUrl)) return null;

  try {
    return await apiFetch<CfoSnapshotResponse>(API_ENDPOINTS.cfoSnapshot, {
      ...options,
      method: "GET",
    });
  } catch {
    // CANONICAL LAWS: Fail closed - return null instead of mock data
    return null;
  }
}
