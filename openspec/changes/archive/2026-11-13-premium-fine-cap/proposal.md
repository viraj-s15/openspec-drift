# Proposal

## Why

Premium members should receive a lower maximum fine for each overdue loan, while standard members retain the existing limit.

## What Changes

- Cap each premium member's loan fine at 500 cents instead of 1,000 cents.
- Preserve the 1,000-cent standard cap and all other fine, payment, and suspension rules.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `fines`: Apply a per-loan fine cap based on the borrower's membership tier.

## Impact

- Fine calculations in `src/loans.ts` and coverage in `test/fines.test.ts`.
- Member tiers already exist and cannot be changed through the current registry API; no new public API or dependency is required.
- Member balances and fine-based suspension reflect the revised premium fines. The suspension threshold itself is unchanged.
