export type ApiFetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: HeadersInit;

  /**
   * Optional JWT template name configured in Clerk.
   * If provided, will request that token template.
   */
  tokenTemplate?: string;

  /**
   * Base URL to prefix when `path` is relative. Defaults to `NEXT_PUBLIC_API_BASE_URL`.
   */
  baseUrl?: string;

  /**
   * If true, returns the raw `Response` instead of parsing JSON.
   */
  rawResponse?: boolean;

  /**
   * Optional 401 handler. If not provided, a reasonable default is used.
   */
  onUnauthorized?: (response: Response) => void | Promise<void>;
};

type ClerkWindow = {
  Clerk?: {
    session?: {
      getToken?: (options?: { template?: string }) => Promise<string | null | undefined>;
    };
  };
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function resolveUrl(path: string, baseUrl?: string) {
  if (/^https?:\/\//i.test(path)) return path;

  const base =
    baseUrl ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    '';
  if (!base) return path;

  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

async function getClerkJwt(tokenTemplate?: string): Promise<string | null> {
  // Client-side: try Clerk JS global.
  if (typeof window !== 'undefined') {
    const clerk = (window as unknown as ClerkWindow).Clerk;
    const session = clerk?.session;

    if (session?.getToken) {
      try {
        const token = await session.getToken(
          tokenTemplate ? { template: tokenTemplate } : undefined
        );
        return token ?? null;
      } catch {
        return null;
      }
    }

    return null;
  }

  // Server-side: use Clerk's `auth()` helper.
  try {
    const mod = await import('@clerk/nextjs/server');
    const { auth } = mod;
    const authState = await auth();
    const token = await authState.getToken(tokenTemplate ? { template: tokenTemplate } : undefined);
    return token ?? null;
  } catch {
    return null;
  }
}

async function getClerkOrgIdServer(): Promise<string | null> {
  if (typeof window !== 'undefined') return null;

  try {
    const mod = await import('@clerk/nextjs/server');
    const { auth } = mod;
    const authState = await auth();
    // `orgId` is available when using Clerk organizations.
    const orgId = 'orgId' in authState ? (authState.orgId as string | null | undefined) : null;
    return orgId ?? null;
  } catch {
    return null;
  }
}

function defaultUnauthorizedHandler() {
  if (typeof window !== 'undefined') {
    // Default to Clerk's conventional route; adjust if your app uses a different URL.
    window.location.assign('/sign-in');
    return;
  }

  throw new Error('Unauthorized (401)');
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { tokenTemplate, baseUrl, rawResponse, onUnauthorized, ...requestInit } = options;

  const url = resolveUrl(path, baseUrl);

  const headers = new Headers(requestInit.headers);

  // Set JSON content-type when sending a plain object/string body.
  const body: unknown = requestInit.body;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body != null && !isFormData && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const token = await getClerkJwt(tokenTemplate);
  if (token && !headers.has('authorization')) {
    headers.set('authorization', `Bearer ${token}`);
  }

  // Automatically add org header on the server (client uses `useApi()` for this).
  if (!headers.has('x-organization-id')) {
    const orgId = await getClerkOrgIdServer();
    if (orgId) headers.set('x-organization-id', orgId);
  }

  const response = await fetch(url, {
    ...requestInit,
    headers,
  });

  if (response.status === 401) {
    if (onUnauthorized) {
      await onUnauthorized(response);
    } else {
      defaultUnauthorizedHandler();
    }
  }

  if (rawResponse) {
    return response as unknown as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    // Best-effort error body parsing.
    const errorBody = isJson ? await response.json().catch(() => null) : await response.text();
    const message =
      typeof errorBody === 'string'
        ? errorBody
        : isObject(errorBody) && typeof errorBody.message === 'string'
        ? errorBody.message
        : `Request failed (${response.status})`;

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return (isJson ? await response.json() : await response.text()) as T;
}
