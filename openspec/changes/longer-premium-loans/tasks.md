# Tasks

## 1. Premium loan duration

- [x] 1.1 Change the shared premium duration in `src/loans.ts` to 35 days; update checkout and renewal tier tests to verify 35 fixed days for premium and 14 for standard using controlled clocks.
- [x] 1.2 Update the premium overdue active-loan-limit fixture in `test/loans.test.ts` to be after the new due date; verify the limit and return behavior still pass.
- [x] 1.3 Add premium integration coverage for fine accrual and due-soon/overdue notifications relative to the 35-day due timestamp, including that the former 28-day date does not trigger them; run the affected Vitest tests.
- [x] 1.4 Verify the implementation preserves a previously recorded 28-day due timestamp until successful renewal, and that renewal uses 35 days; because state is in-memory and there is no import API, document the code-path reasoning or use a suitable test seam without adding a public migration API.

## 2. Integration verification

- [x] 2.1 Run `npm test` and `npm run typecheck` and confirm both pass.
