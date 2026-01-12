"use client";

import {
  ArrowLeft,
  ArrowRight,
  Database,
  Link2,
  Clock,
  Upload,
} from "lucide-react";
import { useOnboarding, type DataSource } from "@/lib/onboarding-context";

const DATA_OPTIONS: Array<{
  id: DataSource;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "bank-connect",
    label: "Connect bank accounts",
    description: "Securely link accounts via Plaid for automatic sync",
    icon: Link2,
  },
  {
    id: "manual-upload",
    label: "Upload statements",
    description: "Import CSV, OFX, or QFX files manually",
    icon: Upload,
  },
  {
    id: "later",
    label: "Set up later",
    description: "Skip data import for now and explore the platform",
    icon: Clock,
  },
];

export default function DataPage() {
  const { state, updateState, canProceed, nextStep, prevStep } =
    useOnboarding();

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Database className="h-4 w-4" />
          Step 4 of 6
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Data source
        </h1>
        <p className="mt-2 text-muted-foreground">
          How would you like to get your financial data into ReconAI?
        </p>
      </header>

      <div className="space-y-3">
        {DATA_OPTIONS.map(({ id, label, description, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => updateState({ dataSource: id })}
            className={`w-full flex items-start gap-4 rounded-xl border p-4 text-left transition ${
              state.dataSource === id
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-accent"
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                state.dataSource === id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium">{label}</div>
              <div className="text-sm text-muted-foreground">{description}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 text-sm">
        <div className="font-medium">Bank connection security</div>
        <div className="mt-1 text-muted-foreground">
          ReconAI uses Plaid for bank connections. Your credentials are never
          stored on our servers. Plaid is SOC 2 Type II certified.
        </div>
      </div>

      <footer className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={prevStep}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
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
