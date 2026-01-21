"use client";

import { useEffect, useState } from "react";
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
  const [status, setStatus] = useState<"loading" | "redirecting" | "error">(
    "loading",
  );

  useEffect(() => {
    // Plaid sends oauth_state_id after OAuth completion
    const oauthStateId = searchParams.get("oauth_state_id");

    if (oauthStateId) {
      setStatus("redirecting");
      // Redirect to connect-bank with the oauth state so PlaidLink can resume
      router.replace(`/connect-bank?oauth_state_id=${oauthStateId}`);
    } else {
      // No oauth_state_id means direct navigation or error
      setStatus("error");
      // Redirect to connect-bank after a short delay
      setTimeout(() => {
        router.replace("/connect-bank");
      }, 2000);
    }
  }, [searchParams, router]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <div className="rounded-2xl border bg-background p-8 text-center">
        {status === "loading" && (
          <>
            <h1 className="text-xl font-semibold">Completing connection...</h1>
            <p className="mt-2 text-muted-foreground">
              Please wait while we complete your bank connection.
            </p>
          </>
        )}

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
