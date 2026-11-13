# Proposal

## Why

Borrowers currently receive no reminder of approaching or missed due dates, and members must inspect holds to discover that a copy is ready. An in-memory outbox makes these events observable without introducing external messaging infrastructure.

## What Changes

- Add an inspectable, in-memory notification outbox for loan reminders and ready holds.
- Scan active loans for notices on the specified calendar date, deduplicating each notice for a loan and its current due date.
- Emit a hold-ready notice whenever a waiting hold is allocated, including reassignment after expiration.
- Keep delivery, scheduling, and persistence outside the service.

## Capabilities

### New Capabilities

- `notifications`: In-memory notices for loan due dates and hold allocations, including scan timing and deduplication.

### Modified Capabilities

None.

## Impact

`src/loans.ts` owns active loans and hold allocation and will expose the scan and outbox, with Vitest coverage in `test/`. Existing constructor calls and lending operations remain compatible. No HTTP, external service, or new dependency is needed.
