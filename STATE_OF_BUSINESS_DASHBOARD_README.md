# State-of-Business Dashboard Refactor

## Summary

This refactor transforms the Home Dashboard from a navigation menu into a true "state-of-business" board that tells users "what's happening" rather than "where to go".

## Core Principles

1. **Conditional Rendering** - Sections only render if backing data exists (delete, don't hide)
2. **Fail-Closed** - null → "—", unknown → explicit, never coerce to 0
3. **Truth-First** - Shows actual backend data, not placeholders
4. **No Hardcoded Values** - Zero hardcoded zeros or mock metrics

## Dashboard Structure

### Section 1: Live State (Top)
**Purpose:** Shows what needs attention RIGHT NOW

Displays attention chips for:
- Documents waiting for processing (links to /documents)
- Bank connection issues (login_required, error - links to /settings)
- Bank sync stale (>24h since last sync - links to /settings)
- Amounts due (invoices or bills outstanding)

**Conditional:** Section only renders if any attention item exists.

### Section 2: Evidence (Middle)
**Purpose:** Shows real data from connected accounts

Displays:
- Invoicing summary (total, paid, due, count)
- Bills summary (total, paid, due, count)
- Customer count (if available)
- Vendor count (if available)
- SignalsPanel (manual fetch, advisory only)

**Conditional:** Individual panels only render if data exists. Shows "Financial metrics unavailable" if no data.

### Section 3: Navigation (Bottom)
**Purpose:** Quick paths into the system

Shows:
- Review Transactions
- Run Intelligence
- CFO Overview

**Conditional:** Only renders if other sections rendered (user has context).

## New Files Created

### `src/lib/renderGuards.ts`
Shared render guard utilities:
- `renderIfAvailable(data, renderFn)` - Renders component only if data is non-null
- `renderIfNonEmpty(array, renderFn)` - Renders component only if array has items
- `formatMetric(value, options)` - Formats numbers, null → "—"
- `formatCurrency(value, currency)` - Currency formatting
- `formatPercent(value, isDecimal)` - Percentage formatting
- `formatCount(value, compact)` - Count formatting
- `hasAnyData(...values)` - Check if any value exists
- `hasAllData(...values)` - Check if all values exist

### `src/hooks/useDashboardState.ts`
Unified hook for dashboard state:
- Fetches documents (for "waiting" count)
- Fetches Plaid status (for bank sync staleness)
- Does NOT auto-fetch signals (manual only per LAWS)
- Returns structured state with availability flags

### `tests/dashboard-home.spec.ts`
Playwright tests for three organization states:
1. **Empty org** - No data, minimal UI, no hardcoded zeros
2. **Partial org** - Some metrics, shows relevant sections
3. **Full org** - All data, all sections visible

## Files Modified

### `src/app/(dashboard)/home/page.tsx`
- Refactored to three-section structure
- Uses render guards for conditional rendering
- Imports from shared utilities
- Removed CfoSnapshotStrip (now covered by Evidence section)
- Removed FirstValueCallout (not backed by real data)

## Canonical Laws Compliance

### What This Prevents
1. **False confidence** - No fake metrics suggesting system health
2. **Misleading zeros** - Zero implies "verified zero", not "unknown"
3. **Placeholder fatigue** - Users learn to ignore "coming soon" patterns
4. **Silent failures** - Errors are explicit, not hidden behind fake UIs

### What This Enables
1. **Truth-first dashboard** - Shows only what the system actually knows
2. **Honest empty states** - Clear messaging about what's needed
3. **Fail-closed behavior** - Unknown state is surfaced, not hidden
4. **Actionable links** - Navigation to configure/fix issues

## Testing

Run the Playwright tests:
```bash
npx playwright test tests/dashboard-home.spec.ts
```

Test scenarios covered:
- Empty organization displays "Financial metrics unavailable"
- Partial organization shows available metrics only
- Full organization shows all three sections
- Documents waiting count is accurate
- Bank connection issues are displayed
- Attention chips link to correct pages
- No hardcoded zeros in any state
- Signals panel requires manual fetch

## Verification Checklist

- [x] No hardcoded zeros in home dashboard
- [x] Sections conditionally render based on data
- [x] null values display as "—" (em dash)
- [x] Bank sync staleness detection (>24h)
- [x] Document processing count accurate
- [x] TypeScript compilation passes
- [x] ESLint passes
- [x] Playwright tests created
