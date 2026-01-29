"use client";

import { useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useOrg } from "@/lib/org-context";
import { useFinancialEvidence } from "@/lib/financial-evidence-context";
import { Info } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

type Advisory = {
  id: string;
  message: string;
  detail?: string;
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Parse ISO date string to timestamp for comparison.
 * Returns null if parsing fails (suppress errors silently per Phase 8D).
 */
function parseTimestamp(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  try {
    const ts = new Date(dateStr).getTime();
    return isNaN(ts) ? null : ts;
  } catch {
    return null;
  }
}

/**
 * Check if two timestamps differ by more than the threshold.
 * Returns false if either timestamp is null (data unavailable - suppress check).
 */
function timestampsDifferSignificantly(
  ts1: number | null,
  ts2: number | null,
  thresholdMs: number = 24 * 60 * 60 * 1000, // 24 hours default
): boolean {
  if (ts1 === null || ts2 === null) return false;
  return Math.abs(ts1 - ts2) > thresholdMs;
}

/**
 * Check if a date falls within a period.
 */
function _dateWithinPeriod(
  dateTs: number | null,
  periodStart: string | null,
  periodEnd: string | null,
): boolean {
  if (dateTs === null) return true; // Can't determine, assume OK
  const startTs = parseTimestamp(periodStart);
  const endTs = parseTimestamp(periodEnd);
  if (startTs === null || endTs === null) return true; // Can't determine
  return dateTs >= startTs && dateTs <= endTs;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * ConsistencyAdvisory — UI-only advisory warnings for cross-report consistency
 *
 * Phase 8D Requirements:
 * - Advisory only (warnings, not errors)
 * - Never blocks user actions
 * - Never scores or ranks
 * - Uses neutral language with "may", "could", "might"
 * - No severity icons (no red/error states)
 * - RBAC gated: admin/org:admin only
 * - Suppresses checks silently when data unavailable
 *
 * Checks:
 * 1. Timestamp Mismatch - data sources generated at different times
 * 2. Missing Evidence - some data exists while statements are empty
 * 3. Out-of-Range Statement - statement period outside asset snapshot date
 */
export function ConsistencyAdvisory() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: orgLoaded } = useOrg();
  const evidenceContext = useFinancialEvidence();

  // ==========================================================================
  // RBAC CHECK
  // ==========================================================================

  const publicMetadata = user?.publicMetadata as
    | Record<string, unknown>
    | undefined;
  const role = publicMetadata?.role as string | undefined;
  const isAdmin = role === "admin" || role === "org:admin";

  const state = evidenceContext?.state;

  // ==========================================================================
  // CONSISTENCY CHECKS (must be before early returns per React hooks rules)
  // ==========================================================================

  const advisories = useMemo(() => {
    if (!state) return [];

    const warnings: Advisory[] = [];

    const { statements, assetSnapshots, liabilities, investments } = state;

    // Only run checks if at least 2 data sources have been loaded
    const loadedCount = [
      statements.loaded,
      assetSnapshots.loaded,
      liabilities.loaded,
      investments.holdingsLoaded || investments.transactionsLoaded,
    ].filter(Boolean).length;

    if (loadedCount < 2) {
      // Not enough data to compare - suppress checks silently
      return warnings;
    }

    // -------------------------------------------------------------------------
    // CHECK 1: Timestamp Mismatch
    // -------------------------------------------------------------------------

    const timestamps: Array<{ source: string; ts: number }> = [];

    // Collect fetch timestamps from loaded sources
    if (statements.loaded && statements.fetchedAt) {
      const ts = parseTimestamp(statements.fetchedAt);
      if (ts !== null) timestamps.push({ source: "statements", ts });
    }

    if (assetSnapshots.loaded && assetSnapshots.snapshots.length > 0) {
      // Use most recent snapshot's generated_at
      const latestSnapshot = assetSnapshots.snapshots
        .map((s) => parseTimestamp(s.generatedAt))
        .filter((ts): ts is number => ts !== null)
        .sort((a, b) => b - a)[0];
      if (latestSnapshot) {
        timestamps.push({ source: "snapshot", ts: latestSnapshot });
      }
    }

    if (liabilities.loaded && liabilities.fetchedAt) {
      const ts = parseTimestamp(liabilities.fetchedAt);
      if (ts !== null) timestamps.push({ source: "liabilities", ts });
    }

    if (investments.holdingsLoaded && investments.holdingsFetchedAt) {
      const ts = parseTimestamp(investments.holdingsFetchedAt);
      if (ts !== null) timestamps.push({ source: "investments", ts });
    }

    // Check for significant differences between any pair
    if (timestamps.length >= 2) {
      const minTs = Math.min(...timestamps.map((t) => t.ts));
      const maxTs = Math.max(...timestamps.map((t) => t.ts));
      const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

      if (timestampsDifferSignificantly(minTs, maxTs, ONE_WEEK_MS)) {
        warnings.push({
          id: "timestamp-mismatch",
          message:
            "These data sources may have been generated at different times.",
          detail: "Consider reloading all data sources to ensure consistency.",
        });
      }
    }

    // -------------------------------------------------------------------------
    // CHECK 2: Missing Evidence
    // -------------------------------------------------------------------------

    const hasStatements = statements.loaded && statements.count > 0;
    const hasOtherData =
      (assetSnapshots.loaded && assetSnapshots.count > 0) ||
      (liabilities.loaded && liabilities.hasData) ||
      investments.holdingsLoaded;

    if (!hasStatements && hasOtherData) {
      warnings.push({
        id: "missing-statements",
        message: "Some financial evidence may be missing for this period.",
        detail: "Bank statements could provide additional documentation.",
      });
    }

    // Reverse check: statements exist but no other data
    if (hasStatements && !hasOtherData && loadedCount >= 2) {
      warnings.push({
        id: "missing-snapshots",
        message: "Additional financial data may be available.",
        detail:
          "Asset snapshots, liabilities, or investment data could provide more context.",
      });
    }

    // -------------------------------------------------------------------------
    // CHECK 3: Out-of-Range Statement
    // -------------------------------------------------------------------------

    if (
      statements.loaded &&
      statements.periods.length > 0 &&
      assetSnapshots.loaded &&
      assetSnapshots.snapshots.length > 0
    ) {
      // Get snapshot timestamp range
      const snapshotTimestamps = assetSnapshots.snapshots
        .map((s) => parseTimestamp(s.generatedAt))
        .filter((ts): ts is number => ts !== null);

      if (snapshotTimestamps.length > 0) {
        const earliestSnapshot = Math.min(...snapshotTimestamps);
        const latestSnapshot = Math.max(...snapshotTimestamps);

        // Check if any statement period doesn't overlap with snapshot range
        // Allow 30 days buffer for reasonable alignment
        const BUFFER_MS = 30 * 24 * 60 * 60 * 1000;

        for (const period of statements.periods) {
          const periodEnd = parseTimestamp(period.end);
          const periodStart = parseTimestamp(period.start);

          if (periodEnd !== null && periodStart !== null) {
            // Statement is out of range if it ends more than 30 days before earliest snapshot
            // OR starts more than 30 days after latest snapshot
            const tooEarly = periodEnd < earliestSnapshot - BUFFER_MS;
            const tooLate = periodStart > latestSnapshot + BUFFER_MS;

            if (tooEarly || tooLate) {
              warnings.push({
                id: `out-of-range-${period.start}-${period.end}`,
                message:
                  "A statement period may not align with the selected asset snapshot timeframe.",
                detail:
                  "This could indicate data from different reporting periods.",
              });
              // Only show one out-of-range warning
              break;
            }
          }
        }
      }
    }

    return warnings;
  }, [state]);

  // Don't render until auth is loaded
  if (!userLoaded || !orgLoaded) return null;

  // RBAC: Hide completely if not admin
  if (!isAdmin) return null;

  // No context available - render nothing (component used outside provider)
  if (!evidenceContext) return null;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // No advisories to show
  if (advisories.length === 0) return null;

  return (
    <div className="space-y-2">
      {advisories.map((advisory) => (
        <div
          key={advisory.id}
          className="rounded-lg border border-border bg-muted/30 p-3"
        >
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="text-foreground">{advisory.message}</p>
              {advisory.detail && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {advisory.detail}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Footer - explain advisory nature */}
      <p className="text-[10px] text-muted-foreground px-1">
        Advisory only. These observations do not affect data accuracy or prevent
        any actions.
      </p>
    </div>
  );
}

export default ConsistencyAdvisory;
