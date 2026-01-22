"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import {
  DESTRUCTIVE_ACTIONS,
  type DestructiveAction,
} from "@/hooks/useSettingsConfig";

interface DestructiveActionConfirmationProps {
  action: DestructiveAction;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  hasPolicyAcknowledged: boolean;
  onAcknowledgePolicy: () => Promise<void>;
}

/**
 * PART 3 — Guardrails: Confirmation dialog for destructive actions
 * - Requires exact phrase confirmation
 * - Requires policy acknowledgement
 * - Shows clear warning about consequences
 */
export function DestructiveActionConfirmation({
  action,
  isOpen,
  onClose,
  onConfirm,
  hasPolicyAcknowledged,
  onAcknowledgePolicy,
}: DestructiveActionConfirmationProps) {
  const [confirmInput, setConfirmInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const actionConfig = DESTRUCTIVE_ACTIONS[action];

  if (!isOpen || !actionConfig) return null;

  const handleConfirm = () => {
    // Validate confirmation phrase
    if (confirmInput !== actionConfig.phrase) {
      setError(`You must type exactly: ${actionConfig.phrase}`);
      return;
    }

    // Check policy acknowledgement
    if (!hasPolicyAcknowledged) {
      setError("You must acknowledge the policy before proceeding.");
      return;
    }

    setError(null);
    onConfirm();
    onClose();
  };

  const handleAcknowledgePolicy = async () => {
    setIsAcknowledging(true);
    try {
      await onAcknowledgePolicy();
      setError(null);
    } catch {
      setError("Failed to acknowledge policy. Please try again.");
    } finally {
      setIsAcknowledging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg border border-red-500/30 bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-base font-semibold">Confirm Destructive Action</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Warning */}
          {/* BACKGROUND NORMALIZATION: No decorative colors - use border-border bg-muted */}
          <div className="rounded-lg border border-border bg-muted p-4">
            <p className="text-sm font-medium text-foreground">
              {actionConfig.description}
            </p>
          </div>

          {/* Policy Acknowledgement */}
          {/* BACKGROUND NORMALIZATION: No decorative colors - use border-border bg-muted */}
          {!hasPolicyAcknowledged && (
            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="text-sm text-muted-foreground mb-3">
                You must acknowledge the terms of service and data policy before
                performing destructive actions.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAcknowledgePolicy}
                disabled={isAcknowledging}
              >
                {isAcknowledging ? "Acknowledging…" : "I Acknowledge"}
              </Button>
            </div>
          )}

          {/* Confirmation Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Type <code className="bg-muted px-1 rounded">{actionConfig.phrase}</code> to confirm:
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => {
                setConfirmInput(e.target.value);
                setError(null);
              }}
              placeholder="Type the exact phrase..."
              className="w-full rounded-lg border border-border bg-background p-3 text-sm"
              autoComplete="off"
            />
            {error && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={
              confirmInput !== actionConfig.phrase || !hasPolicyAcknowledged
            }
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
