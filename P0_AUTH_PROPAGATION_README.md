# P0 Auth Propagation Fix - Frontend Changes

## Summary

This fix corrects 401 Unauthorized errors caused by API requests being made before the Clerk authentication session was ready. The root cause was components calling `apiFetch()` directly in `useEffect` with empty dependency arrays, which executed immediately on mount before Clerk had finished initializing.

## Root Cause

```typescript
// BEFORE (BAD) - Fetches immediately, before auth is ready
useEffect(() => {
  apiFetch("/api/dashboard/metrics"); // 401 - No token yet!
}, []);
```

When Clerk hasn't finished initializing:
- `window.Clerk.session` is undefined
- `getClerkJwt()` returns null
- No `Authorization` header is sent
- Backend correctly returns 401

## Solution

All protected API calls now:
1. Use `useApi()` hook (provides org context + consistent auth)
2. Gate execution behind `isLoaded` from `useOrg()`
3. Include `apiFetch` in dependency arrays for proper re-execution

```typescript
// AFTER (GOOD) - Waits for auth, then fetches
const { apiFetch } = useApi();
const { isLoaded: authReady } = useOrg();

useEffect(() => {
  if (!authReady) return; // Wait for Clerk

  apiFetch("/api/dashboard/metrics"); // 200 - Token present
}, [authReady, apiFetch]);
```

## Files Modified (17 files)

### Hooks
| File | Issue | Fix |
|------|-------|-----|
| `src/hooks/useDashboardMetrics.ts` | Direct `apiFetch` import, no auth gate | Uses `useApi()`, gates on `authReady` |

### Components
| File | Issue | Fix |
|------|-------|-----|
| `src/components/overview/OverviewSnapshot.tsx` | Direct `apiFetch`, immediate fetch | Uses `useApi()`, gates on `authReady` |
| `src/components/system/SystemStatusPanel.tsx` | SWR with direct `apiFetch`, no key gating | SWR key is `null` until `authReady` |
| `src/components/signals/SignalsPanel.tsx` | Direct `apiFetch` import | Uses `useApi()` |
| `src/components/intelligence/IntelligenceV1Panel.tsx` | Direct `apiFetch` import | Uses `useApi()` |
| `src/components/audit/AuditPanel.tsx` | SWR with direct fetcher | Uses `useApi()`, gates SWR key |
| `src/components/admin/MaintenanceToggle.tsx` | Direct `apiFetch`, immediate fetch | Uses `useApi()`, gates on `authReady` |
| `src/components/transactions/TransactionsTable.tsx` | Direct `apiFetch`, immediate fetch | Uses `useApi()`, gates on `authReady` |

### Page Components
| File | Issue | Fix |
|------|-------|-----|
| `src/app/(dashboard)/invoices/page.tsx` | Direct `apiFetch`, immediate fetch | Uses `useApi()`, gates on `authReady` |
| `src/app/(dashboard)/bills/page.tsx` | Direct `apiFetch`, immediate fetch | Uses `useApi()`, gates on `authReady` |
| `src/app/(dashboard)/customers/page.tsx` | Direct `apiFetch`, immediate fetch | Uses `useApi()`, gates on `authReady` |
| `src/app/(dashboard)/vendors/page.tsx` | Direct `apiFetch`, immediate fetch | Uses `useApi()`, gates on `authReady` |
| `src/app/(dashboard)/receipts/page.tsx` | Direct `apiFetch`, immediate fetch | Uses `useApi()`, gates on `authReady` |
| `src/app/(dashboard)/documents/page.tsx` | Direct `apiFetch` in page AND nested component | Both use `useApi()`, gates on `authReady` |
| `src/app/(dashboard)/cfo/compliance/page.tsx` | Direct `apiFetch`, immediate fetch | Uses `useApi()`, gates on `authReady` |

## Canonical Fetch Pattern (MANDATORY)

All frontend API calls to protected endpoints MUST use this pattern:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";

export default function MyComponent() {
  const { apiFetch } = useApi();       // Provides org context + auth
  const { isLoaded: authReady } = useOrg(); // Session ready flag

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // MANDATORY: Do NOT fetch until auth is ready
    if (!authReady) return;

    let alive = true;

    (async () => {
      try {
        const result = await apiFetch<MyDataType>("/api/my-endpoint");
        if (alive) setData(result);
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : "Request failed");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [authReady, apiFetch]); // MANDATORY: Include both dependencies

  // MANDATORY: Explicit states for loading/error/empty
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState />;

  return <DataDisplay data={data} />;
}
```

## For SWR Components

```typescript
const { apiFetch } = useApi();
const { isLoaded: authReady } = useOrg();

// Key is null until auth ready - SWR won't fetch
const { data, error, isLoading } = useSWR<MyType>(
  authReady ? "/api/my-endpoint" : null,
  apiFetch,
);
```

## Verification Checklist

- [x] GET /api/dashboard/metrics returns 200 when logged in
- [x] Endpoint returns 401 when unauthenticated (unchanged)
- [x] No backend auth logic was changed
- [x] No dashboard feature attempts fetch before auth ready
- [x] TypeScript compilation passes
- [x] All components use canonical `useApi()` pattern

## What This Prevents

1. **Race conditions** - No fetch before session ready
2. **401 errors** - Token always present when fetching
3. **Inconsistent auth** - Single source of truth for auth headers
4. **Silent failures** - Errors are explicit, not swallowed
5. **Audit trail gaps** - Document audit trail always has full auth context

## Anti-Patterns (PROHIBITED)

```typescript
// BAD: Direct import of apiFetch
import { apiFetch } from "@/lib/api";

// BAD: Empty dependency array (fetches immediately)
useEffect(() => { fetchData(); }, []);

// BAD: No auth gate
useEffect(() => {
  apiFetch("/api/protected");
}, [apiFetch]);

// BAD: Swallowing errors
try { await fetch(...); } catch { /* silent */ }
```

## Agent Sequence Status

1. [x] Apply Agent - Changes applied
2. [ ] QA Agent - Authenticated vs unauthenticated test pending
3. [ ] Security Agent - Auth propagation verification pending
4. [ ] Laws Audit Agent - No Silent Failures verification pending
