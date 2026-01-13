"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

type PolicyType = "bookkeeping" | "accounting" | "tax" | "legal";

type Props = {
  policy: PolicyType;
  message: string;
  context?: string;
};

const policyLabels: Record<PolicyType, string> = {
  bookkeeping: "Bookkeeping Disclaimer",
  accounting: "Accounting Disclaimer",
  tax: "Tax Disclaimer",
  legal: "Legal Disclaimer",
};

export default function PolicyBanner({ policy, message, context }: Props) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const acknowledge = async () => {
    try {
      await apiFetch("/api/policy/acknowledge", {
        method: "POST",
        body: JSON.stringify({
          policy,
          version: "1.0",
          context: context ?? window.location.pathname,
        }),
      });
      setAcknowledged(true);
    } catch {
      // Silent failure on API error per requirements
    }
  };

  // Don't render if dismissed
  if (dismissed) return null;

  return (
    <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        {acknowledged ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-400">
              {policyLabels[policy]}
            </span>
            {acknowledged && (
              <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-400">
                Acknowledged
              </span>
            )}
          </div>
          <p className="text-sm text-foreground/90">{message}</p>

          {!acknowledged && (
            <button
              onClick={acknowledge}
              className="mt-2 text-xs font-medium text-amber-400 underline underline-offset-2 transition-colors hover:text-amber-300"
            >
              I understand and acknowledge
            </button>
          )}
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
