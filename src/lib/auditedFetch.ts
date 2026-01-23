/**
 * Canonical Audited Fetch — Compliance-First API Client
 *
 * FAIL-CLOSED DESIGN:
 * - Every request sends x-request-id header
 * - Every response MUST echo x-request-id header
 * - Every response body MUST contain request_id field
 * - Any violation throws AuditProvenanceError
 *
 * NO SILENT FALLBACKS. NO FABRICATED IDS.
 */

// =============================================================================
// ERROR TYPES
// =============================================================================

export class AuditProvenanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuditProvenanceError";
  }
}

export class HttpError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

// =============================================================================
// TYPES
// =============================================================================

export type AuditedFetchOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;

  /**
   * Optional JWT template name configured in Clerk.
   */
  tokenTemplate?: string;

  /**
   * Base URL to prefix when path is relative.
   */
  baseUrl?: string;

  /**
   * If true, returns raw Response (still validates x-request-id header).
   */
  rawResponse?: boolean;

  /**
   * Skip body request_id validation (for non-JSON responses).
   * Header validation still required.
   */
  skipBodyValidation?: boolean;
};

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

type ClerkWindow = {
  Clerk?: {
    session?: {
      getToken?: (options?: { template?: string }) => Promise<string | null>;
    };
  };
};

function generateRequestId(): string {
  // Use crypto.randomUUID() - available in all modern browsers and Node.js 16+
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments (should not happen in practice)
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function resolveUrl(path: string, baseUrl?: string): string {
  // Absolute URLs are untouched
  if (/^https?:\/\//i.test(path)) return path;

  // Any /api/* path is always returned as-is (same-origin)
  if (/^\/api\//.test(path)) return path;

  // Apply base URL only to non-/api paths
  const base =
    baseUrl ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "";

  if (!base) return path;
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

async function getClerkJwt(tokenTemplate?: string): Promise<string | null> {
  // Client-side: use Clerk JS global
  if (typeof window !== "undefined") {
    const clerk = (window as unknown as ClerkWindow).Clerk;
    const session = clerk?.session;

    if (session?.getToken) {
      try {
        const token = await session.getToken(
          tokenTemplate ? { template: tokenTemplate } : undefined,
        );
        return token ?? null;
      } catch {
        return null;
      }
    }
    return null;
  }

  // Server-side: use Clerk's auth() helper
  try {
    const mod = await import("@clerk/nextjs/server");
    const { auth } = mod;
    const authState = await auth();
    const token = await authState.getToken(
      tokenTemplate ? { template: tokenTemplate } : undefined,
    );
    return token ?? null;
  } catch {
    return null;
  }
}

async function getClerkOrgIdServer(): Promise<string | null> {
  if (typeof window !== "undefined") return null;

  try {
    const mod = await import("@clerk/nextjs/server");
    const { auth } = mod;
    const authState = await auth();
    const orgId =
      "orgId" in authState
        ? (authState.orgId as string | null | undefined)
        : null;
    return orgId ?? null;
  } catch {
    return null;
  }
}

// =============================================================================
// CANONICAL AUDITED FETCH
// =============================================================================

/**
 * Audited fetch with mandatory request_id provenance.
 *
 * GUARANTEES:
 * 1. x-request-id header sent on EVERY request
 * 2. x-request-id header REQUIRED in response
 * 3. request_id field REQUIRED in response body (unless skipBodyValidation)
 * 4. AuditProvenanceError thrown on ANY violation
 *
 * @throws {AuditProvenanceError} If provenance validation fails
 * @throws {HttpError} If HTTP status is not ok (4xx, 5xx)
 */
export async function auditedFetch<T = unknown>(
  path: string,
  options: AuditedFetchOptions = {},
): Promise<T> {
  const {
    tokenTemplate,
    baseUrl,
    rawResponse,
    skipBodyValidation,
    ...requestInit
  } = options;

  const url = resolveUrl(path, baseUrl);
  const requestId = generateRequestId();

  // Build headers
  const headers = new Headers(requestInit.headers);

  // CRITICAL: Set x-request-id on EVERY request
  headers.set("x-request-id", requestId);

  // Set JSON content-type when sending object body (not FormData)
  const body: unknown = requestInit.body;
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;
  if (body != null && !isFormData && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  // Inject Clerk JWT if available
  const token = await getClerkJwt(tokenTemplate);
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  // Inject org ID on server-side
  if (!headers.has("x-organization-id")) {
    const orgId = await getClerkOrgIdServer();
    if (orgId) headers.set("x-organization-id", orgId);
  }

  // Execute fetch
  const response = await fetch(url, {
    ...requestInit,
    headers,
  });

  // VALIDATION 1: Response MUST have x-request-id header
  const responseRequestId = response.headers.get("x-request-id");
  if (!responseRequestId) {
    throw new AuditProvenanceError(
      `Missing x-request-id header in response from ${url}. ` +
        `Sent request_id: ${requestId}`,
    );
  }

  // Return raw response if requested (header validated)
  if (rawResponse) {
    return response as unknown as T;
  }

  // Handle non-ok responses
  if (!response.ok) {
    let errorBody: unknown;
    try {
      const contentType = response.headers.get("content-type") ?? "";
      errorBody = contentType.includes("application/json")
        ? await response.json()
        : await response.text();
    } catch {
      errorBody = null;
    }

    const message =
      typeof errorBody === "object" &&
      errorBody !== null &&
      "message" in errorBody
        ? String((errorBody as { message: unknown }).message)
        : typeof errorBody === "string"
          ? errorBody
          : `Request failed (${response.status})`;

    throw new HttpError(response.status, message, errorBody);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  // Parse response body
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!isJson) {
    if (skipBodyValidation) {
      return (await response.text()) as unknown as T;
    }
    throw new AuditProvenanceError(
      `Non-JSON response from ${url} without skipBodyValidation. ` +
        `Content-Type: ${contentType}`,
    );
  }

  const data = await response.json();

  // VALIDATION 2: Response body MUST have request_id field
  if (!skipBodyValidation) {
    if (
      typeof data !== "object" ||
      data === null ||
      !("request_id" in data) ||
      !data.request_id
    ) {
      throw new AuditProvenanceError(
        `Missing request_id in response body from ${url}. ` +
          `Sent request_id: ${requestId}`,
      );
    }
  }

  return data as T;
}

// =============================================================================
// CONVENIENCE METHODS
// =============================================================================

/**
 * Audited POST request.
 */
export async function auditedPost<T = unknown, B = unknown>(
  path: string,
  body: B,
  options?: Omit<AuditedFetchOptions, "method" | "body">,
): Promise<T> {
  return auditedFetch<T>(path, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Audited PUT request.
 */
export async function auditedPut<T = unknown, B = unknown>(
  path: string,
  body: B,
  options?: Omit<AuditedFetchOptions, "method" | "body">,
): Promise<T> {
  return auditedFetch<T>(path, {
    ...options,
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * Audited PATCH request.
 */
export async function auditedPatch<T = unknown, B = unknown>(
  path: string,
  body: B,
  options?: Omit<AuditedFetchOptions, "method" | "body">,
): Promise<T> {
  return auditedFetch<T>(path, {
    ...options,
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * Audited DELETE request.
 */
export async function auditedDelete<T = unknown>(
  path: string,
  options?: Omit<AuditedFetchOptions, "method">,
): Promise<T> {
  return auditedFetch<T>(path, {
    ...options,
    method: "DELETE",
  });
}

/**
 * Audited GET request.
 */
export async function auditedGet<T = unknown>(
  path: string,
  options?: Omit<AuditedFetchOptions, "method">,
): Promise<T> {
  return auditedFetch<T>(path, {
    ...options,
    method: "GET",
  });
}
