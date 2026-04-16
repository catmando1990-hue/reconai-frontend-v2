# GovCon Audit Components — Plaid exception

These four panels intentionally call `/api/plaid/*` endpoints directly
instead of routing through `/api/govcon/*`:

- `PlaidStatementsEvidence.tsx`  → `/api/plaid/statements/list`, `/api/plaid/statements/download`
- `LiabilitiesPanel.tsx`         → `/api/plaid/liabilities/get`
- `NetWorthSnapshotPanel.tsx`    → `/api/plaid/assets/report/{create,get,remove}`
- `InvestmentsPanel.tsx`         → `/api/plaid/investments/{holdings/get,transactions/get,refresh}`

## Why this is an exception to the cross-module isolation rule

The rest of the app enforces strict module isolation: each module's pages
only call its own `/api/{module}/*` endpoints. GovCon's connection
management (`/govcon/connections`) is fully isolated and uses
`/api/govcon/connections` exclusively.

These audit panels are different. DCAA audit packages require comprehensive
financial visibility across **all** of an organization's bank-linked data —
not just accounts the user has tagged as "GovCon." Restricting them to
GovCon-tier connections would defeat the auditor's purpose: detecting
unreported accounts is part of the audit.

The backend's `app/plaid/FROZEN.md` formalizes this. Its **KEY LAW** is:

> Plaid products do NOT map 1:1 to screens.
> They map to capabilities, then feed multiple modules.

GovCon is explicitly listed as a consumer of `identity`, `income_verification`,
`assets`, and `liabilities` Plaid capabilities. These four panels are the
implementation of that listing.

## When to revisit

If the backend ever adds `/api/govcon/plaid/{statements,liabilities,assets,investments}`
proxy endpoints that pass through the same data with audit logging, migrate
these panels to use them. Until then the direct `/api/plaid/*` calls are the
sanctioned pattern.

## What this exception does NOT cover

- `/govcon/connections/page.jsx` — must use `/api/govcon/connections` only.
- Any new GovCon page outside `audit/` — must use `/api/govcon/*` only.
- Anything outside `src/components/govcon/audit/` — the cross-module lint rule
  in `eslint.config.mjs` will flag it.
