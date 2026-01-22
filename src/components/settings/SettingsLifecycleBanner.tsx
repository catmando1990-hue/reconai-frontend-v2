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
  // BACKGROUND NORMALIZATION: No decorative colors - use border-border bg-muted
  if (lifecycle === "pending") {
    return (
      <div
        data-testid="settings-lifecycle-banner"
        data-lifecycle="pending"
        className="rounded-lg border border-border bg-muted p-4"
      >
        <div className="flex items-start gap-3">
          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Loading settings…
            </p>
            {reasonMessage && (
              <p className="mt-1 text-xs text-muted-foreground">
                {reasonMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Stale state - show warning with reason
  // BACKGROUND NORMALIZATION: No decorative colors - use border-border bg-muted
  if (lifecycle === "stale") {
    return (
      <div
        data-testid="settings-lifecycle-banner"
        data-lifecycle="stale"
        className="rounded-lg border border-border bg-muted p-4"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Settings may be outdated
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
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
  // BACKGROUND NORMALIZATION: No decorative colors - use border-border bg-muted
  return (
    <div
      data-testid="settings-lifecycle-banner"
      data-lifecycle="failed"
      className="rounded-lg border border-border bg-muted p-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            Settings unavailable
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
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
