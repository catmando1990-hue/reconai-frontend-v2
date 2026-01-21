"use client";

import { useSignIn, useAuth } from "@clerk/nextjs";
import type { OAuthStrategy, SignInResource } from "@clerk/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

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
import { MFAVerification } from "./MFAVerification";

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
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Loading...</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-8">
        <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </CardContent>
    </Card>
  );
}

type SignInStep =
  | "start"
  | "password"
  | "email_code"
  | "phone_code"
  | "forgot_password"
  | "reset_password"
  | "second_factor";

function SignInFormContent({ redirectUrl }: { redirectUrl?: string }) {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useAuth();

  const [step, setStep] = useState<SignInStep>("start");

  // Redirect to accounts if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.replace(redirectUrl || "/accounts");
    }
  }, [isSignedIn, router, redirectUrl]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const finalRedirectUrl = redirectUrl || "/accounts";

  const signInWithOAuth = useCallback(
    async (strategy: OAuthStrategy) => {
      if (!signIn) return;
      setIsGoogleLoading(true);
      setError(null);

      try {
        await signIn.authenticateWithRedirect({
          strategy,
          redirectUrl: "/sign-in/sso-callback",
          redirectUrlComplete: finalRedirectUrl,
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to sign in with Google";
        setError(message);
        setIsGoogleLoading(false);
      }
    },
    [signIn, finalRedirectUrl],
  );

  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!signIn || !email.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await signIn.create({
          identifier: email.trim(),
        });

        if (result.status === "needs_first_factor") {
          const supportedFactors = result.supportedFirstFactors || [];

          // Check for password strategy first
          const passwordFactor = supportedFactors.find(
            (f) => f.strategy === "password",
          );
          if (passwordFactor) {
            setStep("password");
            setIsLoading(false);
            return;
          }

          // Check for email code
          const emailCodeFactor = supportedFactors.find(
            (f) => f.strategy === "email_code",
          );
          if (emailCodeFactor && "emailAddressId" in emailCodeFactor) {
            await signIn.prepareFirstFactor({
              strategy: "email_code",
              emailAddressId: emailCodeFactor.emailAddressId,
            });
            setStep("email_code");
            setResendTimer(30);
            setIsLoading(false);
            return;
          }

          // Check for phone code
          const phoneCodeFactor = supportedFactors.find(
            (f) => f.strategy === "phone_code",
          );
          if (phoneCodeFactor && "phoneNumberId" in phoneCodeFactor) {
            await signIn.prepareFirstFactor({
              strategy: "phone_code",
              phoneNumberId: phoneCodeFactor.phoneNumberId,
            });
            setStep("phone_code");
            setResendTimer(30);
            setIsLoading(false);
            return;
          }

          setError("No supported authentication method found");
        } else if (result.status === "complete" && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          router.push(finalRedirectUrl);
        }
      } catch (err: unknown) {
        const clerkError = err as { errors?: Array<{ message: string }> };
        const message =
          clerkError.errors?.[0]?.message ||
          (err instanceof Error ? err.message : "Failed to sign in");
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [signIn, email, setActive, router, finalRedirectUrl],
  );

  const handlePasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!signIn || !password) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await signIn.attemptFirstFactor({
          strategy: "password",
          password,
        });

        if (result.status === "complete" && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          router.push(finalRedirectUrl);
        } else if (result.status === "needs_second_factor") {
          // Proceed to MFA verification step
          setStep("second_factor");
        }
      } catch (err: unknown) {
        const clerkError = err as { errors?: Array<{ message: string }> };
        const message =
          clerkError.errors?.[0]?.message ||
          (err instanceof Error ? err.message : "Incorrect password");
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [signIn, password, setActive, router, finalRedirectUrl],
  );

  const handleCodeSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!signIn || !code) return;

      setIsLoading(true);
      setError(null);

      try {
        const strategy = step === "email_code" ? "email_code" : "phone_code";
        const result = await signIn.attemptFirstFactor({
          strategy,
          code,
        });

        if (result.status === "complete" && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          router.push(finalRedirectUrl);
        }
      } catch (err: unknown) {
        const clerkError = err as { errors?: Array<{ message: string }> };
        const message =
          clerkError.errors?.[0]?.message ||
          (err instanceof Error ? err.message : "Invalid code");
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [signIn, code, step, setActive, router, finalRedirectUrl],
  );

  const handleForgotPassword = useCallback(async () => {
    if (!signIn) return;

    setIsLoading(true);
    setError(null);

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setStep("reset_password");
      setResendTimer(30);
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> };
      const message =
        clerkError.errors?.[0]?.message ||
        (err instanceof Error ? err.message : "Failed to send reset code");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [signIn, email]);

  const handleResetPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!signIn || !code || !newPassword) return;

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await signIn.attemptFirstFactor({
          strategy: "reset_password_email_code",
          code,
          password: newPassword,
        });

        if (result.status === "complete" && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          router.push(finalRedirectUrl);
        }
      } catch (err: unknown) {
        const clerkError = err as { errors?: Array<{ message: string }> };
        const message =
          clerkError.errors?.[0]?.message ||
          (err instanceof Error ? err.message : "Failed to reset password");
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [
      signIn,
      code,
      newPassword,
      confirmPassword,
      setActive,
      router,
      finalRedirectUrl,
    ],
  );

  const handleResendCode = useCallback(async () => {
    if (!signIn || resendTimer > 0) return;

    setError(null);

    try {
      if (step === "reset_password") {
        await signIn.create({
          strategy: "reset_password_email_code",
          identifier: email,
        });
      } else {
        const supportedFactors = signIn.supportedFirstFactors || [];
        if (step === "email_code") {
          const emailFactor = supportedFactors.find(
            (f) => f.strategy === "email_code",
          );
          if (emailFactor && "emailAddressId" in emailFactor) {
            await signIn.prepareFirstFactor({
              strategy: "email_code",
              emailAddressId: emailFactor.emailAddressId,
            });
          }
        } else if (step === "phone_code") {
          const phoneFactor = supportedFactors.find(
            (f) => f.strategy === "phone_code",
          );
          if (phoneFactor && "phoneNumberId" in phoneFactor) {
            await signIn.prepareFirstFactor({
              strategy: "phone_code",
              phoneNumberId: phoneFactor.phoneNumberId,
            });
          }
        }
      }
      setResendTimer(30);
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> };
      const message =
        clerkError.errors?.[0]?.message ||
        (err instanceof Error ? err.message : "Failed to resend code");
      setError(message);
    }
  }, [signIn, step, email, resendTimer]);

  // Resend timer countdown
  useState(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  });

  // If already signed in, show loading while redirecting
  if (isSignedIn) {
    return <LoadingCard />;
  }

  if (!isLoaded) {
    return <LoadingCard />;
  }

  // Start step - email input
  if (step === "start") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>Welcome back! Sign in to continue</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={isGoogleLoading || isLoading}
              className="w-full"
              onClick={() => signInWithOAuth("oauth_google")}
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

          <form onSubmit={handleEmailSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="signin-email" className={labelClassName}>
                Email
              </label>
              <input
                id="signin-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                className={inputClassName}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full"
            >
              {isLoading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={
                redirectUrl
                  ? `/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`
                  : "/sign-up"
              }
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    );
  }

  // Password step
  if (step === "password") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Enter password</CardTitle>
          <CardDescription>Enter your password to continue</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handlePasswordSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="signin-password" className={labelClassName}>
                Password
              </label>
              <input
                id="signin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={inputClassName}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "Sign in"
              )}
            </Button>

            <Button
              variant="link"
              type="button"
              className="h-auto p-0 text-sm"
              onClick={() => {
                setError(null);
                setStep("forgot_password");
              }}
            >
              Forgot password?
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Forgot password step
  if (step === "forgot_password") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Forgot password</CardTitle>
          <CardDescription>We&apos;ll send you a reset code</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleForgotPassword}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              "Send reset code"
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setError(null);
              setStep("password");
            }}
          >
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Reset password step
  if (step === "reset_password") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Reset password</CardTitle>
          <CardDescription>
            Enter the code we sent and your new password
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleResetPassword} className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="reset-code" className={labelClassName}>
                Reset code
              </label>
              <input
                id="reset-code"
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

            <div className="grid gap-2">
              <label htmlFor="new-password" className={labelClassName}>
                New password
              </label>
              <input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                className={inputClassName}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="confirm-password" className={labelClassName}>
                Confirm password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className={inputClassName}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "Reset password"
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

  // Email code step
  if (step === "email_code") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription>We sent a code to {email}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleCodeSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="email-code" className={labelClassName}>
                Email code
              </label>
              <input
                id="email-code"
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
                "Continue"
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

  // Phone code step
  if (step === "phone_code") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Check your phone</CardTitle>
          <CardDescription>We sent a code to your phone</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleCodeSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="phone-code" className={labelClassName}>
                Phone code
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
                "Continue"
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

  // Second factor (MFA) verification step
  if (step === "second_factor" && signIn) {
    return (
      <MFAVerification
        signInResource={signIn as SignInResource}
        redirectUrl={finalRedirectUrl}
        onBack={() => {
          setStep("start");
          setError(null);
          setPassword("");
          setCode("");
        }}
      />
    );
  }

  return <LoadingCard />;
}

function SignInForm() {
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

  return <SignInFormContent redirectUrl={redirectUrl} />;
}

export default function SignInClient() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-app-canvas p-4 sm:p-6">
      <Suspense fallback={<LoadingCard />}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
