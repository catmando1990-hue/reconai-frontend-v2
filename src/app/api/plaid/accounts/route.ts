import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

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
    // Get backend URL (validated at runtime, not module scope)
    let backendUrl: string;
    try {
      backendUrl = getBackendUrl();
    } catch (err) {
      console.error("[Plaid accounts] BACKEND_URL is not configured:", err);
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

    // Log token presence for debugging (never log actual token)
    console.log(
      `[Plaid accounts] userId=${userId}, hasToken=${!!token}, requestId=${requestId}`,
    );

    // Use the authenticated /api/plaid/items endpoint
    const resp = await fetch(`${backendUrl}/api/plaid/items`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const { data, isJson, rawText } = await safeParseJson(resp);

    if (!resp.ok) {
      // Log full error details for debugging
      console.error(
        `[Plaid accounts] Backend error (${resp.status}):`,
        isJson ? JSON.stringify(data, null, 2) : rawText?.slice(0, 500),
      );

      if (!isJson) {
        return errorResponse(
          "UPSTREAM_ERROR",
          "Backend returned non-JSON response",
          502,
          requestId,
        );
      }

      const errorData = data as {
        detail?: { message?: string; error?: string } | string;
        error?: string;
      } | null;

      // Extract message from various error response shapes
      let message = "Failed to fetch accounts";
      if (errorData?.detail) {
        if (typeof errorData.detail === "string") {
          message = errorData.detail;
        } else if (errorData.detail.message) {
          message = errorData.detail.message;
        }
      } else if (errorData?.error) {
        message = errorData.error;
      }

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
    // EMPTY STATE: Return 200 with status indicator when no items exist
    // This is a valid state (user hasn't connected bank yet), not an error
    // ========================================================================
    if (!itemsData?.items || itemsData.items.length === 0) {
      return NextResponse.json(
        {
          ok: true,
          accounts: [],
          status: "not_connected",
          message: "No bank connected yet",
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
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
      { ok: true, accounts, status: "connected", request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err: unknown) {
    console.error("[Plaid accounts] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse("INTERNAL_ERROR", message, 500, requestId);
  }
}
