import { MFAEnrollment } from "@/components/auth/MFAEnrollment";

/**
 * MFA Setup Page
 *
 * Forces users without MFA to enroll before accessing dashboard.
 * This page is reached when:
 * 1. User signs in but has no MFA enrolled
 * 2. User is redirected from dashboard without MFA
 *
 * CANONICAL LAWS:
 * - Fail-closed: Cannot bypass this page without MFA enrollment
 * - No skip paths: Must complete enrollment to proceed
 */

export const dynamic = "force-dynamic";

export default function MFASetupPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-app-canvas p-4 sm:p-6">
      <MFAEnrollment redirectUrl="/accounts" />
    </div>
  );
}
