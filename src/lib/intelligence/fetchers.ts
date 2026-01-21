// Phase 40–41 — Intelligence fetchers
// P0 FIX: Fail-closed behavior - no silent mock data fallback
// Mock data must be explicitly labeled when used

import type { ApiFetchOptions } from "@/lib/api";
import type {
  AlertsResponse,
  WorkerTasksResponse,
} from "@/lib/intelligence/types";
import { mockAlerts, mockWorkerTasks } from "@/lib/intelligence/mock";

export type ApiFetcher = <T = unknown>(
  path: string,
  options?: ApiFetchOptions,
) => Promise<T>;

function isBackendConfigured(baseUrl?: string) {
  return !!baseUrl;
}

// NOTE: Endpoints are intentionally simple; can be mapped later to backend OpenAPI.
const ENDPOINTS = {
  alerts: "/intelligence/alerts",
  workerTasks: "/intelligence/worker/tasks",
} as const;

/**
 * Extended response type that includes demo mode flag
 * P0 FIX: All mock data must be labeled
 */
export type AlertsResponseWithMode = AlertsResponse & {
  _isDemo?: boolean;
  _demoDisclaimer?: string;
};

export type WorkerTasksResponseWithMode = WorkerTasksResponse & {
  _isDemo?: boolean;
  _demoDisclaimer?: string;
};

const DEMO_DISCLAIMER =
  "This data is simulated for demonstration purposes. Connect to backend for live data.";

export async function fetchAlerts(
  apiFetch: ApiFetcher,
  options: ApiFetchOptions = {},
): Promise<AlertsResponseWithMode | null> {
  // P0 FIX: Fail-closed - return null when no backend, not silent mock
  if (!isBackendConfigured(options.baseUrl)) {
    // Return mock data WITH explicit demo labeling
    const mock = mockAlerts();
    return {
      ...mock,
      _isDemo: true,
      _demoDisclaimer: DEMO_DISCLAIMER,
    };
  }
  try {
    return await apiFetch<AlertsResponse>(ENDPOINTS.alerts, {
      ...options,
      method: "GET",
    });
  } catch {
    // P0 FIX: Fail-closed - return null on error, not mock data
    return null;
  }
}

export async function fetchWorkerTasks(
  apiFetch: ApiFetcher,
  options: ApiFetchOptions = {},
): Promise<WorkerTasksResponseWithMode | null> {
  // P0 FIX: Fail-closed - return null when no backend, not silent mock
  if (!isBackendConfigured(options.baseUrl)) {
    // Return mock data WITH explicit demo labeling
    const mock = mockWorkerTasks();
    return {
      ...mock,
      _isDemo: true,
      _demoDisclaimer: DEMO_DISCLAIMER,
    };
  }
  try {
    return await apiFetch<WorkerTasksResponse>(ENDPOINTS.workerTasks, {
      ...options,
      method: "GET",
    });
  } catch {
    // P0 FIX: Fail-closed - return null on error, not mock data
    return null;
  }
}
