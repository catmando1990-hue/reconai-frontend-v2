/**
 * Safe JSON Fetch — DELEGATED TO auditedFetch
 *
 * NEUTRALIZED: All calls delegate to auditedFetch for provenance enforcement.
 * This file exists only for backward compatibility of imports.
 *
 * NO FRONTEND-GENERATED IDS. NO SILENT RECOVERY.
 * All responses MUST come from backend with valid request_id.
 */

import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
  type AuditedFetchOptions,
} from "./auditedFetch";

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

/**
 * Safely fetch JSON from a URL.
 *
 * DELEGATED: Uses auditedFetch for provenance enforcement.
 * Throws AuditProvenanceError if request_id is missing.
 *
 * @throws {AuditProvenanceError} If provenance validation fails
 * @throws {HttpError} If HTTP status is not ok
 */
export async function safeJsonFetch<T = unknown>(
  url: string,
  options?: RequestInit,
): Promise<ResponseEnvelope<T>> {
  // Delegate to auditedFetch - it will throw on missing request_id
  const data = await auditedFetch<ResponseEnvelope<T>>(url, {
    ...options,
  } as AuditedFetchOptions);

  return data;
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

// Re-export error types for consumers
export { AuditProvenanceError, HttpError };
