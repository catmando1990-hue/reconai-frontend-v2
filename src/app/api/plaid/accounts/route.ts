import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { BACKEND_URL } from "@/lib/config";

/**
 * Fail-closed error envelope for consistent JSON responses
 */
function errorResponse(
  code: string,
  message: string,
  status: number,
  requestId?: string,
) {
  const id = requestId || crypto.randomUUID();
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        request_id: id,
      },
    },
    { status, headers: { "x-request-id": id } },
  );
}

/**
 * Safely parse JSON from response, falling back to text on failure
 */
async function safeParseJson(resp: Response): Promise<{
  data: unknown;
  isJson: boolean;
  rawText?: string;
}> {
  const contentType = resp.headers.get("content-type") || "";
  const isJsonContentType = contentType.includes("application/json");

  if (!isJsonContentType) {
    const rawText = await resp.text();
    return { data: null, isJson: false, rawText };
  }

  try {
    const data = await resp.json();
    return { data, isJson: true };
  } catch {
    const rawText = await resp.text();
    return { data: null, isJson: false, rawText };
  }
}

export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    // Verify env vars exist
    if (!BACKEND_URL) {
      console.error("[Plaid accounts] BACKEND_URL is not configured");
      return errorResponse(
        "CONFIG_ERROR",
        "Backend URL is not configured",
        500,
        requestId,
      );
    }

    const { userId, getToken } = await auth();
    if (!userId) {
      return errorResponse(
        "UNAUTHORIZED",
        "Authentication required",
        401,
        requestId,
      );
    }

    const token = await getToken();

    // Use the new authenticated /api/plaid/items endpoint
    const resp = await fetch(`${BACKEND_URL}/api/plaid/items`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const { data, isJson, rawText } = await safeParseJson(resp);

    if (!resp.ok) {
      // Log non-JSON responses for debugging
      if (!isJson) {
        console.error(
          `[Plaid accounts] Non-JSON error response (${resp.status}):`,
          rawText?.slice(0, 500),
        );
        return errorResponse(
          "UPSTREAM_ERROR",
          "Backend returned non-JSON response",
          502,
          requestId,
        );
      }

      const errorData = data as { detail?: string; error?: string } | null;
      const message =
        errorData?.detail || errorData?.error || "Failed to fetch accounts";
      return errorResponse("UPSTREAM_ERROR", message, resp.status, requestId);
    }

    // Validate response shape
    if (!isJson) {
      console.error(
        "[Plaid accounts] Non-JSON success response:",
        rawText?.slice(0, 500),
      );
      return errorResponse(
        "INVALID_RESPONSE",
        "Backend returned invalid response format",
        502,
        requestId,
      );
    }

    // The /api/plaid/items endpoint returns { items: [...] }
    // Transform items into a flat accounts-like structure for the UI
    const itemsData = data as {
      items?: Array<{
        item_id: string;
        institution_id?: string;
        institution_name?: string;
        status?: string;
        last_synced_at?: string;
        error_code?: string;
        error_message?: string;
      }>;
    } | null;

    // ========================================================================
    // ORDERING GUARD: Return 400 if NO Plaid Item exists (before Link)
    // This prevents premature calls to /accounts before exchange-public-token
    // Frontend should show "No bank connected yet" - NOT an error state
    // ========================================================================
    if (!itemsData?.items || itemsData.items.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          status: "no_item",
          reason: "No Plaid Item exists. Complete Plaid Link first.",
          code: "NO_PLAID_ITEM",
          message: "No bank connected yet",
          request_id: requestId,
        },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    // Map items to account-like objects for display
    const accounts = (itemsData?.items || []).map((item) => ({
      item_id: item.item_id,
      account_id: item.item_id, // Use item_id as account_id for now
      institution_name: item.institution_name || "Unknown Institution",
      name: item.institution_name || "Connected Account",
      official_name: null,
      type: "depository",
      subtype: null,
      mask: null,
      balance_current: null,
      balance_available: null,
      iso_currency_code: "USD",
      status: item.status,
      last_synced_at: item.last_synced_at,
      error_code: item.error_code,
      error_message: item.error_message,
    }));

    // Return accounts from backend response with success envelope
    return NextResponse.json(
      { ok: true, accounts, request_id: requestId },
      { headers: { "x-request-id": requestId } },
    );
  } catch (err: unknown) {
    console.error("[Plaid accounts] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse("INTERNAL_ERROR", message, 500, requestId);
  }
}
