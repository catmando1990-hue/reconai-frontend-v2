import React from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ClerkProviderWrapper } from "@/components/auth/ClerkProviderWrapper";

/**
 * Responsive dashboard shell:
 * - md+: 3-tier sidebar (rail + context + content)
 * - mobile: top bar + drawer (rail + context)
 *
 * P0 MFA ENFORCEMENT:
 * - Defense-in-depth check for MFA enrollment
 * - Redirects to MFA setup if user has no MFA enabled
 * - Works alongside middleware MFA check
 */
export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard");
  }

  // P0 MFA: Defense-in-depth check
  // If MFA enforcement is enabled, verify user has MFA set up
  const enforceMFA = process.env.NEXT_PUBLIC_ENFORCE_MFA === "true";

  if (enforceMFA) {
    const user = await currentUser();

    if (user && !user.twoFactorEnabled) {
      // User is authenticated but doesn't have MFA enabled
      // Redirect to MFA setup page
      redirect("/mfa-setup?redirect_url=/dashboard");
    }
  }

  return (
    <ClerkProviderWrapper>
      <DashboardShell>{children}</DashboardShell>
    </ClerkProviderWrapper>
  );
}
