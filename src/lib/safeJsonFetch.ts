/**
 * Safe JSON Fetch — Phase 5 Diagnostics JSON Hardening
 *
 * Performs fetch and safely parses JSON response.
 * NEVER throws JSON parse errors - always returns structured response.
 *
 * Envelope format:
 * {
 *   request_id: string,
 *   timestamp: string,
 *   status: "ok" | "error",
 *   data: T | null,
 *   error: { message: string, code?: number, details?: unknown } | null
 * }
 */

export interface ResponseEnvelope<T = unknown> {
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

function createErrorEnvelope<T>(
  message: string,
  code: number = 500,
  details?: unknown,
): ResponseEnvelope<T> {
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

/**
 * Safely fetch JSON from a URL.
 *
 * - Performs fetch request
 * - Reads response as text
 * - Attempts JSON.parse
 * - If parse fails, returns structured error envelope
 * - NEVER throws JSON parse errors
 *
 * @param url - The URL to fetch
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns ResponseEnvelope with data or error
 */
export async function safeJsonFetch<T = unknown>(
  url: string,
  options?: RequestInit,
): Promise<ResponseEnvelope<T>> {
  const requestId = generateRequestId();

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    // Read response as text first (safe)
    let responseText: string;
    try {
      responseText = await response.text();
    } catch (textError) {
      return createErrorEnvelope<T>(
        "Failed to read response body",
        response.status,
        { url, textError: String(textError) },
      );
    }

    // Handle empty response
    if (!responseText || responseText.trim() === "") {
      if (response.ok) {
        // Empty success response - return empty data
        return {
          request_id: requestId,
          timestamp: new Date().toISOString(),
          status: "ok",
          data: null,
          error: null,
        };
      }
      return createErrorEnvelope<T>(
        `Empty response from server (HTTP ${response.status})`,
        response.status,
        { url },
      );
    }

    // Attempt JSON parse
    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // JSON parse failed - return structured error
      return createErrorEnvelope<T>(
        "Invalid JSON response from server",
        response.status,
        {
          url,
          responsePreview: responseText.slice(0, 200),
          contentType: response.headers.get("content-type"),
        },
      );
    }

    // Check if response already has envelope format
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "status" in parsed &&
      ("data" in parsed || "error" in parsed)
    ) {
      // Response already wrapped in envelope
      const envelope = parsed as ResponseEnvelope<T>;
      return {
        request_id: envelope.request_id || requestId,
        timestamp: envelope.timestamp || new Date().toISOString(),
        status: envelope.status,
        data: envelope.data,
        error: envelope.error,
      };
    }

    // Wrap raw response in envelope
    if (!response.ok) {
      // Error response without envelope
      const errorMessage =
        typeof parsed === "object" && parsed !== null && "error" in parsed
          ? String((parsed as { error: unknown }).error)
          : typeof parsed === "object" && parsed !== null && "detail" in parsed
            ? String((parsed as { detail: unknown }).detail)
            : typeof parsed === "object" &&
                parsed !== null &&
                "message" in parsed
              ? String((parsed as { message: unknown }).message)
              : `HTTP ${response.status}`;

      return createErrorEnvelope<T>(errorMessage, response.status, parsed);
    }

    // Success response without envelope - wrap it
    return {
      request_id: requestId,
      timestamp: new Date().toISOString(),
      status: "ok",
      data: parsed as T,
      error: null,
    };
  } catch (fetchError) {
    // Network error or other fetch failure
    const isNetworkError =
      fetchError instanceof TypeError &&
      (fetchError.message.includes("fetch") ||
        fetchError.message.includes("network") ||
        fetchError.message.includes("Failed to fetch"));

    return createErrorEnvelope<T>(
      isNetworkError
        ? "Network error - unable to reach server"
        : "Request failed",
      0,
      {
        url,
        error: String(fetchError),
        isNetworkError,
      },
    );
  }
}

/**
 * Safe POST request with JSON body.
 */
export async function safeJsonPost<T = unknown, B = unknown>(
  url: string,
  body: B,
  options?: Omit<RequestInit, "method" | "body">,
): Promise<ResponseEnvelope<T>> {
  return safeJsonFetch<T>(url, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Safe GET request.
 */
export async function safeJsonGet<T = unknown>(
  url: string,
  options?: Omit<RequestInit, "method">,
): Promise<ResponseEnvelope<T>> {
  return safeJsonFetch<T>(url, {
    ...options,
    method: "GET",
  });
}
