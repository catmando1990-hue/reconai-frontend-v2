"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { DuplicateGroup } from "@/lib/signals/types";

interface DuplicateChargesEvidenceProps {
  groups: DuplicateGroup[];
  onClose: () => void;
  onDismiss: () => void;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Evidence view for duplicate charges.
 * Shows source transactions with dates, vendors, amounts.
 * Explains the rule in plain language.
 */
export default function DuplicateChargesEvidence({
  groups,
  onClose,
  onDismiss,
}: DuplicateChargesEvidenceProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll and manage focus
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";

    // Focus the panel
    panelRef.current?.focus();

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-title"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-background p-6 outline-none"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <header className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h2 id="evidence-title" className="text-xl font-semibold">
              Potential Duplicate Charges
            </h2>
            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              Demo Data
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Sample transactions for demonstration. Connect data sources for real
            analysis.
          </p>
        </header>

        {/* Rule explanation */}
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Detection Rule
          </div>
          <p className="mt-1 text-sm">
            Transactions with the same vendor and same amount within 48 hours
            are flagged for review.
          </p>
        </div>

        {/* Evidence groups */}
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.id} className="rounded-lg border border-border p-4">
              <div className="mb-3 text-sm font-medium">
                {group.ruleExplanation}
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Vendor</th>
                    <th className="pb-2">Account</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {group.transactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-border/50">
                      <td className="py-2">{formatDate(txn.date)}</td>
                      <td className="py-2">{txn.vendor}</td>
                      <td className="py-2 text-muted-foreground">
                        {txn.account}
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatCurrency(txn.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Actions */}
        <footer className="mt-6 flex justify-end gap-3">
          <button
            onClick={onDismiss}
            className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Dismiss for now
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Done reviewing
          </button>
        </footer>
      </div>
    </div>
  );
}
