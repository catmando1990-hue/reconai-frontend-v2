/**
 * Centralized configuration with fail-closed validation.
 *
 * RULE: Production deployments MUST have all required env vars.
 * No hardcoded fallback URLs that could silently route to wrong backend.
 */

function requireEnv(name: string, fallbackForDev?: string): string {
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
 * Backend API URL - required in production, fallback in dev only.
 */
export const BACKEND_URL = requireEnv(
  "NEXT_PUBLIC_API_BASE_URL",
  "https://reconai-backend.onrender.com",
);

/**
 * Alias for legacy code using NEXT_PUBLIC_API_URL
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
