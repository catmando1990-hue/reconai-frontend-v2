import { OnboardingProvider } from "@/lib/onboarding-context";

/**
 * Onboarding layout - owns the app canvas for onboarding flow.
 * CANONICAL RULE: Layouts own backgrounds, not pages.
 *
 * Uses bg-app-canvas (charcoal in dark mode) so onboarding content
 * appears on a lighter backdrop.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingProvider>
      <div className="min-h-dvh bg-app-canvas text-foreground">
        <div className="mx-auto max-w-2xl px-6 py-12">{children}</div>
      </div>
    </OnboardingProvider>
  );
}
