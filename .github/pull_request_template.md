## Goal

<!-- What is the user-visible outcome? -->

## Scope

<!-- Pages/routes/components touched -->

## Constraints (Do Not Change)

<!-- List anything that must remain exactly as-is -->

## Acceptance Criteria

- [ ]
- [ ]

## Risk Level

- [ ] Low (copy/SEO/minor UI)
- [ ] Medium (layout changes, new components, refactors)
- [ ] High (auth, banking, payments, security, data access)

## Contract Changes

<!-- If you modified /api/core/state, /api/cfo/*, or /api/intelligence/*, check these boxes -->

### CORE State Contract

- [ ] Did `/api/core/state` contract change? If yes:
  - [ ] Updated `tests/fixtures/core-state-factory.ts` to match new schema
  - [ ] Updated `SYNC_CONTRACT_VERSION` if breaking change
  - [ ] All tests still pass with `assertValidCoreState()`
  - [ ] Coordinated with backend team on schema changes

### CFO Contract

- [ ] Did `/api/cfo/*` contract change? If yes:
  - [ ] Updated `tests/fixtures/cfo-state-factory.ts` to match new schema
  - [ ] Updated `SUPPORTED_CFO_VERSIONS` if breaking change
  - [ ] All tests still pass with `assertValidCfoState()`
  - [ ] Coordinated with backend team on schema changes
  - [ ] Updated `VALID_CFO_LIFECYCLE_STATUSES` if enum changed

### Intelligence Contract

- [ ] Did `/api/intelligence/*` contract change? If yes:
  - [ ] Updated `tests/fixtures/intelligence-state-factory.ts` to match new schema
  - [ ] Updated `SUPPORTED_INTELLIGENCE_VERSIONS` if breaking change
  - [ ] All tests still pass with `assertValidIntelligenceState()`
  - [ ] Coordinated with backend team on schema changes
  - [ ] Updated `VALID_INTELLIGENCE_LIFECYCLE_STATUSES` if enum changed

## Testing

<!-- How was this verified? -->

- [ ] CI passed
- [ ] Contract enforcement checks passed
- [ ] Preview reviewed on mobile + desktop
- [ ] No layout regressions

## Notes

<!-- Anything the reviewer should know -->
