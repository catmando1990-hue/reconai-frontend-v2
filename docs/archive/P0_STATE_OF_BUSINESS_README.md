# P0 State-of-Business Dashboard Audit - Frontend Changes

## Summary

This fix performs a comprehensive audit and refactor of all authenticated dashboard routes to ensure compliance with ReconAI Canonical Laws. The goal is to make the dashboard a true "state-of-business" board that tells users "what's happening" rather than "where to go".

## Core Principles Applied

1. **No Placeholders** - Zero hardcoded values, fake metrics, or placeholder content
2. **No Mock Data** - Unless explicitly labeled demo AND gated
3. **Fail-Closed** - null > 0, unknown > dash ("—")
4. **No Empty Widgets** - If no data, section doesn't render
5. **Truth-First** - Dashboard tells "what's happening", not "where to go"

## Files Modified

### GovCon Routes (Hardcoded Zeros Removed)

| File                                              | Issue                                           | Fix                                                   |
| ------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| `src/app/(dashboard)/govcon/contracts/page.tsx`   | Hardcoded "0" values, fake summaries            | Removed fake summary panels, single honest EmptyState |
| `src/app/(dashboard)/govcon/timekeeping/page.tsx` | Fake weekly grid with "0h", hardcoded summaries | Removed fake grid/summaries, single honest EmptyState |
| `src/app/(dashboard)/govcon/indirects/page.tsx`   | Hardcoded "$0" values, fake progress bars       | Removed fake rate summaries, kept only FAR reference  |

### Settings Route (Hardcoded Values Removed)

| File                                    | Issue                                     | Fix                                                     |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------- |
| `src/app/(dashboard)/settings/page.tsx` | Hardcoded "1.0.0", "28-30", always "Good" | Now reads from env vars, shows actual API health status |

## Changes in Detail

### 1. GovCon Contracts Page

**Before:**

```tsx
<span className="text-lg font-semibold">0</span>  // Active Contracts
<span className="text-lg font-semibold">$0</span> // Total Value
<span className="text-lg font-semibold">$0</span> // Funded
<span className="text-lg font-semibold">$0</span> // Billed to Date
```

**After:**

- Removed all fake summary panels
- Single EmptyState with honest message
- STATUS.NOT_CONFIGURED as subtitle
- Links to related pages for context

### 2. GovCon Timekeeping Page

**Before:**

```tsx
// Fake weekly grid with hardcoded dates
{DAYS_OF_WEEK.map((day, idx) => (
  <div key={day} className="p-3 min-h-[120px] opacity-50">
    <p className="text-sm font-medium">{15 + idx}</p>
    <p className="text-lg font-semibold text-muted-foreground">0h</p>
  </div>
))}
// Plus hardcoded hour summaries
<span className="text-lg font-semibold">0</span> // Total Hours
<span className="text-lg font-semibold">0</span> // Billable
```

**After:**

- Removed fake weekly grid
- Removed all hour summaries
- Single EmptyState explaining contract dependency
- PolicyBanner retained (static educational content)

### 3. GovCon Indirects Page

**Before:**

```tsx
<span className="text-lg font-semibold">0</span>   // Total Pools
<span className="text-lg font-semibold">$0</span>  // Indirect Costs
<span className="text-lg font-semibold">$0</span>  // Allowable
<span className="text-lg font-semibold">$0</span>  // Unallowable
// Plus fake progress bar with w-0
```

**After:**

- Removed all fake rate summaries
- Removed fake progress bars
- Kept FAR Reference panel (static educational content)
- Single EmptyState with honest status

### 4. Settings Page System Info

**Before:**

```tsx
<span className="font-medium">1.0.0</span>       // Hardcoded version
<span className="font-medium">28–30</span>       // Hardcoded build
<StatusChip variant="ok">Good</StatusChip>       // Always shows "Good"
```

**After:**

```tsx
{
  process.env.NEXT_PUBLIC_APP_VERSION ?? "—";
} // Reads from env
{
  process.env.NEXT_PUBLIC_BUILD_ID ?? "—";
} // Reads from env
{
  auditAvailable ? "Connected" : "Unavailable";
} // Actual health check
```

## Canonical Laws Compliance

### ✅ What This Prevents

1. **False confidence** - No fake metrics suggesting system health
2. **Misleading zeros** - Zero implies "verified zero", not "unknown"
3. **Placeholder fatigue** - Users learn to ignore "coming soon" patterns
4. **Silent failures** - Errors are explicit, not hidden behind fake UIs

### ✅ What This Enables

1. **Truth-first dashboard** - Shows only what the system actually knows
2. **Honest empty states** - Clear messaging about what's needed
3. **Fail-closed behavior** - Unknown state is surfaced, not hidden
4. **Actionable links** - Navigation to configure missing features

## Verification Checklist

- [x] No hardcoded zeros in GovCon routes
- [x] No hardcoded version/build numbers in Settings
- [x] API health shows actual status, not always "Good"
- [x] TypeScript compilation passes
- [x] No fake progress bars or grids
- [x] All empty states use STATUS constants
- [x] No "coming soon" disabled buttons

## Anti-Patterns Removed

```tsx
// BAD: Hardcoded zeros suggesting verified empty state
<span className="text-lg font-semibold">0</span>

// BAD: Disabled buttons with "coming soon"
<Button disabled title="Export coming soon">Export</Button>

// BAD: Fake progress bars
<div className="h-full w-0 bg-primary rounded-full" />

// BAD: Always-positive health status
<StatusChip variant="ok">Good</StatusChip>
```

## Agent Sequence Status

1. [x] Apply Agent - Changes applied
2. [ ] QA Agent - Test with backend unavailable
3. [ ] Performance Agent - Verify no extra fetches
4. [ ] Security Agent - Auth verification
5. [ ] Laws Audit Agent - Final compliance check
