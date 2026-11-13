# Design

## Context

`Loans` currently retains only active loans, keyed by copy ID, and discards them at return. It owns an injectable clock. `Members` stores a single manual suspension boolean and returns detached snapshots. There is no persistence or background worker. See the proposal and delta specs for behavior.

## Goals / Non-Goals

**Goals:** Keep existing construction and method calls usable, make time-driven suspension observable without timers, and preserve manual suspension independently of fine status.

**Non-Goals:** Persistence, external payments, refunds, waivers, payment allocation to individual loans, or coordination between multiple service instances.

## Decisions

- Retain a separate history of individual returned loans with a captured return instant; keep active loans keyed by copy ID. Each checkout is a distinct loan even when a copy is reused. This preserves existing active-loan checks and supports a per-loan cap, unlike an aggregate-only balance.
- Compute total accrued cents from all of a member's loans, subtract cumulative accepted member payments, and calculate open loans at one captured current instant per operation. Completed 24-hour periods are rounded down. Returned loans use their fixed return instant. Reject invalid clock readings before mutation, including on return and payment. This avoids timer-based accrual and duplicate charging.
- Integrate a fine-balance provider with the shared `Members` and `Loans` instances so member lookup/listing and checkout calculate current fine suspension on demand. Preserve the existing `new Loans(catalog, members, clock?)` entry point and use the same injected clock for all fine reads. A single loans instance per members registry is supported, consistent with the existing shared-instance lending model; do not silently replace an existing provider. Calculated status is the OR of stored manual suspension and unpaid balance above 500 cents. Manual reinstate clears only the manual flag. This avoids stale status as time passes and avoids erasing manual holds.
- Expose balance and payment operations through the lending service; validate positive safe integer cents, a known member and no overpayment before changing cumulative payments. Track member-level payments rather than distributing them across loans, since the cap applies to gross accrual per loan. Take care that failed operations do not mutate state.

## Risks / Trade-offs

- [Lazy calculation scales with retained loans] → Accept linear scanning for this small in-memory service; no timers or cached balances can drift.
- [A clock that moves backward could make accepted payments exceed recalculated accrual] → Use nondecreasing observed time within a service instance for accrual and return timestamps; clamp earlier valid clock readings to the last successfully observed instant. Validate before advancing it, and never produce a negative balance.
- [Automatic suspension changes an existing overdue checkout test] → Update that test to separate active-loan capacity from fine eligibility, and add explicit threshold coverage.
- [Multiple lending instances can diverge] → Reject duplicate fine-provider registration against the same member registry and document the single shared instance constraint.

## Migration Plan

No durable data migration is needed. Introduce history and provider wiring together; restart loses in-memory state as before. Reverting code removes the feature and its in-memory balances.
