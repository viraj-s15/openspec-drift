# Design

## Context

`Loans` owns the active loan map and the hold queues. Its shared `allocate` method handles both returns and reassignment by `reconcile`; expiration processing can commit even if a later operation rejects. Loan due timestamps can change on renewal. See the proposal and notifications spec for scope.

## Goals / Non-Goals

**Goals:** Keep notification state local to a `Loans` instance, preserve existing APIs, and make calendar and identity rules deterministic.

**Non-Goals:** External delivery, persistence, automatic scheduling, catch-up scanning, or global coordination across instances.

## Decisions

- Add `scanNotifications(date: Date): void` and `getOutbox()` to `Loans`, backed by private in-memory state and a discriminated notification type. Return cloned records and dates, as with existing loan and hold snapshots. This avoids a separate service needing access to private lending state.
- Interpret dates as UTC calendar days, ignoring time of day for eligibility. Reject invalid dates before mutation. Use only currently active loans and the explicit scan date; do not reconcile holds, advance the lending clock, or infer missed days. This is deterministic across hosts and keeps scanning side-effect-free apart from notices.
- Store notice history per loan object, keyed by notice type and numeric due timestamp. A renewal keeps the loan object but changes the key; a new checkout creates a new object even for the same copy. This prevents a copy ID or recipient from conflating distinct loans. Per-instance history is sufficient for the in-memory lifetime.
- Emit hold-ready notices from the successful waiting-to-ready allocation path after reserving the copy. The same path handles expiration reassignment, including when the enclosing operation later fails. Do not emit for an available-copy release. This avoids duplicating logic in each calling operation.

## Risks / Trade-offs

- [UTC dates may differ from a member's local calendar] → Document the UTC contract and test boundary instants.
- [An exact-day scan can miss notices if not called daily] → Document that the caller schedules scans and there is no backfill.
- [Outbox and deduplication history disappear with the instance] → This is intentional for an in-memory service; durable delivery is out of scope.
- [Existing reconciliation commits before some errors] → Keep notice emission coupled to the committed allocation, not overall operation success.
