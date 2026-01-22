"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

export interface PlaidLinkButtonProps {
  onSuccess?: (itemId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function PlaidLinkButton({
  onSuccess: onSuccessCallback,
  onError,
  className,
  children,
}: PlaidLinkButtonProps) {
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
      onError?.(message);
      setLinkToken(null);
    } finally {
      setLoadingToken(false);
    }
  }, [onError]);

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
            body: JSON.stringify({ public_token }),
          },
        );
        if (!data?.item_id)
          throw new Error("Missing item_id from exchange response");
        setStatus({
          kind: "ok",
          message: `Bank connected (item_id: ${data.item_id})`,
        });
        onSuccessCallback?.(data.item_id);
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
        onError?.(message);
      } finally {
        setBusy(false);
      }
    },
    [fetchLinkToken, onSuccessCallback, onError],
  );

  const config = useMemo(() => {
    return {
      token: linkToken,
      onSuccess,
      onExit: (err: PlaidLinkError | null) => {
        if (err) {
          const message =
            err?.display_message ||
            err?.error_message ||
            "Link exited with error";
          setStatus({
            kind: "error",
            message,
          });
          onError?.(message);
        }
      },
    };
  }, [linkToken, onSuccess, onError]);

  const { open, ready } = usePlaidLink(config);

  const disabled = !ready || loadingToken || busy || !linkToken;

  const buttonText = loadingToken
    ? "Preparing..."
    : busy
      ? "Connecting..."
      : children || "Connect Bank";

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => open()}
        disabled={disabled}
        className={
          className ||
          "inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {buttonText}
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

export default PlaidLinkButton;
