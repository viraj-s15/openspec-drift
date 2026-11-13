# Proposal

## Why

The lending service has a catalog but no way to identify or manage its members. A member registry establishes the basic records and status needed for future lending features.

## What Changes

- Register members with a unique ID, name, and standard or premium tier.
- Look up and list members, including their current suspension status.
- Suspend and reinstate members without changing their identity or tier.
- Keep the registry in memory and independent of catalog and lending operations; lending restrictions are out of scope.

## Capabilities

### New Capabilities

- `members`: Registration, retrieval, listing, and suspension status management for members.

### Modified Capabilities

None.

## Impact

Adds a small TypeScript member registry under `src/` and Vitest coverage under `test/`. No HTTP interface, persistence, or new dependencies are needed.
