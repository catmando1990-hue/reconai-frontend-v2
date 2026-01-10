"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
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

  return (
    <SignUp.Root>
      <Clerk.Loading>
        {(isGlobalLoading) => (
          <>
            <SignUp.Step name="start">
              <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">Create an account</CardTitle>
                  <CardDescription>
                    Get started with ReconAI today
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
                    <div className="grid grid-cols-2 gap-4">
                      <Clerk.Field name="firstName" className="grid gap-2">
                        <Clerk.Label className={labelClassName}>
                          First name
                        </Clerk.Label>
                        <Clerk.Input
                          type="text"
                          autoComplete="given-name"
                          required
                          className={inputClassName}
                        />
                        <Clerk.FieldError className="text-sm text-destructive" />
                      </Clerk.Field>

                      <Clerk.Field name="lastName" className="grid gap-2">
                        <Clerk.Label className={labelClassName}>
                          Last name
                        </Clerk.Label>
                        <Clerk.Input
                          type="text"
                          autoComplete="family-name"
                          required
                          className={inputClassName}
                        />
                        <Clerk.FieldError className="text-sm text-destructive" />
                      </Clerk.Field>
                    </div>

                    <Clerk.Field name="emailAddress" className="grid gap-2">
                      <Clerk.Label className={labelClassName}>
                        Email
                      </Clerk.Label>
                      <Clerk.Input
                        type="email"
                        autoComplete="email"
                        required
                        className={inputClassName}
                        placeholder="you@example.com"
                      />
                      <Clerk.FieldError className="text-sm text-destructive" />
                    </Clerk.Field>

                    <Clerk.Field name="password" className="grid gap-2">
                      <Clerk.Label className={labelClassName}>
                        Password
                      </Clerk.Label>
                      <Clerk.Input
                        type="password"
                        autoComplete="new-password"
                        required
                        className={inputClassName}
                      />
                      <Clerk.FieldError className="text-sm text-destructive" />
                    </Clerk.Field>
                  </div>

                  <SignUp.Action submit asChild>
                    <Button disabled={isGlobalLoading} className="w-full">
                      <Clerk.Loading>
                        {(isLoading) =>
                          isLoading ? (
                            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            "Create account"
                          )
                        }
                      </Clerk.Loading>
                    </Button>
                  </SignUp.Action>
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
            </SignUp.Step>

            <SignUp.Step name="verifications">
              <SignUp.Strategy name="email_code">
                <Card className="w-full max-w-sm">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">Verify your email</CardTitle>
                    <CardDescription>
                      We sent a verification code to your email
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <Clerk.Field name="code" className="grid gap-2">
                      <Clerk.Label className={labelClassName}>
                        Verification code
                      </Clerk.Label>
                      <Clerk.Input
                        type="otp"
                        autoComplete="one-time-code"
                        required
                        className={cn(inputClassName, "text-center")}
                      />
                      <Clerk.FieldError className="text-sm text-destructive" />
                    </Clerk.Field>

                    <SignUp.Action submit asChild>
                      <Button disabled={isGlobalLoading} className="w-full">
                        <Clerk.Loading>
                          {(isLoading) =>
                            isLoading ? (
                              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              "Verify"
                            )
                          }
                        </Clerk.Loading>
                      </Button>
                    </SignUp.Action>

                    <SignUp.Action
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
                    </SignUp.Action>
                  </CardContent>
                </Card>
              </SignUp.Strategy>

              <SignUp.Strategy name="phone_code">
                <Card className="w-full max-w-sm">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">Verify your phone</CardTitle>
                    <CardDescription>
                      We sent a code to your phone
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <Clerk.Field name="code" className="grid gap-2">
                      <Clerk.Label className={labelClassName}>
                        Verification code
                      </Clerk.Label>
                      <Clerk.Input
                        type="otp"
                        autoComplete="one-time-code"
                        required
                        className={cn(inputClassName, "text-center")}
                      />
                      <Clerk.FieldError className="text-sm text-destructive" />
                    </Clerk.Field>

                    <SignUp.Action submit asChild>
                      <Button disabled={isGlobalLoading} className="w-full">
                        <Clerk.Loading>
                          {(isLoading) =>
                            isLoading ? (
                              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              "Verify"
                            )
                          }
                        </Clerk.Loading>
                      </Button>
                    </SignUp.Action>

                    <SignUp.Action
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
                    </SignUp.Action>
                  </CardContent>
                </Card>
              </SignUp.Strategy>
            </SignUp.Step>

            <SignUp.Step name="continue">
              <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">
                    Complete your profile
                  </CardTitle>
                  <CardDescription>
                    Please fill in the remaining details
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Clerk.Field name="firstName" className="grid gap-2">
                    <Clerk.Label className={labelClassName}>
                      First name
                    </Clerk.Label>
                    <Clerk.Input
                      type="text"
                      autoComplete="given-name"
                      required
                      className={inputClassName}
                    />
                    <Clerk.FieldError className="text-sm text-destructive" />
                  </Clerk.Field>

                  <Clerk.Field name="lastName" className="grid gap-2">
                    <Clerk.Label className={labelClassName}>
                      Last name
                    </Clerk.Label>
                    <Clerk.Input
                      type="text"
                      autoComplete="family-name"
                      required
                      className={inputClassName}
                    />
                    <Clerk.FieldError className="text-sm text-destructive" />
                  </Clerk.Field>

                  <SignUp.Action submit asChild>
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
                  </SignUp.Action>
                </CardContent>
              </Card>
            </SignUp.Step>
          </>
        )}
      </Clerk.Loading>
    </SignUp.Root>
  );
}

export default function SignUpClient() {
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
        <SignUpForm />
      </div>
    </div>
  );
}
