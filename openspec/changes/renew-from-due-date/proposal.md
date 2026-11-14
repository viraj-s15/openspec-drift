# Proposal

## Why

Renewing early currently replaces the remaining loan time instead of adding a full loan period. Extending from the existing due date preserves that time for borrowers.

## What Changes

- **BREAKING**: Calculate a successful renewal's due timestamp by adding the member's normal loan period to the current due timestamp, rather than to the renewal instant.
- Preserve renewal eligibility, the two-renewal limit, clock-based overdue checks, and existing hold and loan behavior.
- Update renewal tests to cover early and consecutive renewals, both member tiers, and date overflow.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `loans`: Change the due timestamp calculation for successful renewals.

## Impact

- `src/loans.ts` renewal calculation and `test/renewals.test.ts` expectations and coverage.
- Callers of `Loans.renew` observe later due dates when renewing early; downstream fine and notification timing follows the renewed due date.
- No HTTP interface, new dependency, or data migration is required for this in-memory service.
