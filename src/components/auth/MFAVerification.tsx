"use client";

/**
 * MFA Verification Component
 *
 * Handles second-factor authentication verification during sign-in.
 * Supports TOTP (authenticator app) and backup codes.
 *
 * CANONICAL LAWS:
 * - Fail-closed: No dashboard access without MFA verification
 * - Explicit > Implicit: Clear UI states for MFA requirements
 * - No bypass paths: Must complete MFA to proceed
 */

import { useSignIn } from "@clerk/nextjs";
import type { SignInResource } from "@clerk/types";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

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

type MFAMethod = "totp" | "backup_code";

interface MFAVerificationProps {
  signInResource: SignInResource;
  redirectUrl: string;
  onBack?: () => void;
}

export function MFAVerification({
  signInResource,
  redirectUrl,
  onBack,
}: MFAVerificationProps) {
  const router = useRouter();
  const { setActive } = useSignIn();

  const [method, setMethod] = useState<MFAMethod>("totp");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check available second factors
  const supportedFactors = signInResource.supportedSecondFactors || [];
  const hasTOTP = supportedFactors.some((f) => f.strategy === "totp");
  const hasBackupCode = supportedFactors.some(
    (f) => f.strategy === "backup_code",
  );

  const handleVerifyTOTP = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!code.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await signInResource.attemptSecondFactor({
          strategy: "totp",
          code: code.trim(),
        });

        if (result.status === "complete" && result.createdSessionId) {
          await setActive?.({ session: result.createdSessionId });
          router.push(redirectUrl);
        } else {
          setError("Verification failed. Please try again.");
        }
      } catch (err: unknown) {
        const clerkError = err as { errors?: Array<{ message: string }> };
        const message =
          clerkError.errors?.[0]?.message ||
          (err instanceof Error ? err.message : "Invalid verification code");
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [signInResource, code, setActive, router, redirectUrl],
  );

  const handleVerifyBackupCode = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!code.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await signInResource.attemptSecondFactor({
          strategy: "backup_code",
          code: code.trim(),
        });

        if (result.status === "complete" && result.createdSessionId) {
          await setActive?.({ session: result.createdSessionId });
          router.push(redirectUrl);
        } else {
          setError("Verification failed. Please try again.");
        }
      } catch (err: unknown) {
        const clerkError = err as { errors?: Array<{ message: string }> };
        const message =
          clerkError.errors?.[0]?.message ||
          (err instanceof Error ? err.message : "Invalid backup code");
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [signInResource, code, setActive, router, redirectUrl],
  );

  // TOTP verification form
  if (method === "totp" && hasTOTP) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Two-factor authentication</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleVerifyTOTP} className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="totp-code" className={labelClassName}>
                Verification code
              </label>
              <input
                id="totp-code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                className={cn(inputClassName, "text-center tracking-widest")}
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
                "Verify"
              )}
            </Button>
          </form>

          {hasBackupCode && (
            <Button
              variant="link"
              type="button"
              className="h-auto p-0 text-sm"
              onClick={() => {
                setMethod("backup_code");
                setCode("");
                setError(null);
              }}
            >
              Use a backup code instead
            </Button>
          )}

          {onBack && (
            <Button
              variant="ghost"
              type="button"
              className="w-full"
              onClick={onBack}
            >
              Back to sign in
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Backup code verification form
  if (method === "backup_code" && hasBackupCode) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Use backup code</CardTitle>
          <CardDescription>
            Enter one of your backup codes to sign in
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleVerifyBackupCode} className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="backup-code" className={labelClassName}>
                Backup code
              </label>
              <input
                id="backup-code"
                name="code"
                type="text"
                autoComplete="off"
                required
                className={cn(inputClassName, "text-center tracking-wider")}
                placeholder="xxxx-xxxx"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="w-full"
            >
              {isLoading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "Verify"
              )}
            </Button>
          </form>

          {hasTOTP && (
            <Button
              variant="link"
              type="button"
              className="h-auto p-0 text-sm"
              onClick={() => {
                setMethod("totp");
                setCode("");
                setError(null);
              }}
            >
              Use authenticator app instead
            </Button>
          )}

          {onBack && (
            <Button
              variant="ghost"
              type="button"
              className="w-full"
              onClick={onBack}
            >
              Back to sign in
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Fallback if no supported methods
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Authentication required</CardTitle>
        <CardDescription>
          Two-factor authentication is required but no supported methods are
          available.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm text-muted-foreground text-center">
          Please contact support to resolve this issue.
        </p>
        {onBack && (
          <Button
            variant="ghost"
            type="button"
            className="w-full"
            onClick={onBack}
          >
            Back to sign in
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
