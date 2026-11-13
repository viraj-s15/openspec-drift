# Design

## Context

The project has no existing domain implementation or specifications. See the proposal and catalog spec for scope.

## Goals / Non-Goals

**Goals:** Provide a small in-memory API that future lending logic can call.

**Non-Goals:** Persistence, ISBN validation, member or loan management, and HTTP.

## Decisions

- Use a `Catalog` class backed by a map keyed by ISBN. Reject duplicates rather than silently replacing records.
- Accept caller-provided globally unique copy IDs and track each copy's status. This provides stable identifiers without a dependency or hidden ID generation.
- Return snapshots of records rather than mutable internal references, protecting catalog invariants. Search scans the in-memory collection; an index is unnecessary at this scale.
- Match using JavaScript lowercase substring comparison. Empty search returns all records.

## Risks / Trade-offs

- [In-memory data disappears on process exit] → Persistence is outside this change.
- [Linear scans cost more as the catalog grows] → Keep the implementation simple until scale warrants indexing.
