# Design

## Context

`Loans.balanceAt` calculates fines for active and returned loans. `Members.get` computes suspension by calling back into the fine provider, so looking up a member through `get` inside fine calculation would recurse. Member tiers are set at registration and the current API has no tier changes. See the proposal for motivation.

## Goals / Non-Goals

**Goals:** Select the correct cap without recursive balance lookups; preserve current public loan and member APIs.

**Non-Goals:** Add tier changes, alter the suspension threshold, or change payment and clock semantics.

## Decisions

- Capture the member's tier or derived fine cap as private loan metadata at checkout, and retain it when the loan is returned. Apply it individually in `balanceAt` before summing fines. The tier is immutable under the existing API, so this matches the member's tier for the life of each loan. This avoids calling `Members.get` from the fine provider. An alternative is a separate raw tier lookup in `Members`, but that expands its API for this calculation.
- Keep the public `Loan` snapshot unchanged; the cap is an internal implementation detail. Continue to subtract payments from the total and derive suspension from the resulting balance.

## Risks / Trade-offs

- [Future tier changes could make checkout-time tier stale] → If tier mutation is added later, specify its effect on existing loans and revisit the stored metadata.
- [A single premium loan cannot exceed the 500-cent fine suspension threshold, but multiple loans can] → Test both cases and preserve the existing strictly-greater-than threshold.

## Migration Plan

All state is in memory and instances are recreated on deployment; no persistent data migration is needed. Roll back by restoring the previous code and restarting instances, subject to the service's existing in-memory state loss on restart.
