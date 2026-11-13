# Tasks

## 1. Renewal implementation and tests

- [x] 1.1 Add a per-loan internal renewal count and `renew(memberId, copyId)` with tier-based due dates and detached results; verify both tiers, early renewal, two successes, third rejection, and reset on recheckout in Vitest.
- [x] 1.2 Enforce active-loan ownership and overdue checks without altering loan state on failure; verify invalid IDs, wrong borrower, returned loan, exact due instant and just-after boundary in Vitest.
- [x] 1.3 Reconcile hold expiration and reject other members' waiting or ready ISBN-wide holds; verify own holds, different-copy holds, expired holds and reassignment in Vitest.
- [x] 1.4 Preserve clock validation, monotonic time, detached dates and failure atomicity; verify invalid/overflow clocks, snapshot mutation and renewal allowance after rejection in Vitest. Document the renewal API in README and check it matches the implementation.

## 2. Integration checks

- [x] 2.1 Run `npm test` and `npm run typecheck` to verify the full lending, holds, fines, and TypeScript suites remain compatible.
