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

<!-- If you modified /api/core/state, check these boxes -->

- [ ] Did `/api/core/state` contract change? If yes:
  - [ ] Updated `tests/fixtures/core-state-factory.ts` to match new schema
  - [ ] Updated `SYNC_CONTRACT_VERSION` if breaking change
  - [ ] All tests still pass with `assertValidCoreState()`
  - [ ] Coordinated with backend team on schema changes

## Testing

<!-- How was this verified? -->

- [ ] CI passed
- [ ] Contract enforcement checks passed
- [ ] Preview reviewed on mobile + desktop
- [ ] No layout regressions

## Notes

<!-- Anything the reviewer should know -->
