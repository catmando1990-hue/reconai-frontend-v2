/**
 * Phase 19: Onboarding background
 * - Calm, enterprise-grade background
 * - Abstract security visual (low opacity, blurred)
 * - Works in light & dark mode
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen onboarding-bg">
      <div className="absolute inset-0 onboarding-visual" />
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        {children}
      </div>
    </div>
  );
}
