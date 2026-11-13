# Tasks

## 1. Loan history and fine accounting

- [x] 1.1 Retain distinct returned loans with validated return timestamps and a nondecreasing service clock; add Vitest coverage for repeated borrowing, invalid clocks, and backward clock readings.
- [x] 1.2 Implement integer-cent fine calculation and member balance reads; test due-time and day boundaries, the per-loan cap, open and returned loans, multiple loans, and unknown members.
- [x] 1.3 Implement member-level payments with validation and atomic failure; test partial/full payments, later accrual, invalid amounts, overpayments, and unknown members.

## 2. Suspension and lending integration

- [x] 2.1 Combine manual and dynamically calculated fine suspension in `Members`, retaining detached snapshots and existing APIs; test lookup/list, manual holds, reinstatement, and the 500/501-cent threshold.
- [x] 2.2 Wire the shared fine provider into `Loans`, enforce current suspension at checkout, and preserve returns for suspended members; test time-driven suspension, repayment, and duplicate-provider rejection.
- [x] 2.3 Update the existing overdue loan-limit test to avoid conflicting fine eligibility and document the single shared-instance and payment APIs; verify the revised tests and documentation match the implementation.

## 3. Integration verification

- [x] 3.1 Run the complete Vitest suite and TypeScript type-check; confirm existing catalog, member, and lending behavior still passes alongside fines scenarios.
