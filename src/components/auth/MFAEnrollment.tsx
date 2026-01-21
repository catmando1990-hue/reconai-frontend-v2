"use client";

/**
 * MFA Enrollment Component
 *
 * Forces users to enroll in MFA before accessing the dashboard.
 * Supports TOTP (authenticator app) setup with backup codes.
 *
 * CANONICAL LAWS:
 * - Fail-closed: No dashboard access without MFA enrollment
 * - No skip paths: MFA enrollment is mandatory
 * - Explicit > Implicit: Clear instructions for setup
 */

import { useUser } from "@clerk/nextjs";
import type { TOTPResource } from "@clerk/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const inputClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

const labelClassName = "text-sm font-medium leading-none";

type EnrollmentStep = "intro" | "setup" | "verify" | "backup_codes" | "complete";

interface MFAEnrollmentProps {
  redirectUrl?: string;
}

export function MFAEnrollment({ redirectUrl = "/accounts" }: MFAEnrollmentProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [step, setStep] = useState<EnrollmentStep>("intro");
  const [totp, setTotp] = useState<TOTPResource | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user already has MFA enabled
  useEffect(() => {
    if (isLoaded && user) {
      const hasTOTP = user.twoFactorEnabled;
      if (hasTOTP) {
        // User already has MFA, redirect to dashboard
        router.push(redirectUrl);
      }
    }
  }, [isLoaded, user, router, redirectUrl]);

  const handleStartSetup = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create TOTP secret
      const totpResource = await user.createTOTP();
      setTotp(totpResource);
      setStep("setup");
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> };
      const message =
        clerkError.errors?.[0]?.message ||
        (err instanceof Error ? err.message : "Failed to start MFA setup");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const handleVerifyTOTP = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !code.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        // Verify the TOTP code
        const result = await user.verifyTOTP({ code: code.trim() });

        if (result.verified) {
          // Get backup codes
          const backupCodesResource = await user.createBackupCode();
          setBackupCodes(backupCodesResource.codes);
          setStep("backup_codes");
        } else {
          setError("Invalid verification code. Please try again.");
        }
      } catch (err: unknown) {
        const clerkError = err as { errors?: Array<{ message: string }> };
        const message =
          clerkError.errors?.[0]?.message ||
          (err instanceof Error ? err.message : "Verification failed");
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [user, code]
  );

  const handleComplete = useCallback(() => {
    router.push(redirectUrl);
  }, [router, redirectUrl]);

  const handleCopyBackupCodes = useCallback(async () => {
    const codesText = backupCodes.join("\n");
    await navigator.clipboard.writeText(codesText);
  }, [backupCodes]);

  if (!isLoaded) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Loading...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  // Introduction step
  if (step === "intro") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Secure your account</CardTitle>
          <CardDescription>
            Two-factor authentication (MFA) is required to access ReconAI.
            This adds an extra layer of security to your financial data.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>Why is MFA required?</strong>
              <br />
              ReconAI handles sensitive financial information. MFA protects your
              account even if your password is compromised.
            </p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>You&apos;ll need:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>An authenticator app (Google Authenticator, Authy, 1Password, etc.)</li>
              <li>A safe place to store backup codes</li>
            </ul>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleStartSetup} disabled={isLoading} className="w-full">
            {isLoading ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              "Set up two-factor authentication"
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Setup step - show QR code
  if (step === "setup" && totp) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Scan QR code</CardTitle>
          <CardDescription>
            Open your authenticator app and scan this QR code
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex justify-center">
            {totp.uri && (
              <div className="rounded-lg border bg-white p-4">
                {/* QR code rendered via img tag with data URI */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totp.uri)}`}
                  alt="TOTP QR Code"
                  className="size-48"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Can&apos;t scan? Enter this code manually:
            </p>
            <code className="block rounded bg-muted px-3 py-2 text-center text-sm font-mono break-all">
              {totp.secret}
            </code>
          </div>

          <Button onClick={() => setStep("verify")} className="w-full">
            I&apos;ve scanned the code
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Verify step
  if (step === "verify") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Verify setup</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleVerifyTOTP} className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="verify-code" className={labelClassName}>
                Verification code
              </label>
              <input
                id="verify-code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                className={cn(inputClassName, "text-center tracking-widest text-lg")}
                placeholder="000000"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                disabled={isLoading}
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full"
            >
              {isLoading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "Verify and continue"
              )}
            </Button>
          </form>

          <Button
            variant="ghost"
            type="button"
            className="w-full"
            onClick={() => {
              setStep("setup");
              setCode("");
              setError(null);
            }}
          >
            Back to QR code
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Backup codes step
  if (step === "backup_codes") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Save your backup codes</CardTitle>
          <CardDescription>
            Store these codes in a safe place. You can use them to sign in if you
            lose access to your authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>Important:</strong> Each code can only be used once. Store them
              securely and do not share them.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-4">
            {backupCodes.map((code, index) => (
              <code key={index} className="text-sm font-mono text-center py-1">
                {code}
              </code>
            ))}
          </div>

          <Button variant="outline" onClick={handleCopyBackupCodes} className="w-full">
            Copy backup codes
          </Button>

          <Button onClick={handleComplete} className="w-full">
            I&apos;ve saved my backup codes
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
