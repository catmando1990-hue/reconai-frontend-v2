// src/lib/api/fetchers.ts
// Phase 34: Backend-agnostic fetchers with safe fallback to mock data.
// Enterprise rule: the UI must remain stable even when backend is not ready.

import type { ApiFetchOptions } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  CfoSnapshotResponse,
  InsightsSummaryResponse,
} from "@/lib/api/types";
import { mockCfoSnapshot, mockInsights } from "@/lib/api/mock";

export type ApiFetcher = <T = unknown>(
  path: string,
  options?: ApiFetchOptions,
) => Promise<T>;

function shouldUseMock(baseUrl?: string) {
  // If no API base URL is configured, assume backend isn't wired yet.
  // `apiFetch` can still attempt same-origin calls, but for early phases we keep UX deterministic.
  return !baseUrl;
}

export async function fetchInsightsSummary(
  apiFetch: ApiFetcher,
  options: ApiFetchOptions = {},
) {
  if (shouldUseMock(options.baseUrl)) return mockInsights();

  try {
    return await apiFetch<InsightsSummaryResponse>(API_ENDPOINTS.insights, {
      ...options,
      method: "GET",
    });
  } catch {
    return mockInsights();
  }
}

export async function fetchCfoSnapshot(
  apiFetch: ApiFetcher,
  options: ApiFetchOptions = {},
) {
  if (shouldUseMock(options.baseUrl)) return mockCfoSnapshot();

  try {
    return await apiFetch<CfoSnapshotResponse>(API_ENDPOINTS.cfoSnapshot, {
      ...options,
      method: "GET",
    });
  } catch {
    return mockCfoSnapshot();
  }
}
