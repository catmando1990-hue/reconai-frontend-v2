# ReconAI Pre-Deploy Trust Checklist

## Purpose

This checklist must pass before any production deployment.
It ensures no trust violations can silently enter production.

---

## PART 1: Deprecated Code Paths

### Plaid v1 Router
- [ ] **VERIFIED**: `plaid.py` endpoints return 410 Gone
- [ ] **VERIFIED**: No direct calls to `stores.save_user_token()` or `stores.get_user_access_token()`
- [ ] **VERIFIED**: `/link-token`, `/exchange-public-token`, `/accounts`, `/transactions` all deprecated
- [ ] **VERIFIED**: Frontend uses v2 API endpoints (`/api/plaid/*`)

### How to Verify
```bash
# Backend: Test deprecated endpoints return 410
curl -X POST https://api.reconai.com/link-token
# Expected: 410 Gone with deprecation message

# Frontend: Search for v1 endpoint usage
grep -r "POST /link-token" src/
grep -r "POST /exchange-public-token" src/
# Expected: No matches (use /api/plaid/create-link-token instead)
```

---

## PART 2: Mock/Demo Data References

### Signals API
- [ ] **VERIFIED**: `DEMO_MODE` flag in `signals.py` is documented
- [ ] **VERIFIED**: Frontend displays "Demo" badge when `mode === "demo"`
- [ ] **VERIFIED**: No hardcoded signal data in frontend

### Dashboard Metrics
- [ ] **VERIFIED**: No hardcoded zeros in `useDashboardMetrics.ts`
- [ ] **VERIFIED**: Fail-closed metrics return `null` not `0`
- [ ] **VERIFIED**: UI shows "Unknown" for null values

### How to Verify
```bash
# Search for hardcoded demo data
grep -rn "DEMO_MODE" app/routers/
grep -rn "mode.*demo" src/

# Search for suspicious hardcoded values
grep -rn "return 0" src/hooks/
grep -rn 'status.*"healthy"' src/
grep -rn 'status.*"ok"' src/
```

---

## PART 3: Live Indicators Wired to Backend

### Connection Status
- [ ] **VERIFIED**: Plaid status comes from `/api/plaid/status` (backend items)
- [ ] **VERIFIED**: No fabricated "Healthy" or "Connected" states
- [ ] **VERIFIED**: Status shows "Unknown" when backend unavailable

### Data Freshness
- [ ] **VERIFIED**: "Last Sync" shows actual timestamp or "Unknown"
- [ ] **VERIFIED**: No hardcoded "Just now", "2m ago", "Live"
- [ ] **VERIFIED**: `Data Mode: On-demand` not `Data Sync: Live`

### System Status
- [ ] **VERIFIED**: `SystemStatusPanel.tsx` shows "Unknown" for null values
- [ ] **VERIFIED**: Health status from backend API, not fabricated

### How to Verify
```bash
# Search for suspicious "live" indicators
grep -rn '"Live"' src/
grep -rn '"Just now"' src/
grep -rn '"2m ago"' src/
grep -rn 'Data Sync.*Live' src/

# Verify status comes from backend
grep -rn 'status.*healthy' src/
# Should only appear in switch/if statements, not hardcoded assignments
```

---

## PART 4: Unknown States Explicitly Labeled

### Status Types
- [ ] **VERIFIED**: `status-contracts.ts` defines all valid status types
- [ ] **VERIFIED**: All status types include "unknown" option
- [ ] **VERIFIED**: Helper functions default to "unknown" for invalid values

### UI Components
- [ ] **VERIFIED**: `DataSourcesSection.tsx` shows "Unknown" for missing data
- [ ] **VERIFIED**: `SystemStatusPanel.tsx` shows "Unknown" for null Plaid sync
- [ ] **VERIFIED**: `ConnectedAccounts.tsx` shows "Unknown" for invalid status

### Metrics Display
- [ ] **VERIFIED**: Null counts display as "Unknown" not "0" or "--"
- [ ] **VERIFIED**: Null amounts display as "Unknown" not "$0.00"
- [ ] **VERIFIED**: Null timestamps display as "Unknown" not fake times

### How to Verify
```bash
# Verify unknown handling
grep -rn 'return.*Unknown' src/
grep -rn 'Unknown.*null' src/
grep -rn 'safeStatus\|safeMetric\|safeFormatTimestamp' src/

# Verify no silent failures
grep -rn 'catch.*{}' src/  # Empty catch blocks are suspicious
grep -rn '|| 0' src/       # Defaulting to 0 hides missing data
grep -rn "|| ''" src/      # Defaulting to empty string hides missing data
```

---

## PART 5: Build & Type Safety

### TypeScript
- [ ] **VERIFIED**: `npm run build` passes with no type errors
- [ ] **VERIFIED**: All status values are strongly typed (no `string`)
- [ ] **VERIFIED**: Nullable fields use `T | null` not `T | undefined`

### ESLint
- [ ] **VERIFIED**: `npm run lint` passes
- [ ] **VERIFIED**: No `@ts-ignore` or `any` types in status code

### How to Verify
```bash
cd reconai-frontend-v2
npm run build  # Must pass
npm run lint   # Must pass

# Search for type bypasses
grep -rn '@ts-ignore' src/
grep -rn '@ts-expect-error' src/
grep -rn ': any' src/types/
```

---

## PART 6: Backend Validation

### API Responses
- [ ] **VERIFIED**: All status endpoints return structured JSON
- [ ] **VERIFIED**: Error responses include proper status codes
- [ ] **VERIFIED**: Deprecated endpoints return 410 Gone

### Data Integrity
- [ ] **VERIFIED**: No mock data in production responses
- [ ] **VERIFIED**: All timestamps are real (not fabricated)
- [ ] **VERIFIED**: All counts are from actual queries (not hardcoded)

### How to Verify
```bash
# Test API endpoints
curl https://api.reconai.com/api/plaid/status -H "Authorization: Bearer $TOKEN"
# Should return structured PlaidStatusResponse

# Test deprecated endpoints
curl -X POST https://api.reconai.com/link-token
# Should return 410 Gone
```

---

## Sign-Off

**Pre-Deploy Review Completed By:**

- [ ] Developer: _________________ Date: _________
- [ ] Code Review: _________________ Date: _________
- [ ] QA Verification: _________________ Date: _________

**Deployment Approved:**

- [ ] All checklist items verified
- [ ] No trust violations found
- [ ] Ready for production

---

## Quick Reference: Red Flags

If you see ANY of these, DO NOT DEPLOY:

1. `status: "healthy"` without backend confirmation
2. `lastSync: "Just now"` or any fabricated time
3. `count: 0` when the real count is null/unknown
4. `|| "ok"` or `|| "connected"` as fallback
5. Empty catch blocks that swallow errors
6. Direct calls to deprecated v1 Plaid endpoints
7. `DEMO_MODE = True` in production without visible label

---

## Automation

Add to CI/CD pipeline:

```yaml
# .github/workflows/trust-check.yml
name: Trust Checklist
on: [push, pull_request]
jobs:
  trust-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check for hardcoded status
        run: |
          ! grep -rn 'status.*"healthy"' src/ --include="*.ts" --include="*.tsx" || exit 1
          ! grep -rn '"Live"' src/components/ --include="*.tsx" || exit 1
          ! grep -rn 'Data Sync.*Live' src/ || exit 1
      - name: Check for zero fallbacks
        run: |
          ! grep -rn '|| 0' src/hooks/ --include="*.ts" || exit 1
      - name: Build check
        run: npm run build
      - name: Lint check
        run: npm run lint
```
