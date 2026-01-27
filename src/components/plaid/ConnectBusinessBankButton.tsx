"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PlaidLinkError, usePlaidLink } from "react-plaid-link";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";

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

/**
 * ConnectBusinessBankButton
 *
 * CFO-specific Plaid Link button that connects business bank accounts.
 * Passes context: "business" to both create-link-token and exchange-public-token.
 * Stores return path in sessionStorage so the OAuth callback redirects back to CFO.
 */
export function ConnectBusinessBankButton() {
  const searchParams = useSearchParams();
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

  const fetchLinkToken = useCallback(async () => {
    setLoadingToken(true);
    setStatus({ kind: "idle" });
    try {
      const data = await auditedFetch<LinkTokenResponse>(
        "/api/plaid/create-link-token",
        {
          method: "POST",
          body: JSON.stringify({ context: "business" }),
        },
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
  }, []);

  useEffect(() => {
    fetchLinkToken();
  }, [fetchLinkToken]);

  const onSuccess = useCallback(
    async (public_token: string) => {
      setBusy(true);
      setStatus({ kind: "idle" });
      try {
        const data = await auditedFetch<ExchangeResponse>(
          "/api/plaid/exchange-public-token",
          {
            method: "POST",
            body: JSON.stringify({ public_token, context: "business" }),
          },
        );
        if (!data?.item_id)
          throw new Error("Missing item_id from exchange response");
        setStatus({
          kind: "ok",
          message: "Business bank connected successfully.",
        });
        // Clean up sessionStorage after successful connection
        sessionStorage.removeItem("plaid_return_to");
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
    [fetchLinkToken],
  );

  const handleOpen = useCallback(() => {
    // Store return path so OAuth callback redirects back to CFO
    sessionStorage.setItem("plaid_return_to", "/cfo-dashboard");
  }, []);

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
        // Clean up sessionStorage on exit
        sessionStorage.removeItem("plaid_return_to");
      },
    };

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

  const disabled = !ready || loadingToken || busy || !linkToken;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => {
          handleOpen();
          open();
        }}
        disabled={disabled}
        className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loadingToken
          ? "Preparing..."
          : busy
            ? "Connecting..."
            : "Connect Business Bank"}
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
