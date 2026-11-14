# Tasks

## 1. Renewal calculation and regression coverage

- [x] 1.1 Update `Loans.renew` in `src/loans.ts` to add the member's normal period to the stored due timestamp, retaining the clock-based eligibility checks, overflow validation before loan mutation, and existing renewal limits; verify with the renewal tests.
- [x] 1.2 Update `test/renewals.test.ts` to verify early renewals for both tiers, two consecutive early renewals, the due-instant boundary, and detached snapshots with the new due dates; run `npx vitest run test/renewals.test.ts`.
- [x] 1.3 Adapt the overflow test so the renewal instant plus the period is representable but the existing due date plus the period is not, and verify rejection preserves the due date and allowance; run the renewal tests.
- [x] 1.4 Verify renewed due dates drive fine accrual and notification timing appropriately using focused tests, and retain coverage for hold restrictions, overdue rejection, and the renewal limit.

## 2. Integration verification

- [x] 2.1 Run `npm test` and `npm run typecheck` and resolve any regressions caused by the changed due-date calculation.
