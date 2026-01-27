# Phase 9B — Audit Export v2 UI

## Overview

This phase implements a manual, admin-only UI for generating and downloading Audit Export v2 bundles that include statements, asset snapshots, and liabilities.

## UI Location

The `AuditExportV2Panel` component is placed in the **Evidence** page (`/govcon/evidence`) alongside other audit evidence panels from Phase 8.

**File Location:** `src/components/govcon/audit/AuditExportV2Panel.tsx`

## Features

### Controls
- **RBAC**: Admin / org:admin only (renders `null` for non-admins)
- **Generate Button**: Manual "Generate Audit Export (v2)" action
- **Section Toggles** (checkboxes):
  - Statements
  - Assets
  - Liabilities
  - Default: all checked
- **Confirmation Step**: Required before generation

### States
1. `idle` — Initial state, section toggles visible
2. `building` — Export generation in progress
3. `ready` — Export complete, download available
4. `error` — Error state with message and request_id

### Success Display
- Generated timestamp
- Included sections list
- Export ID
- Advisory copy: "This export contains historical financial evidence. ReconAI does not modify source data."
- Manual "Download Export" button (no auto-download)

### Error Display
- Human-readable error message
- `request_id` surfaced for audit provenance
- "Try Again" button to reset

## Files Created

| File | Purpose |
|------|---------|
| `src/components/govcon/audit/AuditExportV2Panel.tsx` | Main UI component |
| `src/app/api/exports/audit-package-v2/route.ts` | Generate endpoint |
| `src/app/api/exports/audit-package-v2/download/route.ts` | Download endpoint |
| `src/lib/api/auditExportsV2.ts` | Thin API wrapper |
| `src/types/audit.ts` | TypeScript types |

## Files Modified

| File | Change |
|------|--------|
| `src/app/(dashboard)/govcon/evidence/page.tsx` | Added `AuditExportV2Panel` |

## Manual Test Steps

### Pre-requisites
1. User must have `admin` or `org:admin` role in Clerk metadata
2. Backend endpoint `POST /api/audit-exports/v2` must be available

### Test: RBAC Enforcement
1. Log in as a non-admin user
2. Navigate to `/govcon/evidence`
3. **Expected**: AuditExportV2Panel is NOT visible (renders null)
4. Log in as an admin user
5. Navigate to `/govcon/evidence`
6. **Expected**: AuditExportV2Panel IS visible

### Test: Generation Flow
1. Log in as admin
2. Navigate to `/govcon/evidence`
3. Verify all section checkboxes are checked by default
4. Click "Generate Audit Export (v2)"
5. **Expected**: Confirmation dialog appears
6. Click "Confirm Generate"
7. **Expected**: State changes to "building" with spinner
8. Wait for completion
9. **Expected**: State changes to "ready" with:
   - Generated timestamp
   - Included sections
   - Export ID
   - Advisory copy

### Test: Download Flow
1. Complete generation test above
2. Click "Download Export" button
3. **Expected**: Browser file download dialog appears
4. **Expected**: ZIP file with deterministic filename is downloaded
5. **Expected**: No auto-download occurred

### Test: Error Handling
1. Disconnect network or configure backend to return error
2. Attempt generation
3. **Expected**: Error state shows:
   - Human-readable message
   - `request_id` visible
4. Click "Try Again"
5. **Expected**: Returns to idle state

### Test: Section Toggle Validation
1. Uncheck all section checkboxes
2. **Expected**: Generate button is disabled
3. Check at least one section
4. **Expected**: Generate button is enabled

## Verification Checklist

- [ ] RBAC hides component for non-admins (renders null)
- [ ] Manual-only generation (no auto-run)
- [ ] No polling / no background fetch
- [ ] Streaming download requires explicit user click
- [ ] Deterministic filename honored from response headers
- [ ] Errors surface `request_id`
- [ ] Advisory copy present: "This export contains historical financial evidence..."
- [ ] No UI redesign
- [ ] No new navigation or sidebar items
- [ ] No modifications to existing AuditExportButton (Phase 7)

## Rollback Steps

1. Remove `AuditExportV2Panel` import and usage from `src/app/(dashboard)/govcon/evidence/page.tsx`
2. Delete the following files:
   - `src/components/govcon/audit/AuditExportV2Panel.tsx`
   - `src/app/api/exports/audit-package-v2/route.ts`
   - `src/app/api/exports/audit-package-v2/download/route.ts`
   - `src/lib/api/auditExportsV2.ts`
   - `src/types/audit.ts`
   - `README_PHASE_9B.md`
3. Run `npx tsc --noEmit` to verify no type errors
4. Verify Evidence page loads without errors

## Architecture Notes

- **No Polling**: State changes only from user action or request completion
- **No Auto-download**: User must explicitly click download
- **RBAC Fail-closed**: Non-admin users see nothing (no disabled buttons or hints)
- **Request Tracking**: All errors include `request_id` for audit provenance
- **Streaming Response**: ZIP downloads use browser streaming via blob
