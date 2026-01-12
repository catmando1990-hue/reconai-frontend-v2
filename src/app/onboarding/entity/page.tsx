"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Briefcase,
  Users,
} from "lucide-react";
import { useOnboarding, type EntityType } from "@/lib/onboarding-context";

const ENTITY_OPTIONS: Array<{
  id: EntityType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "individual",
    label: "Individual",
    description: "Personal finances, freelance, or sole proprietor",
    icon: Briefcase,
  },
  {
    id: "business",
    label: "Small Business",
    description: "LLC, partnership, or small corporation",
    icon: Users,
  },
  {
    id: "enterprise",
    label: "Enterprise",
    description: "Large organization with multiple departments",
    icon: Building2,
  },
];

export default function EntityPage() {
  const { state, updateState, canProceed, nextStep, prevStep } =
    useOnboarding();

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          Step 2 of 6
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Define your entity
        </h1>
        <p className="mt-2 text-muted-foreground">
          This helps ReconAI configure appropriate categorization rules and
          reporting templates.
        </p>
      </header>

      <div className="space-y-4">
        <div className="space-y-3">
          {ENTITY_OPTIONS.map(({ id, label, description, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => updateState({ entityType: id })}
              className={`w-full flex items-start gap-4 rounded-xl border p-4 text-left transition ${
                state.entityType === id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  state.entityType === id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">{label}</div>
                <div className="text-sm text-muted-foreground">
                  {description}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label htmlFor="entityName" className="text-sm font-medium">
            Entity name
          </label>
          <input
            id="entityName"
            type="text"
            placeholder={
              state.entityType === "individual"
                ? "Your name"
                : "Company or organization name"
            }
            value={state.entityName}
            onChange={(e) => updateState({ entityName: e.target.value })}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
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
