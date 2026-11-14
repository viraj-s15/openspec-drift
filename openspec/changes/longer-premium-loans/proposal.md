# Proposal

## Why

Premium members currently have 28 days to borrow a copy. Extending their loan period to 35 days gives them an additional week.

## What Changes

- Set premium checkout and renewal periods to 35 fixed 24-hour days; standard periods remain 14 days.
- Preserve existing due timestamps until a loan is successfully renewed; do not retroactively extend active loans.
- Keep fine, notification, and renewal eligibility rules unchanged, with their timing based on the applicable due timestamp.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `loans`: Change the premium checkout and renewal duration from 28 to 35 days.

## Impact

The in-memory `Loans` service and its checkout and renewal tests are affected. Fine accrual and due-date notifications depend on loan due timestamps; their rules and public interfaces remain unchanged. No external dependencies or HTTP interfaces are involved.
