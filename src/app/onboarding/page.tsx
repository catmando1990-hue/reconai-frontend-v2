"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useOnboarding } from "@/lib/onboarding-context";

export default function ComplianceGatePage() {
  const { state, updateState, canProceed, nextStep } = useOnboarding();

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          Step 1 of 6
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Compliance acknowledgement
        </h1>
        <p className="mt-2 text-muted-foreground">
          ReconAI generates structured, reviewable financial reports. Before
          proceeding, confirm you understand the following.
        </p>
      </header>

      <div className="space-y-4">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition hover:bg-accent">
          <input
            type="checkbox"
            checked={state.complianceAcknowledged}
            onChange={(e) =>
              updateState({ complianceAcknowledged: e.target.checked })
            }
            className="mt-1 h-4 w-4 rounded border-input"
          />
          <div className="text-sm">
            <div className="font-medium">
              I acknowledge that ReconAI outputs are for informational purposes
            </div>
            <div className="mt-1 text-muted-foreground">
              Outputs should be reviewed by qualified professionals before use
              in financial reporting, tax filings, or regulatory submissions.
            </div>
          </div>
        </label>

        <div className="rounded-xl border border-border bg-card p-4 text-sm">
          <div className="font-medium">What this means</div>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>
              ReconAI assists with categorization, analysis, and reporting
            </li>
            <li>All outputs should be verified before external use</li>
            <li>You retain responsibility for your financial decisions</li>
          </ul>
        </div>
      </div>

      <footer className="flex items-center justify-between pt-4">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition"
        >
          Back to home
        </Link>
        <button
          type="button"
          onClick={nextStep}
          disabled={!canProceed}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition ${
            canProceed
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </footer>
    </div>
  );
}
