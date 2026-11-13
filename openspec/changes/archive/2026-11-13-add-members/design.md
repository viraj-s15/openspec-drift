# Design

## Context

The existing `Catalog` owns in-memory maps, throws on invalid updates, returns `undefined` for missing lookups, and returns detached snapshots. The member registry is independent of the catalog; see the proposal and member spec for scope and behavior.

## Goals / Non-Goals

**Goals:** Keep a small TypeScript API consistent with the existing catalog and protect internal state from callers.

**Non-Goals:** Persistence, HTTP, lending eligibility, tier benefits, and integration with catalog operations.

## Decisions

- Add `src/members.ts` with a `Members` class, a `Member` interface, and a `MemberTier` union. Use a `Map<string, Member>` keyed by caller-supplied ID; its insertion order supplies list order. An array was considered but makes ID lookup and duplicate checks less direct.
- Provide `register(id, name, tier)`, `get(id)`, `list()`, `suspend(id)`, and `reinstate(id)`. Represent status with `suspended: boolean`, initially false; setting it to the requested value naturally makes repeated operations idempotent. A separate status enum would add no needed states.
- Reject duplicate IDs, unsupported runtime tier values, and unknown status updates with errors; return `undefined` for a missing lookup. No extra name or ID formatting restrictions are introduced, matching the catalog's handling of strings.
- Return fresh member objects for lookup and list, rather than exposing map values, matching catalog snapshot behavior.

## Risks / Trade-offs

- [In-memory records disappear with the instance] → This is intentional for the current service; persistence is outside this change.
- [TypeScript types do not enforce tier values at runtime] → Validate tiers on registration before mutating the map.
