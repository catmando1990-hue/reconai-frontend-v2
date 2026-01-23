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
 * Detect if we're in Next.js build phase (not runtime).
 * During build, env vars may not be available yet.
 *
 * Detection methods (any one indicates build phase):
 * 1. NEXT_PHASE is set (official Next.js build indicator)
 * 2. No incoming request context (typeof window === 'undefined' during SSG)
 * 3. VERCEL_ENV not set but NODE_ENV is production (CI build before deploy)
 */
function isBuildPhase(): boolean {
  // NEXT_PHASE is set during next build
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-export"
  ) {
    return true;
  }

  // CI build environment detection:
  // - NODE_ENV=production (set by next build)
  // - VERCEL_ENV not set (only set at runtime on Vercel)
  // - Not in a browser context
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.VERCEL_ENV &&
    typeof window === "undefined"
  ) {
    // Additional check: if we're in GitHub Actions CI
    if (process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true") {
      return true;
    }
  }

  return false;
}

/**
 * Get a required env var. Only call this inside runtime handlers (GET/POST),
 * never at module scope.
 *
 * Behavior:
 * - Build phase: returns placeholder (avoids crash)
 * - Runtime + production: throws if missing (fail-closed)
 * - Runtime + dev: uses fallback if provided, throws otherwise
 *
 * @throws Error if env var is missing in production at RUNTIME (not build time)
 */
export function getRequiredEnv(name: string, fallbackForDev?: string): string {
  const value = process.env[name];

  if (value) return value;

  // During build phase, return placeholder to avoid crashing next build
  // The actual value will be injected at runtime by Vercel
  if (isBuildPhase()) {
    return `__BUILD_PLACEHOLDER_${name}__`;
  }

  // At runtime in production, fail closed
  if (process.env.NODE_ENV === "production") {
    throw new Error(`[FATAL] Missing required env var: ${name}`);
  }

  // Dev environment: use fallback if provided
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
    "http://localhost:8000",
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
