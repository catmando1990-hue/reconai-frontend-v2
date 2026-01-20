"use client";

import { useSignUp } from "@clerk/nextjs";
import type { OAuthStrategy } from "@clerk/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

const inputClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

const labelClassName = "text-sm font-medium leading-none";

function LoadingCard() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>Loading...</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-8">
        <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </CardContent>
    </Card>
  );
}

type SignUpStep = "start" | "verify_email" | "verify_phone" | "continue";

function SignUpFormContent({ redirectUrl }: { redirectUrl?: string }) {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();

  const [step, setStep] = useState<SignUpStep>("start");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const finalRedirectUrl = redirectUrl || "/accounts";

  const signUpWithOAuth = useCallback(
    async (strategy: OAuthStrategy) => {
      if (!signUp) return;
      setIsGoogleLoading(true);
      setError(null);

      try {
        await signUp.authenticateWithRedirect({
          strategy,
          redirectUrl: "/sign-up/sso-callback",
          redirectUrlComplete: finalRedirectUrl,
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to sign up with Google";
        setError(message);
        setIsGoogleLoading(false);
      }
    },
    [signUp, finalRedirectUrl],
  );

  const handleSignUpSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!signUp || !email.trim() || !password) return;

      setIsLoading(true);
      setError(null);

      try {
        await signUp.create({
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          emailAddress: email.trim(),
          password,
        });

        // Prepare email verification
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });

        setStep("verify_email");
        setResendTimer(30);
      } catch (err: unknown) {
        const clerkError = err as { errors?: Array<{ message: string }> };
        const message =
          clerkError.errors?.[0]?.message ||
          (err instanceof Error ? err.message : "Failed to create account");
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [signUp, firstName, lastName, email, password],
  );

  const handleVerifyEmail = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!signUp || !code) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await signUp.attemptEmailAddressVerification({
          code,
        });

        if (result.status === "complete" && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          router.push(finalRedirectUrl);
        } else if (result.status === "missing_requirements") {
          // User might need to complete additional fields
          setStep("continue");
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
    [signUp, code, setActive, router, finalRedirectUrl],
  );

  const handleVerifyPhone = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!signUp || !code) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await signUp.attemptPhoneNumberVerification({
          code,
        });

        if (result.status === "complete" && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          router.push(finalRedirectUrl);
        } else if (result.status === "missing_requirements") {
          setStep("continue");
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
    [signUp, code, setActive, router, finalRedirectUrl],
  );

  const handleContinueProfile = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!signUp) return;

      setIsLoading(true);
      setError(null);

      try {
        await signUp.update({
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
        });

        if (signUp.status === "complete" && signUp.createdSessionId) {
          await setActive({ session: signUp.createdSessionId });
          router.push(finalRedirectUrl);
        }
      } catch (err: unknown) {
        const clerkError = err as { errors?: Array<{ message: string }> };
        const message =
          clerkError.errors?.[0]?.message ||
          (err instanceof Error ? err.message : "Failed to update profile");
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [signUp, firstName, lastName, setActive, router, finalRedirectUrl],
  );

  const handleResendCode = useCallback(async () => {
    if (!signUp || resendTimer > 0) return;

    setError(null);

    try {
      if (step === "verify_email") {
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
      } else if (step === "verify_phone") {
        await signUp.preparePhoneNumberVerification({
          strategy: "phone_code",
        });
      }
      setResendTimer(30);
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> };
      const message =
        clerkError.errors?.[0]?.message ||
        (err instanceof Error ? err.message : "Failed to resend code");
      setError(message);
    }
  }, [signUp, step, resendTimer]);

  // Resend timer countdown
  useState(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  });

  if (!isLoaded) {
    return <LoadingCard />;
  }

  // Start step - sign up form
  if (step === "start") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>Get started with ReconAI today</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={isGoogleLoading || isLoading}
              className="w-full"
              onClick={() => signUpWithOAuth("oauth_google")}
            >
              {isGoogleLoading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <>
                  <GoogleIcon className="size-4" />
                  Continue with Google
                </>
              )}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <form onSubmit={handleSignUpSubmit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="signup-firstName" className={labelClassName}>
                  First name
                </label>
                <input
                  id="signup-firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  className={inputClassName}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="signup-lastName" className={labelClassName}>
                  Last name
                </label>
                <input
                  id="signup-lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  className={inputClassName}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="signup-email" className={labelClassName}>
                Email
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={inputClassName}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="signup-password" className={labelClassName}>
                Password
              </label>
              <input
                id="signup-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className={inputClassName}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div id="clerk-captcha" />

            <Button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full"
            >
              {isLoading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={
                redirectUrl
                  ? `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`
                  : "/sign-in"
              }
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    );
  }

  // Email verification step
  if (step === "verify_email") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Verify your email</CardTitle>
          <CardDescription>
            We sent a verification code to {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleVerifyEmail} className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="verification-code" className={labelClassName}>
                Verification code
              </label>
              <input
                id="verification-code"
                name="code"
                type="text"
                autoComplete="one-time-code"
                required
                className={cn(inputClassName, "text-center")}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "Verify"
              )}
            </Button>

            {resendTimer > 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                Resend code in {resendTimer}s
              </p>
            ) : (
              <Button
                variant="link"
                type="button"
                className="w-full"
                onClick={handleResendCode}
              >
                Resend code
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    );
  }

  // Phone verification step
  if (step === "verify_phone") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Verify your phone</CardTitle>
          <CardDescription>We sent a code to your phone</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleVerifyPhone} className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="phone-code" className={labelClassName}>
                Verification code
              </label>
              <input
                id="phone-code"
                name="code"
                type="text"
                autoComplete="one-time-code"
                required
                className={cn(inputClassName, "text-center")}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "Verify"
              )}
            </Button>

            {resendTimer > 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                Resend code in {resendTimer}s
              </p>
            ) : (
              <Button
                variant="link"
                type="button"
                className="w-full"
                onClick={handleResendCode}
              >
                Resend code
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    );
  }

  // Continue step - complete profile
  if (step === "continue") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Complete your profile</CardTitle>
          <CardDescription>
            Please fill in the remaining details
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleContinueProfile} className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="continue-firstName" className={labelClassName}>
                First name
              </label>
              <input
                id="continue-firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                className={inputClassName}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="continue-lastName" className={labelClassName}>
                Last name
              </label>
              <input
                id="continue-lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                className={inputClassName}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return <LoadingCard />;
}

function SignUpForm() {
  const searchParams = useSearchParams();

  const redirectUrl = useMemo(() => {
    const v =
      searchParams.get("redirect_url") || searchParams.get("redirectUrl");
    if (!v) return undefined;
    if (
      v.startsWith("/") &&
      !v.startsWith("//") &&
      !v.startsWith("/\\") &&
      !v.includes(":") &&
      !v.includes("%2f%2f") &&
      !v.includes("%5c")
    ) {
      return v;
    }
    return undefined;
  }, [searchParams]);

  return <SignUpFormContent redirectUrl={redirectUrl} />;
}

export default function SignUpClient() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-app-canvas p-4 sm:p-6">
      <Suspense fallback={<LoadingCard />}>
        <SignUpForm />
      </Suspense>
    </div>
  );
}
