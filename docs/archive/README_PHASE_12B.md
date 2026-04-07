# Phase 12B — GovCon Packet Presets

## Overview

Phase 12B adds an **admin-only UI** for generating GovCon packet presets (starting with SF 1408 pre-award) using the backend preset endpoint. This is **guided selection + packaging**, not compliance validation.

## Where the GovCon Preset Panel Appears

The `GovConPresetPanel` component is placed on the **Evidence** page (`/govcon/evidence`) adjacent to the Audit Export v2 panel.

**File Location:** `src/components/govcon/audit/GovConPresetPanel.tsx`

## How to Generate an SF 1408 Pre-Award Packet

1. Log in as an admin user (`admin` or `org:admin` role)
2. Navigate to `/govcon/evidence`
3. Locate the "GovCon Packet Presets" panel
4. Select **SF 1408 — Pre-Award** from the preset dropdown
5. Set the **Statement period** date range (from / to)
6. Select an **Asset snapshot** (default: "Use latest available")
   - Liabilities are auto-included (no toggle)
7. Click **Generate Packet**
8. Review the confirmation dialog (shows preset name, dates, liabilities note)
9. Click **Confirm Generate**
10. Wait for generation to complete
11. Review the success state (preset name, timestamp, sections, export ID)
12. Click **Download Packet** to download the ZIP bundle

## Available Presets

### SF 1408 — Pre-Award

Generates a pre-award evidence bundle aligned to SF 1408.

**Options:**

- **Statement period** (from / to dates): Date range for included bank statements
- **Asset snapshot**: "Use latest available" or explicit snapshot ID
- **Liabilities**: Auto-included (no toggle)

**Helper text:**

> "Generates a pre-award evidence bundle aligned to SF 1408. ReconAI does not certify compliance."

## Features

### Controls

- **RBAC**: Admin / org:admin only (renders `null` for non-admins)
- **Preset Selector**: Dropdown with available presets
- **Preset-specific Options**: Conditional fields based on selected preset
- **Generate Packet Button**: Manual trigger
- **Confirmation Step**: Required before generation

### States

1. `idle` — Preset selection + options visible
2. `building` — Packet generation in progress
3. `ready` — Packet complete, download available
4. `error` — Error state with message and request_id

### Success Display

- Preset name
- Generated timestamp
- Included sections list
- Export ID
- GovCon/DCAA Mapping badge (if present)
- Advisory copy: "This packet bundles historical financial evidence. ReconAI does not interpret or certify compliance."
- Manual "Download Packet" button (no auto-download)

### Error Display

- Human-readable error message
- `request_id` surfaced for audit provenance
- "Try Again" button to reset

## Backend Endpoint

```http
POST /api/audit-exports/v2/presets
```

**Request body:**

```json
{
  "organization_id": "string",
  "preset": "sf1408_pre_award",
  "options": {
    "statement_period": {
      "from": "2025-01-27",
      "to": "2026-01-27"
    },
    "asset_snapshot_id": "string (optional, omitted for latest)"
  }
}
```

**Response:**

```json
{
  "ok": true,
  "export_id": "string",
  "generated_at": "ISO 8601",
  "preset": "sf1408_pre_award",
  "sections": ["statements", "assets", "liabilities"],
  "download_url": "string | null",
  "govcon_mapping": { "..." },
  "integrity": { "..." },
  "request_id": "uuid"
}
```

## Files Created (Phase 12B)

| File                                                    | Purpose                          |
| ------------------------------------------------------- | -------------------------------- |
| `src/components/govcon/audit/GovConPresetPanel.tsx`     | Main UI component                |
| `src/app/api/exports/audit-package-v2/presets/route.ts` | Preset generation proxy endpoint |
| `src/lib/api/auditExportPresets.ts`                     | Thin API wrapper                 |
| `README_PHASE_12B.md`                                   | This documentation               |

## Files Modified (Phase 12B)

| File                                           | Change                                                                                                                        |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/types/audit.ts`                           | Added `GovConPreset`, `GovConPresetOption`, `GovConPresetRequest`, `GovConPresetGenerateResponse`, `GovConPresetResult` types |
| `src/app/(dashboard)/govcon/evidence/page.tsx` | Added `GovConPresetPanel` import and usage                                                                                    |

## RBAC

- Visible only to `admin` or `org:admin` roles
- Non-admin users see nothing (component renders `null`)
- RBAC fail-closed: no disabled buttons, no hints

## Error Handling

- Human-readable error messages
- All errors include `request_id`
- No retries
- No toast notifications

## Verification Checklist

- [ ] Preset panel visible only to admin / org-admin
- [ ] Manual-only generation
- [ ] Confirmation required before submit
- [ ] No polling or background activity
- [ ] Streaming download only after user click
- [ ] Errors surface `request_id`
- [ ] Advisory copy present (non-certifying)
- [ ] No UI redesign or new navigation
- [ ] Preset selector renders with SF 1408 option
- [ ] SF 1408 options show date pickers and asset snapshot selector
- [ ] Liabilities auto-included note visible
- [ ] No compliance scoring or certification claims

## Manual Test Steps

### Pre-requisites

1. User must have `admin` or `org:admin` role in Clerk metadata
2. Backend endpoint `POST /api/audit-exports/v2/presets` must be available

### Test: RBAC Enforcement

1. Log in as a non-admin user
2. Navigate to `/govcon/evidence`
3. **Expected**: GovConPresetPanel is NOT visible
4. Log in as an admin user
5. **Expected**: GovConPresetPanel IS visible

### Test: SF 1408 Generation Flow

1. Log in as admin
2. Navigate to `/govcon/evidence`
3. Verify preset dropdown shows "SF 1408 — Pre-Award"
4. Set statement period from/to dates
5. Leave asset snapshot as "Use latest available"
6. Click "Generate Packet"
7. **Expected**: Confirmation dialog appears with preset name, dates, and auto-included liabilities note
8. Click "Confirm Generate"
9. **Expected**: State changes to "building" with spinner
10. Wait for completion
11. **Expected**: State changes to "ready" with preset name, timestamp, sections, export ID

### Test: Download Flow

1. Complete generation test above
2. Click "Download Packet" button
3. **Expected**: Browser file download dialog appears
4. **Expected**: No auto-download occurred

### Test: Error Handling

1. Disconnect network or configure backend to return error
2. Attempt generation
3. **Expected**: Error state shows human-readable message and request_id
4. Click "Try Again"
5. **Expected**: Returns to idle state

## Rollback Steps

1. Remove `GovConPresetPanel` import and usage from `src/app/(dashboard)/govcon/evidence/page.tsx`
2. Delete the following files:
   - `src/components/govcon/audit/GovConPresetPanel.tsx`
   - `src/app/api/exports/audit-package-v2/presets/route.ts`
   - `src/lib/api/auditExportPresets.ts`
   - `README_PHASE_12B.md`
3. Remove Phase 12B types from `src/types/audit.ts`
4. Run `npx tsc --noEmit` to verify no type errors
5. Verify Evidence page loads without errors

## Architecture Notes

- **No Polling**: State changes only from user action or request completion
- **No Auto-download**: User must explicitly click download
- **RBAC Fail-closed**: Non-admin users see nothing
- **Request Tracking**: All errors include `request_id`
- **Reuses Download Endpoint**: Downloads go through existing `/api/exports/audit-package-v2/download`
- **Extensible Presets**: New presets can be added to `PRESET_OPTIONS` array with conditional option rendering
