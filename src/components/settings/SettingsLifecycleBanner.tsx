"use client";

import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import type { SettingsLifecycleStatus, SettingsReasonCode } from "@/lib/api/types";

interface SettingsLifecycleBannerProps {
  lifecycle: SettingsLifecycleStatus;
  reasonCode: SettingsReasonCode | null;
  reasonMessage: string | null;
  onRetry?: () => void;
}

/**
 * PART 2 — Lifecycle Rendering: Banner for non-success states
 * - Renders appropriate banner based on lifecycle status
 * - Shows explicit reason for non-success states
 * - No optimistic UI - only render success state content
 */
export function SettingsLifecycleBanner({
  lifecycle,
  reasonCode,
  reasonMessage,
  onRetry,
}: SettingsLifecycleBannerProps) {
  // Success state - no banner needed
  if (lifecycle === "success") {
    return null;
  }

  // Pending state - show loading indicator
  if (lifecycle === "pending") {
    return (
      <div
        data-testid="settings-lifecycle-banner"
        data-lifecycle="pending"
        className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4"
      >
        <div className="flex items-start gap-3">
          <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Loading settings…
            </p>
            {reasonMessage && (
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                {reasonMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Stale state - show warning with reason
  if (lifecycle === "stale") {
    return (
      <div
        data-testid="settings-lifecycle-banner"
        data-lifecycle="stale"
        className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              Settings may be outdated
            </p>
            <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
              {reasonMessage || `Reason: ${reasonCode || "unknown"}`}
            </p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-2"
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Failed state - show error with reason (REQUIRED)
  return (
    <div
      data-testid="settings-lifecycle-banner"
      data-lifecycle="failed"
      className="rounded-lg border border-red-500/30 bg-red-500/10 p-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            Settings unavailable
          </p>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {reasonMessage || `Error: ${reasonCode || "unknown"}`}
          </p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2"
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
