"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Plaid OAuth Callback Page
 *
 * This page handles the redirect from Plaid after OAuth bank authentication.
 * Plaid sends users here with an oauth_state_id query parameter.
 *
 * The page:
 * 1. Extracts the oauth_state_id from URL params
 * 2. Displays a brief loading state
 * 3. Redirects to /connect-bank where PlaidLink can resume the flow
 */
export default function PlaidOAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Derive status from URL params (no useState needed)
  const oauthStateId = searchParams.get("oauth_state_id");
  const status = useMemo(() => {
    if (oauthStateId) return "redirecting";
    return "error";
  }, [oauthStateId]);

  useEffect(() => {
    // Check if the Plaid flow was started from CFO (stored before opening Link)
    const returnTo =
      typeof window !== "undefined"
        ? sessionStorage.getItem("plaid_return_to")
        : null;
    const defaultPath = returnTo || "/connect-bank";

    if (oauthStateId) {
      // Redirect with oauth state so PlaidLink can resume the flow
      router.replace(`${defaultPath}?oauth_state_id=${oauthStateId}`);
    } else {
      // No oauth_state_id means direct navigation or error
      const timeout = setTimeout(() => {
        router.replace(defaultPath);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [oauthStateId, router]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <div className="rounded-2xl border bg-background p-8 text-center">
        {status === "redirecting" && (
          <>
            <h1 className="text-xl font-semibold">Redirecting...</h1>
            <p className="mt-2 text-muted-foreground">
              Taking you back to complete the connection.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-muted-foreground">
              Redirecting you back to try again...
            </p>
          </>
        )}

        <div className="mt-4">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </div>
      </div>
    </main>
  );
}
