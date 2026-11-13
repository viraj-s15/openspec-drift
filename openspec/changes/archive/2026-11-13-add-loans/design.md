# Design

## Context

`Catalog` stores globally unique copy IDs and exposes independent status updates, but only looks up books by ISBN. `Members.get` returns a detached snapshot with current tier and suspension. Both are synchronous and in memory. See the proposal for motivation.

## Goals / Non-Goals

**Goals:** Integrate the existing modules with a small, deterministic lending API while preserving their existing interfaces.

**Non-Goals:** Coordinate concurrent processes or persist data across service instances or restarts.

## Decisions

- Add `Catalog.getCopy(copyId)` returning a detached copy or `undefined`; avoid scanning search results or exposing internal references. Keep `setCopyStatus` unchanged for compatibility.
- Introduce `Loans` in `src/loans.ts`, constructed with a shared catalog, member registry, and clock (`() => Date`, defaulting to the system clock). Provide `checkout(memberId, copyId)` returning a detached loan and `returnCopy(copyId)` ending the active loan. A map keyed by copy ID holds active loans; returned loans need not be retained. Count a member's active loans by scanning this small map rather than maintaining another index.
- At checkout validate the member, suspension, count, copy status, and absence of an active loan before mutating either store. Read the clock once, copy its timestamp, and calculate due time in milliseconds (14 or 28 times 24 hours). Validate the clock result before mutation; do not retain or return shared mutable `Date` objects. Update catalog status before adding the loan. On return, validate the active loan and update catalog before deleting it. Existing synchronous catalog operations throw before mutation for unknown copies, so rejected operations do not leave partial loan state.
- Keep loan ownership separate from copy availability: the catalog's existing public status setter can change availability outside the loan service. Checkout checks both status and the active-loan map, preventing duplicate loans even if a caller marks an active copy available. Return restores availability for a tracked loan regardless of an intervening manual status change. Callers should use one shared `Loans` instance and route lending through it; replacing the existing setter or introducing a global coordinator would break compatibility or add disproportionate complexity.

## Risks / Trade-offs

- [Direct catalog status updates or multiple `Loans` instances can make catalog state diverge from loan ownership] → Document the single-instance, lending-through-service boundary; the active-loan check prevents duplicate checkout within that instance. Cross-instance coordination is out of scope.
- [A mutable clock or returned date could alter stored timestamps] → Copy dates on input and output and test mutation isolation.

## Migration Plan

No persistent data migration is needed. Construct the service around the existing catalog and member instances; removing it rolls back the feature, with in-memory loan data lost on restart as usual.
