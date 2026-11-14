# Tasks

## 1. Enforce and test the hold limit

- [x] 1.1 In `src/holds.ts`, count the member's waiting and ready holds across the existing queues before adding a hold; reject at three or more without mutating state. Verify with Vitest cases for accepting the third, rejecting the fourth, mixed statuses, independent members, and unchanged queues/copies on rejection.
- [x] 1.2 Add lifecycle tests in `test/holds.test.ts` verifying allocation still counts, successful pickup frees a slot, and a hold expiring at its deadline is reconciled before a new placement; run the hold tests.
- [x] 1.3 Run the full Vitest suite to verify existing eligibility, queue order, expiration, checkout, and notification behavior remains intact.
