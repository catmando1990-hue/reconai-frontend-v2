import React from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ClerkProviderWrapper } from "@/components/auth/ClerkProviderWrapper";
import { getBackendUrl } from "@/lib/config";
import { auditedFetch } from "@/lib/auditedFetch";

/**
 * P0: Check profile completion status from backend (single source of truth)
 * FAIL-OPEN: If status check fails, allow access (don't block users due to network issues)
 * The profile completion page will also check and redirect if needed.
 */
async function checkProfileCompleted(
  token: string | null,
): Promise<boolean | null> {
  if (!token) return null;

  try {
    const data = await auditedFetch<{
      profileCompleted?: boolean;
      request_id?: string;
    }>(`${getBackendUrl()}/api/profile/status`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      skipBodyValidation: true,
    });

    return data.profileCompleted === true;
  } catch (err) {
    console.warn("Profile status check error:", err);
    return null; // Fail-open on network error
  }
}

/**
 * Responsive dashboard shell:
 * - md+: 3-tier sidebar (rail + context + content)
 * - mobile: top bar + drawer (rail + context)
 *
 * P0 MFA ENFORCEMENT:
 * - Defense-in-depth check for MFA enrollment
 * - Redirects to MFA setup if user has no MFA enabled
 * - Works alongside middleware MFA check
 *
 * P0 PROFILE COMPLETION:
 * - Checks backend for profile_completed status
 * - Redirects to /complete-profile if not completed
 * - Single source of truth is backend database
 */
export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, getToken } = await auth();

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

  // P0 PROFILE COMPLETION: Check backend status (single source of truth)
  // Only check if we have a valid token
  const token = await getToken();
  const profileCompleted = await checkProfileCompleted(token);

  // Redirect to profile completion if explicitly incomplete
  // Fail-open: null means we couldn't check, so allow access
  if (profileCompleted === false) {
    redirect("/complete-profile?redirect_url=/home");
  }

  return (
    <ClerkProviderWrapper>
      <DashboardShell>{children}</DashboardShell>
    </ClerkProviderWrapper>
  );
}
