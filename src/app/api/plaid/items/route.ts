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

export async function GET(req: Request) {
  const incomingRequestId = req.headers.get("x-request-id");
  const requestId = incomingRequestId || crypto.randomUUID();

  try {
    // Get backend URL (validated at runtime, not module scope)
    let backendUrl: string;
    try {
      backendUrl = getBackendUrl();
    } catch (err) {
      console.error("[Plaid items] BACKEND_URL is not configured:", err);
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

    // Proxy to FastAPI backend /api/plaid/items
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
      // Log non-JSON responses for debugging
      if (!isJson) {
        console.error(
          `[Plaid items] Non-JSON error response (${resp.status}):`,
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
        errorData?.detail || errorData?.error || "Failed to fetch items";
      return errorResponse("UPSTREAM_ERROR", message, resp.status, requestId);
    }

    // Validate response shape
    if (!isJson) {
      console.error(
        "[Plaid items] Non-JSON success response:",
        rawText?.slice(0, 500),
      );
      return errorResponse(
        "INVALID_RESPONSE",
        "Backend returned invalid response format",
        502,
        requestId,
      );
    }

    const itemsData = data as {
      success?: boolean;
      items?: Array<{
        item_id: string;
        institution_id?: string;
        institution_name?: string;
        status?: string;
        last_synced_at?: string;
        error_code?: string;
        error_message?: string;
        created_at?: string;
        updated_at?: string;
      }>;
    } | null;

    // ========================================================================
    // ORDERING GUARD: Return 400 if NO Plaid Item exists (before Link)
    // This prevents premature calls to /items before exchange-public-token
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

    return NextResponse.json(
      { ok: true, items: itemsData.items, request_id: requestId },
      { headers: { "x-request-id": requestId } },
    );
  } catch (err: unknown) {
    console.error("[Plaid items] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse("INTERNAL_ERROR", message, 500, requestId);
  }
}
