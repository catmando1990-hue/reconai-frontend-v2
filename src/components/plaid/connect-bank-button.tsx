"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PlaidLinkError, usePlaidLink } from "react-plaid-link";

type LinkTokenResponse = {
  link_token: string;
  expiration?: string;
  error?: string;
};

type ExchangeResponse = {
  item_id?: string;
  error?: string;
};

async function postJSON<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T;
  if (!res.ok) {
    const msg =
      (data as { error?: string })?.error || `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export function ConnectBankButton() {
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
      const data = await postJSON<LinkTokenResponse>(
        "/api/plaid/create-link-token",
      );
      if (!data?.link_token) throw new Error("Missing link_token from server");
      setLinkToken(data.link_token);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to create link token";
      setStatus({
        kind: "error",
        message,
      });
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
        const data = await postJSON<ExchangeResponse>(
          "/api/plaid/exchange-public-token",
          { public_token },
        );
        if (!data?.item_id)
          throw new Error("Missing item_id from exchange response");
        setStatus({
          kind: "ok",
          message: `Bank connected (item_id: ${data.item_id})`,
        });
        await fetchLinkToken();
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : "Failed to exchange public token";
        setStatus({
          kind: "error",
          message,
        });
      } finally {
        setBusy(false);
      }
    },
    [fetchLinkToken],
  );

  const config = useMemo(() => {
    return {
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
  }, [linkToken, onSuccess]);

  const { open, ready } = usePlaidLink(config);

  const disabled = !ready || loadingToken || busy || !linkToken;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => open()}
        disabled={disabled}
        className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loadingToken
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
