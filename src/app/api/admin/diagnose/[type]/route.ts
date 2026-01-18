/**
 * Admin Diagnostics API Route — Phase 5 JSON Hardening
 *
 * Safely proxies diagnostic requests to backend with structured JSON envelope.
 * NEVER crashes on JSON parse errors.
 * Manual-run only, no polling.
 */

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ResponseEnvelope<T = unknown> {
  request_id: string;
  timestamp: string;
  status: "ok" | "error";
  data: T | null;
  error: {
    message: string;
    code?: number;
    details?: unknown;
  } | null;
}

function generateRequestId(): string {
  return `fe-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createErrorEnvelope(
  message: string,
  code: number = 500,
  details?: unknown,
): ResponseEnvelope {
  return {
    request_id: generateRequestId(),
    timestamp: new Date().toISOString(),
    status: "error",
    data: null,
    error: {
      message,
      code,
      details,
    },
  };
}

function createSuccessEnvelope<T>(
  data: T,
  requestId?: string,
): ResponseEnvelope<T> {
  return {
    request_id: requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
    status: "ok",
    data,
    error: null,
  };
}

async function assertAdminAndGetToken(): Promise<
  { error: ResponseEnvelope } | { token: string }
> {
  const { userId, sessionClaims, getToken } = await auth();

  if (!userId) {
    return {
      error: createErrorEnvelope("Unauthorized - No user session", 401),
    };
  }

  const isAdminRole = (role: unknown): boolean =>
    role === "admin" || role === "org:admin";

  const sessionRole = (
    sessionClaims?.metadata as Record<string, unknown> | undefined
  )?.role;
  if (isAdminRole(sessionRole)) {
    const token = await getToken();
    return { token: token || "" };
  }

  const user = await currentUser();
  const userRole = (user?.publicMetadata as Record<string, unknown> | undefined)
    ?.role;

  if (isAdminRole(userRole)) {
    const token = await getToken();
    return { token: token || "" };
  }

  return {
    error: createErrorEnvelope("Forbidden - Admin access required", 403),
  };
}

/**
 * Safely fetch and parse JSON from backend.
 * Never throws on parse errors.
 */
async function safeBackendFetch(
  url: string,
  options: RequestInit,
): Promise<{ envelope: ResponseEnvelope; status: number }> {
  const requestId = generateRequestId();

  try {
    const response = await fetch(url, options);

    // Read as text first (safe)
    let responseText: string;
    try {
      responseText = await response.text();
    } catch {
      return {
        envelope: createErrorEnvelope(
          "Failed to read backend response",
          response.status,
        ),
        status: response.status || 500,
      };
    }

    // Handle empty response
    if (!responseText || responseText.trim() === "") {
      if (response.ok) {
        return {
          envelope: createSuccessEnvelope(null, requestId),
          status: response.status,
        };
      }
      return {
        envelope: createErrorEnvelope(
          `Empty response from backend (HTTP ${response.status})`,
          response.status,
        ),
        status: response.status,
      };
    }

    // Attempt JSON parse
    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      return {
        envelope: createErrorEnvelope(
          "Invalid JSON from backend",
          response.status,
          { responsePreview: responseText.slice(0, 200) },
        ),
        status: response.status,
      };
    }

    // Check if already envelope format
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "status" in parsed &&
      ("data" in parsed || "error" in parsed)
    ) {
      return {
        envelope: parsed as ResponseEnvelope,
        status: response.status,
      };
    }

    // Wrap in envelope
    if (!response.ok) {
      const errorMessage =
        typeof parsed === "object" && parsed !== null && "error" in parsed
          ? String((parsed as { error: unknown }).error)
          : typeof parsed === "object" && parsed !== null && "detail" in parsed
            ? String((parsed as { detail: unknown }).detail)
            : `Backend error (HTTP ${response.status})`;

      return {
        envelope: createErrorEnvelope(errorMessage, response.status, parsed),
        status: response.status,
      };
    }

    return {
      envelope: createSuccessEnvelope(parsed, requestId),
      status: response.status,
    };
  } catch (fetchError) {
    const isNetworkError =
      fetchError instanceof TypeError &&
      (fetchError.message.includes("fetch") ||
        fetchError.message.includes("network"));

    return {
      envelope: createErrorEnvelope(
        isNetworkError
          ? "Network error - unable to reach backend"
          : "Request to backend failed",
        0,
        { error: String(fetchError) },
      ),
      status: 503,
    };
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const authResult = await assertAdminAndGetToken();
  if ("error" in authResult) {
    return NextResponse.json(authResult.error, {
      status: authResult.error.error?.code || 401,
    });
  }

  const { type } = await params;

  // Validate diagnostic type
  const validTypes = ["health", "performance", "security", "bugs"];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      createErrorEnvelope(`Invalid diagnostic type: ${type}`, 400),
      { status: 400 },
    );
  }

  if (!API_URL) {
    return NextResponse.json(
      createErrorEnvelope("Backend API not configured", 500),
      { status: 500 },
    );
  }

  // Parse request body safely
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is OK
  }

  // Use the new envelope endpoint if available, fallback to original
  const envelopeUrl = `${API_URL}/api/admin/diagnostics/run/${type}`;
  const legacyUrl = `${API_URL}/api/admin/diagnose/${type}`;

  // Try envelope endpoint first
  let result = await safeBackendFetch(envelopeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authResult.token}`,
    },
    body: JSON.stringify({
      depth: body.depth || "standard",
      include_fixes: body.include_fixes ?? true,
    }),
  });

  // If envelope endpoint not found (404), try legacy endpoint
  if (result.status === 404) {
    result = await safeBackendFetch(legacyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authResult.token}`,
      },
      body: JSON.stringify({
        type,
        depth: body.depth || "standard",
        include_fixes: body.include_fixes ?? true,
      }),
    });
  }

  return NextResponse.json(result.envelope, {
    status: result.envelope.status === "ok" ? 200 : result.status || 500,
  });
}
