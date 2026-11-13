# Proposal

## Why

The lending service needs a catalog of books and physical copies before it can support lending or discovery.

## What Changes

- Add in-memory book records identified by ISBN, with title, author, and one or more physical copies.
- Track each copy as available or on loan.
- Search titles and authors using case-insensitive substring matching.

## Capabilities

### New Capabilities

- `catalog`: Book records, physical copy availability, and search.

### Modified Capabilities

None.

## Impact

Adds a TypeScript domain API in `src/` and Vitest coverage in `test/`. No persistence or HTTP layer is introduced.
