# Proposal

## Why

Members currently must return a book even when they need more time and nobody else is waiting. Renewals allow limited additional borrowing while protecting other members' holds.

## What Changes

- Allow a borrower to renew an active loan at most twice, setting its due date to the renewal instant plus the member's normal loan period.
- Reject renewals for overdue loans or books with another member's active hold, and preserve loan state on rejection.
- Expose renewal through the in-memory lending service and cover its boundaries with Vitest.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `loans`: Add renewal eligibility, limits, and due-date calculation.

## Impact

`src/loans.ts` and loan tests in `test/` will change. Renewal uses the existing member tiers, injectable clock, catalog ISBN mapping, and holds queue; no HTTP or new dependency is needed.
