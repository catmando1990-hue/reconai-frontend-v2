/**
 * ReconAI API Client (V2 — Next.js + Clerk)
 *
 * Base fetch wrapper that handles:
 * - Auth header injection (Clerk JWT via window.Clerk)
 * - Response envelope unwrapping ({ status, data, error, request_id })
 * - Structured error handling
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

class ApiError extends Error {
  constructor(status, code, message, requestId, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

export { ApiError };

/**
 * Fetch the current Clerk JWT from window.Clerk (client-side only).
 * Returns null on the server or when Clerk is not yet loaded.
 */
async function getClerkJwt() {
  if (typeof window === "undefined") return null;
  const clerk = window.Clerk;
  const session = clerk?.session;
  if (!session?.getToken) return null;
  try {
    return await session.getToken();
  } catch {
    return null;
  }
}

async function request(
  method,
  path,
  { body, params, headers: extraHeaders } = {},
) {
  // If path is already absolute, use as-is. Otherwise prepend BASE_URL.
  const isAbsolute = /^https?:\/\//i.test(path);
  const url = new URL(isAbsolute ? path : `${BASE_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }

  const headers = { ...extraHeaders };

  const token = await getClerkJwt();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = { method, headers };

  if (body !== undefined && body !== null) {
    headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(body);
  }

  config.headers = headers;

  let res;
  try {
    res = await fetch(url.toString(), config);
  } catch (err) {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      `Network error: ${err.message}`,
      null,
      null,
    );
  }

  if (res.status === 204) return null;

  let json;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(
      res.status,
      "PARSE_ERROR",
      "Failed to parse response",
      null,
      null,
    );
  }

  if (!res.ok || json.error) {
    const err = json.error || {};
    throw new ApiError(
      res.status,
      err.code || `HTTP_${res.status}`,
      err.message || res.statusText,
      err.request_id || json.request_id,
      err.details,
    );
  }

  if (json.data !== undefined) {
    return json.data;
  }

  return json;
}

export const api = {
  get: (path, opts) => request("GET", path, opts),
  post: (path, body, opts) => request("POST", path, { ...opts, body }),
  put: (path, body, opts) => request("PUT", path, { ...opts, body }),
  patch: (path, body, opts) => request("PATCH", path, { ...opts, body }),
  delete: (path, opts) => request("DELETE", path, opts),
};

// V2 uses Clerk natively — no token accessor needed.
// Exported as a no-op so AuthContext.jsx still works.
export function setTokenAccessor() {
  // no-op in V2
}

export default api;
