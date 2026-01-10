"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

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

  return (
    <SignIn.Root>
      <Clerk.Loading>
        {(isGlobalLoading) => (
          <>
            <SignIn.Step name="start">
              <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">Sign in</CardTitle>
                  <CardDescription>
                    Welcome back! Sign in to continue
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Clerk.Connection name="google" asChild>
                      <Button
                        variant="outline"
                        type="button"
                        disabled={isGlobalLoading}
                        className="w-full"
                      >
                        <Clerk.Loading scope="provider:google">
                          {(isLoading) =>
                            isLoading ? (
                              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <>
                                <GoogleIcon className="size-4" />
                                Continue with Google
                              </>
                            )
                          }
                        </Clerk.Loading>
                      </Button>
                    </Clerk.Connection>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        or
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <Clerk.Field name="identifier" className="grid gap-2">
                      <Clerk.Label className={labelClassName}>
                        Email
                      </Clerk.Label>
                      <Clerk.Input
                        type="email"
                        autoComplete="username"
                        required
                        className={inputClassName}
                        placeholder="you@example.com"
                      />
                      <Clerk.FieldError className="text-sm text-destructive" />
                    </Clerk.Field>
                  </div>

                  <SignIn.Action submit asChild>
                    <Button disabled={isGlobalLoading} className="w-full">
                      <Clerk.Loading>
                        {(isLoading) =>
                          isLoading ? (
                            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            "Continue"
                          )
                        }
                      </Clerk.Loading>
                    </Button>
                  </SignIn.Action>
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
            </SignIn.Step>

            <SignIn.Step name="verifications">
              <SignIn.Strategy name="password">
                <Card className="w-full max-w-sm">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">Enter password</CardTitle>
                    <CardDescription>
                      Enter your password to continue
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <Clerk.Field name="password" className="grid gap-2">
                      <Clerk.Label className={labelClassName}>
                        Password
                      </Clerk.Label>
                      <Clerk.Input
                        type="password"
                        autoComplete="current-password"
                        required
                        className={inputClassName}
                      />
                      <Clerk.FieldError className="text-sm text-destructive" />
                    </Clerk.Field>

                    <SignIn.Action submit asChild>
                      <Button disabled={isGlobalLoading} className="w-full">
                        <Clerk.Loading>
                          {(isLoading) =>
                            isLoading ? (
                              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              "Sign in"
                            )
                          }
                        </Clerk.Loading>
                      </Button>
                    </SignIn.Action>

                    <SignIn.Action navigate="forgot-password" asChild>
                      <Button
                        variant="link"
                        type="button"
                        className="h-auto p-0 text-sm"
                      >
                        Forgot password?
                      </Button>
                    </SignIn.Action>
                  </CardContent>
                </Card>
              </SignIn.Strategy>

              <SignIn.Strategy name="email_code">
                <Card className="w-full max-w-sm">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">Check your email</CardTitle>
                    <CardDescription>
                      We sent a code to <SignIn.SafeIdentifier />
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <Clerk.Field name="code" className="grid gap-2">
                      <Clerk.Label className={labelClassName}>
                        Email code
                      </Clerk.Label>
                      <Clerk.Input
                        type="otp"
                        autoComplete="one-time-code"
                        required
                        className={cn(inputClassName, "text-center")}
                      />
                      <Clerk.FieldError className="text-sm text-destructive" />
                    </Clerk.Field>

                    <SignIn.Action submit asChild>
                      <Button disabled={isGlobalLoading} className="w-full">
                        <Clerk.Loading>
                          {(isLoading) =>
                            isLoading ? (
                              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              "Continue"
                            )
                          }
                        </Clerk.Loading>
                      </Button>
                    </SignIn.Action>

                    <SignIn.Action
                      resend
                      asChild
                      fallback={({ resendableAfter }) => (
                        <p className="text-center text-sm text-muted-foreground">
                          Resend code in {resendableAfter}s
                        </p>
                      )}
                    >
                      <Button variant="link" type="button" className="w-full">
                        Resend code
                      </Button>
                    </SignIn.Action>
                  </CardContent>
                </Card>
              </SignIn.Strategy>

              <SignIn.Strategy name="phone_code">
                <Card className="w-full max-w-sm">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">Check your phone</CardTitle>
                    <CardDescription>
                      We sent a code to your phone
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <Clerk.Field name="code" className="grid gap-2">
                      <Clerk.Label className={labelClassName}>
                        Phone code
                      </Clerk.Label>
                      <Clerk.Input
                        type="otp"
                        autoComplete="one-time-code"
                        required
                        className={cn(inputClassName, "text-center")}
                      />
                      <Clerk.FieldError className="text-sm text-destructive" />
                    </Clerk.Field>

                    <SignIn.Action submit asChild>
                      <Button disabled={isGlobalLoading} className="w-full">
                        <Clerk.Loading>
                          {(isLoading) =>
                            isLoading ? (
                              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              "Continue"
                            )
                          }
                        </Clerk.Loading>
                      </Button>
                    </SignIn.Action>

                    <SignIn.Action
                      resend
                      asChild
                      fallback={({ resendableAfter }) => (
                        <p className="text-center text-sm text-muted-foreground">
                          Resend code in {resendableAfter}s
                        </p>
                      )}
                    >
                      <Button variant="link" type="button" className="w-full">
                        Resend code
                      </Button>
                    </SignIn.Action>
                  </CardContent>
                </Card>
              </SignIn.Strategy>
            </SignIn.Step>

            <SignIn.Step name="forgot-password">
              <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">Forgot password</CardTitle>
                  <CardDescription>
                    We&apos;ll send you a reset code
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <SignIn.SupportedStrategy name="reset_password_email_code">
                    <SignIn.Action submit asChild>
                      <Button disabled={isGlobalLoading} className="w-full">
                        <Clerk.Loading>
                          {(isLoading) =>
                            isLoading ? (
                              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              "Send reset code"
                            )
                          }
                        </Clerk.Loading>
                      </Button>
                    </SignIn.Action>
                  </SignIn.SupportedStrategy>

                  <SignIn.Action navigate="previous" asChild>
                    <Button variant="outline" className="w-full">
                      Back
                    </Button>
                  </SignIn.Action>
                </CardContent>
              </Card>
            </SignIn.Step>

            <SignIn.Step name="reset-password">
              <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">Reset password</CardTitle>
                  <CardDescription>
                    Enter the code we sent and your new password
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Clerk.Field name="code" className="grid gap-2">
                    <Clerk.Label className={labelClassName}>
                      Reset code
                    </Clerk.Label>
                    <Clerk.Input
                      type="otp"
                      autoComplete="one-time-code"
                      required
                      className={cn(inputClassName, "text-center")}
                    />
                    <Clerk.FieldError className="text-sm text-destructive" />
                  </Clerk.Field>

                  <Clerk.Field name="password" className="grid gap-2">
                    <Clerk.Label className={labelClassName}>
                      New password
                    </Clerk.Label>
                    <Clerk.Input
                      type="password"
                      autoComplete="new-password"
                      required
                      className={inputClassName}
                    />
                    <Clerk.FieldError className="text-sm text-destructive" />
                  </Clerk.Field>

                  <Clerk.Field name="confirmPassword" className="grid gap-2">
                    <Clerk.Label className={labelClassName}>
                      Confirm password
                    </Clerk.Label>
                    <Clerk.Input
                      type="password"
                      autoComplete="new-password"
                      required
                      className={inputClassName}
                    />
                    <Clerk.FieldError className="text-sm text-destructive" />
                  </Clerk.Field>

                  <SignIn.Action submit asChild>
                    <Button disabled={isGlobalLoading} className="w-full">
                      <Clerk.Loading>
                        {(isLoading) =>
                          isLoading ? (
                            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            "Reset password"
                          )
                        }
                      </Clerk.Loading>
                    </Button>
                  </SignIn.Action>
                </CardContent>
              </Card>
            </SignIn.Step>
          </>
        )}
      </Clerk.Loading>
    </SignIn.Root>
  );
}

export default function SignInClient() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center p-4 sm:p-6 bg-background overflow-hidden">
      <Image
        src="/hero-boardroom.jpg"
        alt=""
        fill
        className="object-cover opacity-25 dark:opacity-35"
        aria-hidden="true"
        priority
      />
      <div className="absolute inset-0 bg-linear-to-b from-background/80 via-background/60 to-background/80 dark:from-background/70 dark:via-background/50 dark:to-background/70" />

      <div className="relative z-10">
        <SignInForm />
      </div>
    </div>
  );
}
