"use client";

import { useCallback, useMemo, useState } from "react";
import { PlaidLinkError, usePlaidLink } from "react-plaid-link";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";

type ReconnectState =
  | "idle"
  | "fetching"
  | "ready"
  | "reconnecting"
  | "success"
  | "error";

interface UpdateLinkTokenResponse {
  link_token: string;
  error?: string;
}

interface ExchangeResponse {
  item_id?: string;
  error?: string;
}

interface ReconnectBankSectionProps {
  needsReconnect: boolean;
  itemId?: string;
}

/**
 * FAIL-CLOSED: Safe JSON POST helper using auditedFetch
 * - Enforces x-request-id provenance
 * - Throws on missing request_id in response
 */
async function postJSON<T>(url: string, body?: unknown): Promise<T> {
  try {
    return await auditedFetch<T>(url, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e instanceof AuditProvenanceError) {
      throw new Error(`Provenance error: ${e.message}`);
    } else if (e instanceof HttpError) {
      throw new Error(`HTTP ${e.status}: ${e.message}`);
    }
    throw e;
  }
}

export function ReconnectBankSection({
  needsReconnect,
  itemId,
}: ReconnectBankSectionProps) {
  const [state, setState] = useState<ReconnectState>("idle");
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchUpdateLinkToken = useCallback(async () => {
    if (!itemId) {
      setErrorMessage("No item ID available for reconnection.");
      setState("error");
      return;
    }

    setState("fetching");
    setErrorMessage(null);

    try {
      const data = await postJSON<UpdateLinkTokenResponse>(
        "/api/plaid/create-link-token",
        { access_token_item_id: itemId, mode: "update" },
      );
      if (!data?.link_token) throw new Error("Missing link_token from server");
      setLinkToken(data.link_token);
      setState("ready");
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to create update link token";
      setErrorMessage(message);
      setState("error");
    }
  }, [itemId]);

  const onSuccess = useCallback(async (public_token: string) => {
    setState("reconnecting");
    try {
      const data = await postJSON<ExchangeResponse>(
        "/api/plaid/exchange-public-token",
        { public_token, mode: "update" },
      );
      if (!data?.item_id)
        throw new Error("Missing item_id from exchange response");
      setState("success");
      setLinkToken(null);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to complete reconnection";
      setErrorMessage(message);
      setState("error");
    }
  }, []);

  const config = useMemo(() => {
    return {
      token: linkToken,
      onSuccess,
      onExit: (err: PlaidLinkError | null) => {
        if (err) {
          setErrorMessage(
            err?.display_message ||
              err?.error_message ||
              "Reconnection cancelled",
          );
          setState("error");
        } else {
          setState("idle");
          setLinkToken(null);
        }
      },
    };
  }, [linkToken, onSuccess]);

  const { open, ready } = usePlaidLink(config);

  const handleReconnect = useCallback(async () => {
    if (linkToken && ready) {
      open();
    } else {
      await fetchUpdateLinkToken();
    }
  }, [linkToken, ready, open, fetchUpdateLinkToken]);

  if (!needsReconnect && state !== "success") {
    return null;
  }

  const isDisabled = state === "fetching" || state === "reconnecting";

  return (
    <div className="space-y-2">
      {state !== "success" && (
        <>
          <div className="text-xs text-amber-600 dark:text-amber-400">
            <p>
              Your bank connection needs to be re-authenticated to continue
              syncing.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReconnect}
            disabled={isDisabled}
            className="w-full inline-flex items-center justify-center rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 shadow-sm hover:bg-amber-100 dark:hover:bg-amber-900/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === "fetching"
              ? "Preparing..."
              : state === "reconnecting"
                ? "Reconnecting..."
                : state === "ready" && linkToken && ready
                  ? "Open reconnect"
                  : "Reconnect bank"}
          </button>
        </>
      )}

      {state === "success" && (
        <div className="text-xs text-muted-foreground">
          <p>Reconnection completed. Data is not synced automatically.</p>
        </div>
      )}

      {state === "error" && errorMessage && (
        <div className="text-xs text-destructive">
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
