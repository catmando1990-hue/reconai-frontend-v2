/**
 * Centralized configuration with fail-closed validation.
 *
 * RULE: Production deployments MUST have all required env vars.
 * No hardcoded fallback URLs that could silently route to wrong backend.
 *
 * IMPORTANT: Env vars are evaluated lazily (inside getter functions) to avoid
 * crashing Next.js build during "Collecting page data" phase. Module-scope
 * evaluation would throw before any handler runs.
 */

/**
 * Get a required env var. Only call this inside runtime handlers (GET/POST),
 * never at module scope.
 *
 * @throws Error if env var is missing in production
 */
export function getRequiredEnv(name: string, fallbackForDev?: string): string {
  const value = process.env[name];

  if (value) return value;

  if (process.env.NODE_ENV === "production") {
    throw new Error(`[FATAL] Missing required env var: ${name}`);
  }

  if (fallbackForDev) {
    console.warn(`[DEV] Using fallback for ${name}: ${fallbackForDev}`);
    return fallbackForDev;
  }

  throw new Error(`Missing env var: ${name} (no fallback configured)`);
}

/**
 * Get backend API URL. Call inside handlers, not at module scope.
 * Required in production, uses fallback in dev only.
 */
export function getBackendUrl(): string {
  return getRequiredEnv(
    "NEXT_PUBLIC_API_BASE_URL",
    "https://reconai-backend.onrender.com",
  );
}

/**
 * Get API URL (checks legacy env var first, then falls back to backend URL).
 * Call inside handlers, not at module scope.
 */
export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || getBackendUrl();
}

/**
 * @deprecated Use getBackendUrl() instead. Kept for backward compatibility.
 * WARNING: This evaluates lazily via getter, not at import time.
 */
export const BACKEND_URL = {
  toString: () => getBackendUrl(),
  valueOf: () => getBackendUrl(),
} as unknown as string;

/**
 * @deprecated Use getApiUrl() instead. Kept for backward compatibility.
 */
export const API_URL = {
  toString: () => getApiUrl(),
  valueOf: () => getApiUrl(),
} as unknown as string;
