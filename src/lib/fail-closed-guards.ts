/**
 * ============================================================================
 * PHASE 5: FAIL-CLOSED UI SAFETY GUARDS
 * ============================================================================
 *
 * These guards prevent "looks fine but isn't" failures.
 *
 * RULES:
 * - Missing backend data → visible UNKNOWN state
 * - Zero values are NOT auto-interpreted as valid
 * - No fallback to "OK", "Live", or positive states
 *
 * DEVELOPER WARNING:
 * If you're tempted to add a default value here, STOP.
 * The whole point is to NOT have defaults that hide missing data.
 *
 * ============================================================================
 */

/**
 * Guard: Ensure value is explicitly provided, not just truthy
 *
 * Returns true if value is a real number (including 0)
 * Returns false for null, undefined, NaN
 *
 * USE THIS instead of checking `if (value)` which treats 0 as falsy
 */
export function isRealNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
}

/**
 * Guard: Ensure value is a real string with content
 *
 * Returns false for null, undefined, empty string, whitespace-only
 */
export function isRealString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Guard: Check if timestamp is valid and parseable
 */
export function isValidTimestamp(value: unknown): boolean {
  if (!isRealString(value)) return false;

  try {
    const date = new Date(value);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Guard: Check if status is from a known valid set
 *
 * NEVER accept arbitrary strings as status - only allow known values
 */
export function isKnownStatus<T extends string>(
  value: unknown,
  knownValues: readonly T[]
): value is T {
  return typeof value === "string" && knownValues.includes(value as T);
}

/**
 * FAIL-CLOSED PATTERN: Safe metric access
 *
 * Returns null (unknown) if value is not a real number.
 * UI should display "Unknown" for null, not "0" or "--"
 */
export function safeMetric(value: unknown): number | null {
  if (isRealNumber(value)) {
    return value;
  }
  // FAIL-CLOSED: Return null (unknown) for any non-number
  return null;
}

/**
 * FAIL-CLOSED PATTERN: Safe status access
 *
 * Returns "unknown" if status is not in the known set.
 * This prevents displaying fake "OK" or "Live" states.
 */
export function safeStatus<T extends string>(
  value: unknown,
  knownValues: readonly T[],
  unknownValue: T
): T {
  if (isKnownStatus(value, knownValues)) {
    return value;
  }
  // FAIL-CLOSED: Return the "unknown" equivalent
  return unknownValue;
}

/**
 * FAIL-CLOSED PATTERN: Safe boolean with explicit unknown
 *
 * For cases where true/false/unknown are all valid states.
 * Returns null (unknown) if value is not explicitly true or false.
 */
export function safeBooleanWithUnknown(value: unknown): boolean | null {
  if (value === true || value === false) {
    return value;
  }
  // FAIL-CLOSED: Return null (unknown) for any non-boolean
  return null;
}

/**
 * DEVELOPER WARNING LOGGER
 *
 * Use this in development to catch assumptions that could lead to fake states.
 * Only logs in development mode.
 */
export function devWarn(condition: boolean, message: string): void {
  if (process.env.NODE_ENV === "development" && condition) {
    console.warn(`[FAIL-CLOSED WARNING] ${message}`);
  }
}

/**
 * Assert: Value is from backend
 *
 * Use this to document that a value should come from backend, not be fabricated.
 * Logs warning in dev if value appears fabricated (e.g., hardcoded).
 */
export function assertBackendValue<T>(
  value: T,
  fieldName: string,
  source: string
): T {
  devWarn(
    value === undefined,
    `${fieldName} is undefined but expected from backend (${source}). ` +
      `Displaying "Unknown" instead of fabricating a value.`
  );
  return value;
}

// ============================================================================
// PHASE 5: UI COMPONENT GUARDS
// ============================================================================

/**
 * Guard for displaying connection status
 *
 * NEVER returns "Connected" or "Live" without backend confirmation
 */
export type DisplayableConnectionStatus =
  | "Active"
  | "Error"
  | "Action Required"
  | "Disconnected"
  | "Unknown";

const VALID_CONNECTION_STATUSES = [
  "active",
  "error",
  "requires_action",
  "disconnected",
  "unknown",
] as const;

export function getDisplayConnectionStatus(
  status: unknown
): DisplayableConnectionStatus {
  switch (status) {
    case "active":
      return "Active";
    case "error":
      return "Error";
    case "requires_action":
    case "login_required":
      return "Action Required";
    case "disconnected":
    case "not_connected":
      return "Disconnected";
    default:
      // FAIL-CLOSED: Any unknown status displays as "Unknown"
      devWarn(
        status !== "unknown" && status !== undefined,
        `Unknown connection status: "${status}". Displaying as "Unknown".`
      );
      return "Unknown";
  }
}

/**
 * Guard for displaying health status
 */
export type DisplayableHealthStatus =
  | "Healthy"
  | "Degraded"
  | "Unhealthy"
  | "Unknown";

export function getDisplayHealthStatus(status: unknown): DisplayableHealthStatus {
  switch (status) {
    case "healthy":
    case "ok":
      return "Healthy";
    case "degraded":
    case "warning":
      return "Degraded";
    case "unhealthy":
    case "error":
    case "critical":
      return "Unhealthy";
    default:
      // FAIL-CLOSED: Any unknown status displays as "Unknown"
      return "Unknown";
  }
}

/**
 * Guard for displaying sync freshness
 *
 * NEVER shows "Live" or "Real-time" unless backend explicitly confirms
 */
export type DisplayableDataMode = "Live Data" | "Demo Data" | "Data Mode Unknown";

export function getDisplayDataMode(mode: unknown): DisplayableDataMode {
  switch (mode) {
    case "live":
      return "Live Data";
    case "demo":
      return "Demo Data";
    default:
      // FAIL-CLOSED: Unknown data mode
      return "Data Mode Unknown";
  }
}

// ============================================================================
// ANTI-PATTERNS TO AVOID (Documentation)
// ============================================================================

/**
 * ANTI-PATTERN: Don't do this!
 *
 * BAD:
 * ```ts
 * const status = response?.status || "healthy";  // WRONG - assumes healthy
 * const count = response?.count || 0;            // WRONG - assumes 0
 * const lastSync = response?.sync || "Just now"; // WRONG - fabricated time
 * ```
 *
 * GOOD:
 * ```ts
 * const status = safeStatus(response?.status, VALID_STATUSES, "unknown");
 * const count = safeMetric(response?.count);  // Returns null if missing
 * const lastSync = response?.sync ?? null;    // Explicitly null if missing
 * ```
 *
 * The UI should then display:
 * - "Unknown" for null status
 * - "Unknown" for null count (not "0" or "--")
 * - "Unknown" for null timestamp (not "Just now")
 */

// Export type guards for use in components
export const guards = {
  isRealNumber,
  isRealString,
  isValidTimestamp,
  isKnownStatus,
  safeMetric,
  safeStatus,
  safeBooleanWithUnknown,
  devWarn,
  assertBackendValue,
  getDisplayConnectionStatus,
  getDisplayHealthStatus,
  getDisplayDataMode,
};
