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

---

# Phase 10B — GovCon / DCAA Mapping Badge

## Overview

Phase 10B adds a visual indicator when an Audit Export v2 includes GovCon/DCAA mapping metadata. This is **labeling only** — no compliance scoring, certification, or approval is implied.

## What the Badge Indicates

When present, the badge displays:

**"GovCon / DCAA Mapping Included"**

With tooltip (hover over info icon):

> "This audit export includes static references to applicable DCAA and FAR sections. ReconAI does not certify compliance."

### What This Means

- The export bundle contains static reference mappings to DCAA and FAR sections
- These are informational references only
- The mappings are included in the export's `manifest.json.govcon_mapping` field

### What This Does NOT Mean

- **NOT** a compliance certification
- **NOT** an approval or endorsement
- **NOT** a guarantee of audit readiness
- **NOT** a validation of data accuracy
- ReconAI does not certify compliance with any regulation

## Badge Location

The badge appears in the "Export Ready" success state, positioned inline with other metadata:
- Generated timestamp
- Included sections list
- Export ID
- **GovCon / DCAA Mapping badge** (when present)

## Styling

- **Neutral**: Uses `border-border`, `bg-muted/50`, `text-muted-foreground`
- **No success semantics**: No green, no checkmarks, no shields
- **Informational only**: Info icon for tooltip, not approval icon

## RBAC

The badge inherits RBAC from the parent `AuditExportV2Panel`:
- Visible only to `admin` or `org:admin` roles
- Non-admin users see nothing (component renders `null`)

## Error Handling

- If `govcon_mapping` is **missing**: Badge does not render (silent)
- If `govcon_mapping` is **malformed**: Badge does not render (silent)
- If `govcon_mapping.standard` is **falsy**: Badge does not render (silent)
- No errors logged, no user-facing error messages

## Files Modified (Phase 10B)

| File | Change |
|------|--------|
| `src/types/audit.ts` | Added `GovconMappingMetadata` type, `hasGovconMapping` to result |
| `src/app/api/exports/audit-package-v2/route.ts` | Pass through `govcon_mapping` from backend |
| `src/components/govcon/audit/AuditExportV2Panel.tsx` | Added badge rendering logic |
| `README_PHASE_9B.md` | Added Phase 10B documentation |

## How to Verify

### Test: Badge Appears When Mapping Present

1. Generate an Audit Export v2 where backend returns `govcon_mapping` in response
2. Observe the "Export Ready" state
3. **Expected**: Badge "GovCon / DCAA Mapping Included" appears below Export ID
4. Hover over the info icon
5. **Expected**: Tooltip displays exact text: "This audit export includes static references to applicable DCAA and FAR sections. ReconAI does not certify compliance."

### Test: Badge Hidden When Mapping Absent

1. Generate an Audit Export v2 where backend does NOT return `govcon_mapping`
2. Observe the "Export Ready" state
3. **Expected**: No GovCon/DCAA badge visible
4. **Expected**: No errors in console

### Test: RBAC Enforcement

1. Log in as non-admin user
2. Navigate to `/govcon/evidence`
3. **Expected**: Entire AuditExportV2Panel is hidden (including any potential badge)

## Verification Checklist (Phase 10B)

- [ ] Badge renders only when `govcon_mapping` exists and is valid
- [ ] Tooltip text matches exactly: "This audit export includes static references to applicable DCAA and FAR sections. ReconAI does not certify compliance."
- [ ] Neutral styling (no success/error semantics, no green)
- [ ] RBAC hides badge for non-admins (inherited from parent)
- [ ] Missing/malformed data fails silently (no errors, no badge)
- [ ] No new navigation or UI redesign
- [ ] No icons implying approval (no checkmarks, shields, stars)

---

# Phase 11B — Export Signature Verification Helper

## Overview

Phase 11B adds a **read-only helper UI** that displays export signing metadata so admins can manually verify integrity offline. This does **NOT** verify signatures in-browser. It exposes metadata and instructions only.

## Data Source

- `manifest.json.integrity`
- `signatures/signature.json`

Returned as part of the Audit Export v2 response metadata. If absent, nothing renders.

## What the Panel Displays

When `integrity` metadata is present in the export response:

- **Integrity status:** "Signed" (label badge)
- **Algorithm:** From `signature.algorithm` (e.g., ed25519)
- **Key ID:** Copyable value from `signature.key_id`
- **Signed at (UTC):** From `signature.signed_at`
- **Hash algorithm:** From `hash_chain.algorithm` (e.g., sha256) with "(hash chain)" suffix
- **Chain root:** Copyable value from `hash_chain.root`

### Offline Verification Instructions

Displayed verbatim as inline text:

> "This export includes a cryptographic signature. To verify integrity, recompute the SHA-256 hash chain over the exported files in order, then verify the Ed25519 signature using the included public key. ReconAI does not perform verification on your behalf."

No code execution. No CLI helpers. No buttons.

## What This Does NOT Do

- **NOT** in-browser signature verification
- **NOT** compliance certification or approval
- **NOT** automated integrity checking
- **NOT** a guarantee of data accuracy
- ReconAI does not perform verification on your behalf

## Panel Location

Within the Audit Export v2 "Export Ready" state, below the success metadata block:
- Generated timestamp
- Included sections list
- Export ID
- GovCon/DCAA badge (when present)
- **Integrity Metadata panel** (when present)

## Styling

- **Neutral**: Uses `border-border`, `bg-muted/30`, `text-muted-foreground`
- **No success semantics**: No green, no checkmarks, no shields
- **Informational only**: Info icon, not approval icon
- **Copyable fields**: Chain root and Key ID have copy-to-clipboard buttons

## RBAC

Inherits from parent `AuditExportV2Panel`:
- Visible only to `admin` or `org:admin` roles
- Non-admin users see nothing (component renders `null`)

## Error Handling

- If `integrity` is **missing**: Panel does not render (silent)
- If `integrity` is **malformed** or partial: Panel does not render (silent)
- If clipboard copy fails: Silent failure
- No errors logged, no user-facing error messages

## Files Modified (Phase 11B)

| File | Change |
|------|--------|
| `src/types/audit.ts` | Added `ExportIntegrityMetadata` type, `integrity?` to result and response |
| `src/app/api/exports/audit-package-v2/route.ts` | Pass through `integrity` from backend |
| `src/lib/api/auditExportsV2.ts` | Include `integrity` in result mapping |
| `src/components/govcon/audit/AuditExportV2Panel.tsx` | Added `IntegrityMetadataPanel` and `CopyableField` components |
| `README_PHASE_9B.md` | Added Phase 11B documentation |

## How to Verify

### Test: Panel Appears When Integrity Present

1. Generate an Audit Export v2 where backend returns `integrity` in response
2. Observe the "Export Ready" state
3. **Expected**: Integrity Metadata panel appears below the success block
4. **Expected**: "Signed" badge visible
5. **Expected**: Algorithm, Key ID, Signed at, Hash algorithm, Chain root displayed
6. **Expected**: Offline verification instructions text block visible

### Test: Copyable Fields

1. In the integrity panel, click the copy icon next to "Chain root"
2. **Expected**: Value copied to clipboard, icon briefly changes to checkmark
3. Repeat for "Key ID"

### Test: Panel Hidden When Integrity Absent

1. Generate an Audit Export v2 where backend does NOT return `integrity`
2. Observe the "Export Ready" state
3. **Expected**: No Integrity Metadata panel visible
4. **Expected**: No errors in console

### Test: RBAC Enforcement

1. Log in as non-admin user
2. Navigate to `/govcon/evidence`
3. **Expected**: Entire AuditExportV2Panel is hidden (including any potential integrity panel)

## Verification Checklist (Phase 11B)

- [ ] Panel renders only when `integrity` metadata exists and has `hash_chain` or `signature`
- [ ] Admin-only visibility (inherited from parent)
- [ ] Neutral, informational tone — no success/error semantics
- [ ] No in-browser verification logic
- [ ] No errors/logging on missing data
- [ ] Copyable fields for chain root and key ID
- [ ] Offline verification instructions match exact text
- [ ] No UI redesign
- [ ] No new navigation
- [ ] No icons implying approval (no checkmarks, shields, stars in metadata)

