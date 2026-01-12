import { ClerkProviderWrapper } from "@/components/auth/ClerkProviderWrapper";
import { OnboardingProvider } from "@/lib/onboarding-context";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProviderWrapper>
      <OnboardingProvider>
        <div className="min-h-dvh bg-background text-foreground">
          <div className="mx-auto max-w-2xl px-6 py-12">{children}</div>
        </div>
      </OnboardingProvider>
    </ClerkProviderWrapper>
  );
}
