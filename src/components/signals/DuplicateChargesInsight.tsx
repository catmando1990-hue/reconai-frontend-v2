"use client";

import { useState, useMemo, useSyncExternalStore, useCallback } from "react";
import { X } from "lucide-react";
import { getDuplicateSignal } from "@/lib/signals/duplicate-detection";
import DuplicateChargesEvidence from "./DuplicateChargesEvidence";

/**
 * SessionStorage key for dismissal state.
 * Scoped to this specific signal. Resets on new browser session.
 */
const DISMISS_KEY = "reconai:signal:duplicate_charges:dismissed";

function getSessionDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return true; // Assume dismissed on server to avoid flash
}

function subscribe(): () => void {
  return () => {};
}

/**
 * Dashboard insight for duplicate charges.
 * One calm line + one action.
 * Dismissible with session persistence.
 */
export default function DuplicateChargesInsight() {
  const initialDismissed = useSyncExternalStore(
    subscribe,
    getSessionDismissed,
    getServerSnapshot,
  );
  const [dismissed, setDismissed] = useState(initialDismissed);
  const [showEvidence, setShowEvidence] = useState(false);

  // Compute groups once (mock data is static)
  const groups = useMemo(() => getDuplicateSignal().groups, []);

  const handleDismiss = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore storage errors
    }
    setDismissed(true);
    setShowEvidence(false);
  }, []);

  // Don't render if dismissed or no duplicates found
  if (dismissed || groups.length === 0) {
    return null;
  }

  const totalDuplicates = groups.reduce(
    (sum, g) => sum + g.transactions.length,
    0,
  );

  return (
    <>
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            Demo Data
          </span>
          <p className="text-sm text-muted-foreground">
            {groups.length === 1
              ? `${totalDuplicates} transactions may be duplicates`
              : `${groups.length} sets of potential duplicate charges`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEvidence(true)}
            className="text-sm font-medium text-foreground hover:underline"
          >
            Review charges
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showEvidence && (
        <DuplicateChargesEvidence
          groups={groups}
          onClose={() => setShowEvidence(false)}
          onDismiss={handleDismiss}
        />
      )}
    </>
  );
}
