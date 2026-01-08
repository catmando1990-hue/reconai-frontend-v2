// Phase 40–41 — Intelligence fetchers with safe mock fallback

import type { ApiFetchOptions } from "@/lib/api";
import type { AlertsResponse, WorkerTasksResponse } from "@/lib/intelligence/types";
import { mockAlerts, mockWorkerTasks } from "@/lib/intelligence/mock";

export type ApiFetcher = <T = unknown,>(path: string, options?: ApiFetchOptions) => Promise<T>;

function shouldUseMock(baseUrl?: string) {
  return !baseUrl;
}

// NOTE: Endpoints are intentionally simple; can be mapped later to backend OpenAPI.
const ENDPOINTS = {
  alerts: "/intelligence/alerts",
  workerTasks: "/intelligence/worker/tasks",
} as const;

export async function fetchAlerts(apiFetch: ApiFetcher, options: ApiFetchOptions = {}) {
  if (shouldUseMock(options.baseUrl)) return mockAlerts();
  try {
    return await apiFetch<AlertsResponse>(ENDPOINTS.alerts, { ...options, method: "GET" });
  } catch {
    return mockAlerts();
  }
}

export async function fetchWorkerTasks(apiFetch: ApiFetcher, options: ApiFetchOptions = {}) {
  if (shouldUseMock(options.baseUrl)) return mockWorkerTasks();
  try {
    return await apiFetch<WorkerTasksResponse>(ENDPOINTS.workerTasks, { ...options, method: "GET" });
  } catch {
    return mockWorkerTasks();
  }
}
