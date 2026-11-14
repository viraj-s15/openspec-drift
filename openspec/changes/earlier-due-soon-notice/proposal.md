# Proposal

## Why

Members need more time to act before a loan is due. Moving the due-soon notice one day earlier gives them three calendar days of notice.

## What Changes

- Emit due-soon notices exactly three UTC calendar days before the current due date instead of two.
- Keep exact-day scanning, overdue notices, deduplication, and all other notification behavior unchanged. Scans do not backfill a missed notice day.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `notifications`: Change the due-soon scan date, including eligibility after renewal.

## Impact

- `src/notifications.ts` and notification tests in `test/notifications.test.ts`.
- Observable notice timing changes for callers of the in-memory loan notification scan; message shape and APIs remain unchanged. No new dependencies.
