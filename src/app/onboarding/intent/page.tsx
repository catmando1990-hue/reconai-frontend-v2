"use client";

import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building,
  FileText,
  Home,
  Target,
} from "lucide-react";
import { useOnboarding, type OperatingIntent } from "@/lib/onboarding-context";

const INTENT_OPTIONS: Array<{
  id: OperatingIntent;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "personal-finance",
    label: "Personal Finance",
    description: "Track personal income, expenses, and budgeting",
    icon: Banknote,
  },
  {
    id: "small-business",
    label: "Small Business Operations",
    description: "Revenue tracking, expense management, P&L",
    icon: Building,
  },
  {
    id: "contractor",
    label: "Contractor / Consultant",
    description: "Project-based income, 1099 tracking, deductions",
    icon: FileText,
  },
  {
    id: "property-management",
    label: "Property Management",
    description: "Rental income, property expenses, tenant tracking",
    icon: Home,
  },
  {
    id: "enterprise-finance",
    label: "Enterprise Finance",
    description: "Multi-entity, consolidated reporting, structured for review",
    icon: Target,
  },
];

export default function IntentPage() {
  const { state, updateState, canProceed, nextStep, prevStep } =
    useOnboarding();

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4" />
          Step 3 of 6
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Operating intent
        </h1>
        <p className="mt-2 text-muted-foreground">
          What&apos;s the primary use case? This configures default categories
          and report templates.
        </p>
      </header>

      <div className="space-y-3">
        {INTENT_OPTIONS.map(({ id, label, description, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => updateState({ operatingIntent: id })}
            className={`w-full flex items-start gap-4 rounded-xl border p-4 text-left transition ${
              state.operatingIntent === id
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-accent"
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                state.operatingIntent === id
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
