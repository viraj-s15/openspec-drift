# Proposal

## Why

Overdue loans currently carry no financial consequence, and the service cannot collect outstanding fines or restrict borrowing based on them.

## What Changes

- Calculate overdue fines for open and returned loans at 25 cents per completed 24-hour day, capped at 1,000 cents per loan.
- Record payments in integer cents and expose each member's current unpaid balance.
- Automatically suspend borrowing above 500 cents and lift the fine-related suspension at or below 500 cents, while preserving independent manual suspensions.
- Retain returned-loan fine information and refresh time-dependent balances when they are observed or used for borrowing and payments.

## Capabilities

### New Capabilities
- `fines`: Overdue fine calculation, member balances, and payments.

### Modified Capabilities
- `members`: Combine automatic fine-related suspension with existing manual suspension controls.
- `loans`: Retain returned loans for fine calculation and check current fine eligibility at checkout.

## Impact

Changes affect the in-memory TypeScript services in `src/` and their Vitest tests in `test/`. Existing member and loan APIs should remain usable; time-dependent checkout eligibility changes. No HTTP, persistence, or external dependencies are introduced. The existing test that expects checkout after a very overdue return must be adjusted for the new suspension rule.
