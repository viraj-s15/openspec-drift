# Tasks

## 1. Catalog copy lookup

- [x] 1.1 Add detached `Catalog.getCopy` lookup by ID; verify known, unknown, and mutation-isolation cases in `test/catalog.test.ts`.

## 2. Loan lifecycle

- [x] 2.1 Implement in-memory `Loans` checkout and return using shared catalog and members; verify successful checkout, return, re-checkout, unknown IDs, unavailable copies, repeated returns, and unchanged state on failure in `test/loans.test.ts`.
- [x] 2.2 Enforce suspension and the five-active-loan limit; test both tiers, overdue loans, returning to free capacity, and returns after suspension.
- [x] 2.3 Inject the clock and calculate fixed 14- and 28-day durations; test controlled instants, invalid clock values, and isolation of clock and returned mutable dates.
- [x] 2.4 Guard against duplicate active loans after manual catalog status changes and document the shared-instance/direct-status boundary; verify the guard and return behavior in tests.

## 3. Integration checks

- [x] 3.1 Run `npm test` and `npm run typecheck` and resolve any regressions across catalog, members, and loans.
