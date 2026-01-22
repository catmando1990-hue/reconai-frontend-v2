"use client";

// src/hooks/useSettingsConfig.tsx
// Phase 37: Settings hook with version enforcement and lifecycle validation.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import type {
  SettingsResponse,
  SettingsLifecycleStatus,
  SettingsReasonCode,
} from "@/lib/api/types";

// =============================================================================
// VERSION ENFORCEMENT - Fail-closed on unknown/missing versions
// =============================================================================

/**
 * SUPPORTED SETTINGS VERSIONS
 * Frontend will FAIL-CLOSED on unknown or missing versions.
 * Add new versions here when backend contract changes.
 */
export const SUPPORTED_SETTINGS_VERSIONS = ["1"] as const;
export type SupportedSettingsVersion =
  (typeof SUPPORTED_SETTINGS_VERSIONS)[number];

/**
 * Type guard: Check if settings_version is supported
 * FAIL-CLOSED: Unknown versions are rejected
 */
export function isSupportedSettingsVersion(
  version: unknown,
): version is SupportedSettingsVersion {
  return (
    typeof version === "string" &&
    SUPPORTED_SETTINGS_VERSIONS.includes(version as SupportedSettingsVersion)
  );
}

/**
 * Valid lifecycle statuses
 */
const VALID_LIFECYCLE_STATUSES: SettingsLifecycleStatus[] = [
  "success",
  "pending",
  "failed",
  "stale",
];

/**
 * Validate Settings response has supported version and valid lifecycle
 * Returns false if version is missing/unknown or lifecycle is invalid
 */
export function isValidSettingsResponse(
  response: unknown,
): response is SettingsResponse {
  if (!response || typeof response !== "object") return false;
  const r = response as Record<string, unknown>;

  // PART 1: Version enforcement - fail closed on unknown/missing
  if (!isSupportedSettingsVersion(r.settings_version)) return false;

  // PART 2: Lifecycle validation - required for rendering decisions
  if (
    typeof r.lifecycle !== "string" ||
    !VALID_LIFECYCLE_STATUSES.includes(r.lifecycle as SettingsLifecycleStatus)
  ) {
    return false;
  }

  // PART 2: Non-success requires reason_code
  if (r.lifecycle !== "success") {
    if (typeof r.reason_code !== "string") return false;
  }

  return true;
}

// =============================================================================
// FAIL-CLOSED STATE - Returned when data unavailable or invalid
// =============================================================================

/**
 * Fail-closed state for Settings data
 * Note: version "1" used for internal consistency, lifecycle "failed" indicates error
 */
const failClosedState: SettingsResponse = {
  settings_version: "1",
  lifecycle: "failed",
  reason_code: "unknown",
  reason_message: "Unable to load settings",
  generated_at: new Date().toISOString(),
  settings: null,
};

// =============================================================================
// POLICY ACKNOWLEDGEMENT
// =============================================================================

/**
 * Check if user has acknowledged the policy (required for destructive actions)
 */
export function hasPolicyAcknowledgement(
  settings: SettingsResponse | null,
): boolean {
  if (!settings || settings.lifecycle !== "success") return false;
  return settings.settings?.policy_acknowledged_at !== null;
}

/**
 * DESTRUCTIVE_ACTIONS - Actions that require confirmation and policy acknowledgement
 */
export const DESTRUCTIVE_ACTIONS = {
  UNLINK_BANK: {
    action: "unlink_bank",
    phrase: "UNLINK BANK ACCOUNT",
    description:
      "This will disconnect your bank account and stop transaction syncing.",
  },
  CLEAR_CACHE: {
    action: "clear_cache",
    phrase: "CLEAR ALL CACHE",
    description: "This will clear all cached data. You may need to re-sync.",
  },
  DELETE_DATA: {
    action: "delete_data",
    phrase: "DELETE MY DATA",
    description:
      "This will permanently delete your data. This action cannot be undone.",
  },
  REVOKE_ACCESS: {
    action: "revoke_access",
    phrase: "REVOKE ALL ACCESS",
    description: "This will revoke all third-party access to your account.",
  },
} as const;

export type DestructiveAction = keyof typeof DESTRUCTIVE_ACTIONS;

// =============================================================================
// HOOK STATE TYPE
// =============================================================================

export type UseSettingsConfigState = {
  data: SettingsResponse | null;
  isLoading: boolean;
  error: string | null;
  /** Derived: true only when lifecycle is "success" */
  isSuccess: boolean;
  /** Derived: lifecycle status for UI rendering decisions */
  lifecycle: SettingsLifecycleStatus | null;
  /** Derived: reason code for non-success states */
  reasonCode: SettingsReasonCode | null;
  /** Derived: human-readable reason message */
  reasonMessage: string | null;
  /** Derived: whether user has acknowledged policy */
  hasPolicyAcknowledged: boolean;
  /** Acknowledge policy (required before destructive actions) */
  acknowledgePolicy: () => Promise<void>;
  /** Validate confirmation phrase for destructive action */
  validateDestructiveAction: (
    action: DestructiveAction,
    confirmPhrase: string,
  ) => boolean;
  refetch: () => Promise<void>;
};

export function useSettingsConfig(): UseSettingsConfigState {
  const { apiFetch } = useApi();

  const [data, setData] = useState<SettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await apiFetch<SettingsResponse>("/settings/config", {
        method: "GET",
      });

      // FAIL-CLOSED: Validate response structure and version
      if (res && isValidSettingsResponse(res)) {
        setData(res);
      } else {
        // Unknown or missing version/lifecycle = fail-closed
        const resObj = res as Record<string, unknown> | null;
        console.warn(
          "[useSettingsConfig] Invalid response or unsupported settings_version, failing closed",
          {
            settingsVersion: resObj?.settings_version,
            lifecycle: resObj?.lifecycle,
          },
        );
        setData(failClosedState);
        setError("Settings validation failed");
      }
    } catch {
      setError("Unable to load settings.");
      setData(failClosedState);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  // Acknowledge policy
  const acknowledgePolicy = useCallback(async () => {
    try {
      await apiFetch("/settings/acknowledge-policy", {
        method: "POST",
      });
      // Refetch to get updated policy_acknowledged_at
      await refetch();
    } catch {
      console.error("[useSettingsConfig] Failed to acknowledge policy");
    }
  }, [apiFetch, refetch]);

  // Validate destructive action confirmation
  const validateDestructiveAction = useCallback(
    (action: DestructiveAction, confirmPhrase: string): boolean => {
      const actionConfig = DESTRUCTIVE_ACTIONS[action];
      if (!actionConfig) return false;

      // Must match exact phrase
      if (confirmPhrase !== actionConfig.phrase) return false;

      // Must have policy acknowledged for most actions
      if (!hasPolicyAcknowledgement(data)) {
        console.warn(
          "[useSettingsConfig] Policy acknowledgement required for destructive action",
        );
        return false;
      }

      return true;
    },
    [data],
  );

  // Derived state helpers
  const derived = useMemo(() => {
    if (!data) {
      return {
        isSuccess: false,
        lifecycle: null,
        reasonCode: null,
        reasonMessage: null,
        hasPolicyAcknowledged: false,
      };
    }

    return {
      isSuccess: data.lifecycle === "success",
      lifecycle: data.lifecycle,
      reasonCode: data.reason_code,
      reasonMessage: data.reason_message,
      hasPolicyAcknowledged: hasPolicyAcknowledgement(data),
    };
  }, [data]);

  return useMemo(
    () => ({
      data,
      isLoading,
      error,
      ...derived,
      acknowledgePolicy,
      validateDestructiveAction,
      refetch,
    }),
    [
      data,
      isLoading,
      error,
      derived,
      acknowledgePolicy,
      validateDestructiveAction,
      refetch,
    ],
  );
}
