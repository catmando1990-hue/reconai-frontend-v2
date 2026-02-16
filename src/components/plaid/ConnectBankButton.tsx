"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PlaidLinkError, usePlaidLink } from "react-plaid-link";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { AuditProvenanceError, HttpError } from "@/lib/auditedFetch";

type LinkTokenResponse = {
  request_id: string;
  link_token: string;
  expiration?: string;
  error?: string;
};

type ExchangeResponse = {
  request_id: string;
  item_id?: string;
  error?: string;
};

export function ConnectBankButton() {
  const searchParams = useSearchParams();
  const { auditedFetch } = useApi();
  const { org_id, isLoaded: orgLoaded } = useOrg();

  // Check for OAuth redirect state (from /plaid/oauth callback)
  const oauthStateId = searchParams.get("oauth_state_id");
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{
    kind: "idle" | "ok" | "error";
    message?: string;
  }>({
    kind: "idle",
  });

  // Org readiness gate - fail-closed
  const orgReady = orgLoaded && !!org_id;

  const fetchLinkToken = useCallback(async () => {
    if (!orgReady) return;

    setLoadingToken(true);
    setStatus({ kind: "idle" });
    try {
      const data = await auditedFetch<LinkTokenResponse>(
        "/api/plaid/create-link-token",
        { method: "POST" },
      );
      if (!data?.link_token) throw new Error("Missing link_token from server");
      setLinkToken(data.link_token);
    } catch (e: unknown) {
      let message = "Failed to create link token";
      if (e instanceof AuditProvenanceError) {
        message = `Provenance error: ${e.message}`;
      } else if (e instanceof HttpError) {
        message = `HTTP ${e.status}: ${e.message}`;
      } else if (e instanceof Error) {
        message = e.message;
      }
      setStatus({ kind: "error", message });
      setLinkToken(null);
    } finally {
      setLoadingToken(false);
    }
  }, [auditedFetch, orgReady]);

  useEffect(() => {
    if (orgReady) {
      fetchLinkToken();
    }
  }, [fetchLinkToken, orgReady]);

  const onSuccess = useCallback(
    async (public_token: string) => {
      if (!orgReady) return;

      setBusy(true);
      setStatus({ kind: "idle" });
      try {
        const data = await auditedFetch<ExchangeResponse>(
          "/api/plaid/exchange-public-token",
          {
            method: "POST",
            body: JSON.stringify({ public_token }),
          },
        );
        if (!data?.item_id)
          throw new Error("Missing item_id from exchange response");
        setStatus({
          kind: "ok",
          message: `Bank connected (item_id: ${data.item_id})`,
        });
        await fetchLinkToken();
      } catch (e: unknown) {
        let message = "Failed to exchange public token";
        if (e instanceof AuditProvenanceError) {
          message = `Provenance error: ${e.message}`;
        } else if (e instanceof HttpError) {
          message = `HTTP ${e.status}: ${e.message}`;
        } else if (e instanceof Error) {
          message = e.message;
        }
        setStatus({ kind: "error", message });
      } finally {
        setBusy(false);
      }
    },
    [auditedFetch, fetchLinkToken, orgReady],
  );

  const config = useMemo(() => {
    const baseConfig = {
      token: linkToken,
      onSuccess,
      onExit: (err: PlaidLinkError | null) => {
        if (err) {
          setStatus({
            kind: "error",
            message:
              err?.display_message ||
              err?.error_message ||
              "Link exited with error",
          });
        }
      },
    };

    // If resuming from OAuth redirect, include the redirect URI
    // This tells Plaid Link to continue the OAuth flow
    if (oauthStateId) {
      return {
        ...baseConfig,
        receivedRedirectUri: window.location.href,
      };
    }

    return baseConfig;
  }, [linkToken, onSuccess, oauthStateId]);

  const { open, ready } = usePlaidLink(config);

  // Auto-open Link when resuming from OAuth redirect
  useEffect(() => {
    if (oauthStateId && ready && linkToken) {
      open();
    }
  }, [oauthStateId, ready, linkToken, open]);

  const disabled = !ready || loadingToken || busy || !linkToken || !orgReady;

  // Org readiness gate UI
  if (orgLoaded && !org_id) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950">
        <p className="font-medium text-amber-800 dark:text-amber-200">
          Organization required
        </p>
        <p className="mt-1 text-amber-700 dark:text-amber-300">
          Select an organization to connect bank accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => open()}
        disabled={disabled}
        className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {!orgLoaded
          ? "Loading..."
          : loadingToken
            ? "Preparing..."
            : busy
              ? "Connecting..."
              : "Connect Bank"}
      </button>

      {!linkToken && !loadingToken && (
        <button
          type="button"
          onClick={fetchLinkToken}
          className="text-sm underline underline-offset-4 hover:text-foreground text-muted-foreground"
        >
          Retry link token
        </button>
      )}

      {status.kind === "ok" && (
        <div className="rounded-xl border bg-background p-3 text-sm">
          <div className="font-medium">Success</div>
          <div className="text-muted-foreground">{status.message}</div>
        </div>
      )}

      {status.kind === "error" && (
        <div className="rounded-xl border p-3 text-sm">
          <div className="font-medium">Error</div>
          <div className="text-muted-foreground">{status.message}</div>
        </div>
      )}
    </div>
  );
}
