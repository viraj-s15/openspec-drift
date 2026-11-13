# Design

## Context

`Loans` owns active loans, fines, and a monotonic injectable clock; `Catalog` owns book/copy status and returns snapshots. The catalog's public status setter can diverge from loan ownership. See the proposal for motivation.

## Goals / Non-Goals

**Goals:** Keep hold and loan ownership coordinated in the existing in-memory service and preserve fine and eligibility behavior.

**Non-Goals:** Persistence, notifications, cancellation, autonomous timers, and new member eligibility rules for placing holds.

## Decisions

- Store ordered holds in `Loans`, keyed by ISBN, with waiting/ready state and reserved copy ID and deadline. Provide `placeHold(memberId, isbn)` and `getHolds(isbn)` returning detached snapshots. A member can hold a book even when suspended or at their loan limit; eligibility is checked at checkout. This keeps queues in the same owner as loan transactions, unlike a separate uncoordinated service.
- Add `reserved` to catalog copy status and an efficient copy-to-ISBN lookup. Reservation ownership remains authoritative in `Loans`, so direct catalog status edits must not permit another checkout or allow a hold against a copy already reserved or on an active loan. Direct setters are low-level, not a supported way to advance queues.
- Read the existing clock once per checkout, return, or hold operation, clamp as today, and reconcile expired ready holds first. Assign successor reservations from processing time, not the missed deadline, so lazy processing gives each successor a full pickup window. Catalog-only queries may show stale status until such an operation. No scheduler is needed. Process simultaneous expirations deterministically by deadline then original hold order.
- Remove a ready hold only on successful checkout or expiration; unsuccessful checkout retains it. Returning a copy reserves it if a waiting hold exists, otherwise makes it available. Ready holds do not block later waiting holds from receiving other returned copies.
- Validate clocks and representable deadlines before mutating related state. Expiration reconciliation is allowed to commit even if the requested operation subsequently fails; invalid clock values leave state untouched. Keep fine calculation and active-loan limits unchanged.

## Risks / Trade-offs

- [Lazy expiry makes catalog-only reads stale] → Document and test that lending or hold operations reconcile first.
- [Public status changes can conflict with ownership] → Treat loans and reservations as authoritative for lending and test manual tampering.
- [New `reserved` union member affects exhaustive consumers] → Document the API addition and retain other status behavior.

## Migration Plan

No data migration is required for in-memory state. Update callers that exhaustively handle copy statuses. Rollback requires discarding in-memory holds and deploying the previous version.
