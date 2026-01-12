"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Settings } from "lucide-react";
import { useOnboarding } from "@/lib/onboarding-context";

const PROCESSING_STEPS = [
  "Configuring entity profile",
  "Setting up category templates",
  "Preparing data connections",
  "Initializing reports",
];

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const isSecure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const secureFlag = isSecure ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secureFlag}`;
}

export default function ProcessingPage() {
  const { state, nextStep } = useOnboarding();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (currentStepIndex < PROCESSING_STEPS.length) {
      const timer = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else if (!completed) {
      // All steps done - save onboarding data to localStorage
      // User will sync to Clerk after signing in
      const completeOnboarding = () => {
        try {
          const now = new Date().toISOString();
          const onboardingData = {
            onboardingComplete: true,
            onboardingCompleteAt: now,
            entityType: state.entityType,
            entityName: state.entityName,
            operatingIntent: state.operatingIntent,
            dataSource: state.dataSource,
          };
          localStorage.setItem(
            "reconai_onboarding",
            JSON.stringify(onboardingData),
          );
          setCookie("onboarding_complete", "true", 365);
        } catch (error) {
          console.error("Failed to save onboarding:", error);
        }

        setCompleted(true);
        // Move to complete page
        setTimeout(() => {
          nextStep();
        }, 500);
      };

      completeOnboarding();
    }
  }, [currentStepIndex, completed, state, nextStep]);

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Settings className="h-4 w-4" />
          Step 5 of 6
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Setting up your workspace
        </h1>
        <p className="mt-2 text-muted-foreground">
          Configuring ReconAI based on your selections.
        </p>
      </header>

      <div className="space-y-3">
        {PROCESSING_STEPS.map((step, index) => {
          const isComplete = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div
              key={step}
              className={`flex items-center gap-3 rounded-xl border p-4 transition ${
                isComplete
                  ? "border-primary/30 bg-primary/5"
                  : isCurrent
                    ? "border-border bg-accent"
                    : "border-border opacity-50"
              }`}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : isCurrent ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                )}
              </div>
              <span
                className={`text-sm ${isComplete ? "text-foreground" : "text-muted-foreground"}`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>

      {completed && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
          <div className="mt-2 font-medium">Setup complete</div>
          <div className="text-sm text-muted-foreground">
            Redirecting to your first insight...
          </div>
        </div>
      )}
    </div>
  );
}
