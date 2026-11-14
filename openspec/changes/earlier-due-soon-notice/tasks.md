# Tasks

## 1. Due-soon notification timing

- [x] 1.1 Change the due-soon UTC day offset in `src/notifications.ts` from -2 to -3; verify an active loan emits its notice exactly three UTC calendar days before its due date.
- [x] 1.2 Update `test/notifications.test.ts` scan dates, including the timezone-crossing, returned-loan, deduplication, renewal, reloan, and hold-ready ordering cases; add assertions that the former two-day date emits no due-soon notice, even when the three-day scan was missed, and run the notification tests.
- [x] 1.3 Run the full Vitest suite and verify overdue timing, invalid-date handling, outbox snapshots, and hold-ready behavior remain unchanged.
