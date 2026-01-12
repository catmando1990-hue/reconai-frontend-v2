"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

export type EntityType = "individual" | "business" | "enterprise";
export type OperatingIntent =
  | "personal-finance"
  | "small-business"
  | "contractor"
  | "property-management"
  | "enterprise-finance";
export type DataSource = "bank-connect" | "manual-upload" | "later";

export interface OnboardingState {
  // Step 0: Compliance
  complianceAcknowledged: boolean;
  // Step 1: Entity
  entityType: EntityType | null;
  entityName: string;
  // Step 2: Intent
  operatingIntent: OperatingIntent | null;
  // Step 3: Data
  dataSource: DataSource | null;
}

interface OnboardingContextValue {
  state: OnboardingState;
  currentStep: number;
  totalSteps: number;
  updateState: (updates: Partial<OnboardingState>) => void;
  nextStep: () => void;
  prevStep: () => void;
  canProceed: boolean;
}

const STEPS = [
  "/onboarding", // 0: Compliance Gate
  "/onboarding/entity", // 1: Entity Definition
  "/onboarding/intent", // 2: Operating Intent
  "/onboarding/data", // 3: Data Path
  "/onboarding/processing", // 4: Processing
  "/onboarding/complete", // 5: First Value
];

const DEFAULT_STATE: OnboardingState = {
  complianceAcknowledged: false,
  entityType: null,
  entityName: "",
  operatingIntent: null,
  dataSource: null,
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({
  children,
  initialStep = 0,
}: {
  children: React.ReactNode;
  initialStep?: number;
}) {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [currentStep, setCurrentStep] = useState(initialStep);

  const updateState = useCallback((updates: Partial<OnboardingState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0:
        return state.complianceAcknowledged;
      case 1:
        return state.entityType !== null && state.entityName.trim().length > 0;
      case 2:
        return state.operatingIntent !== null;
      case 3:
        return state.dataSource !== null;
      case 4:
        return true; // Processing step auto-proceeds
      case 5:
        return true; // Complete step
      default:
        return false;
    }
  }, [currentStep, state]);

  const nextStep = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      router.push(STEPS[next]);
    }
  }, [currentStep, router]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      router.push(STEPS[prev]);
    }
  }, [currentStep, router]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      state,
      currentStep,
      totalSteps: STEPS.length,
      updateState,
      nextStep,
      prevStep,
      canProceed,
    }),
    [state, currentStep, updateState, nextStep, prevStep, canProceed],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
}
