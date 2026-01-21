"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User } from "lucide-react";

/**
 * P0: Profile Completion Page
 *
 * CANONICAL LAWS:
 * - Fail-closed: Cannot proceed without successful backend response
 * - No bypass: Must complete profile to access dashboard
 * - Atomic: All operations succeed or fail together
 * - Single source of truth: Backend determines profile_completed status
 *
 * WHY THIS EXISTS:
 * Users were stuck on "Complete your profile" after MFA enrollment
 * because there was no frontend flow to call the backend endpoint.
 */

const inputClassName =
  "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const labelClassName = "text-sm font-medium leading-none";

export default function CompleteProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded: clerkLoaded } = useUser();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill from Clerk if available
  useEffect(() => {
    if (clerkLoaded && user) {
      if (user.firstName && !firstName) {
        setFirstName(user.firstName);
      }
      if (user.lastName && !lastName) {
        setLastName(user.lastName);
      }
    }
  }, [clerkLoaded, user, firstName, lastName]);

  // Get redirect URL from query params
  const redirectUrl = searchParams.get("redirect_url") || "/home";

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!firstName.trim() || !lastName.trim()) {
        setError("Please enter your first and last name");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const resp = await fetch("/api/profile/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          }),
        });

        const data = await resp.json();

        if (!resp.ok || !data.ok) {
          // FAIL-CLOSED: Show explicit error, do not proceed
          setError(data.error || "Failed to complete profile. Please try again.");
          setIsLoading(false);
          return;
        }

        // SUCCESS: Profile completed, redirect to dashboard
        // CANONICAL: Only redirect on ok === true
        if (data.ok && data.profileCompleted) {
          // Hard redirect to prevent back navigation to this page
          window.location.href = redirectUrl;
        } else {
          // Unexpected state - show error
          setError("Profile completion returned unexpected state. Please try again.");
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Profile completion error:", err);
        setError("Network error. Please check your connection and try again.");
        setIsLoading(false);
      }
    },
    [firstName, lastName, redirectUrl],
  );

  // Don't render until Clerk is loaded
  if (!clerkLoaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-app-canvas p-4 sm:p-6">
        <Card className="w-full max-w-sm">
          <CardContent className="flex justify-center py-8">
            <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-app-canvas p-4 sm:p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
            <User className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Complete your profile</CardTitle>
          <CardDescription>
            Enter your name to finish setting up your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="first-name" className={labelClassName}>
                First name
              </label>
              <input
                id="first-name"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                className={inputClassName}
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="last-name" className={labelClassName}>
                Last name
              </label>
              <input
                id="last-name"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                className={inputClassName}
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={isLoading} className="w-full mt-2">
              {isLoading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
