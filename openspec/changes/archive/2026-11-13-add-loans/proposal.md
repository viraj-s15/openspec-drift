# Proposal

## Why

The catalog tracks copy status and the member registry tracks eligibility, but neither records lending or enforces borrowing rules. The service needs a small in-memory loan workflow to connect them.

## What Changes

- Check out an identified available copy to an eligible member, recording checkout and due timestamps using an injectable clock.
- Enforce tier-based durations, a five-active-loan limit, and suspension restrictions.
- Return active loans and restore copy availability; reject invalid operations without partial changes.
- Add deterministic Vitest coverage. Renewals, fines, reservations, persistence, and HTTP are out of scope.

## Capabilities

### New Capabilities
- `loans`: Checkout, eligibility, due dates, and return of physical copies.

### Modified Capabilities

None. Existing catalog and member requirements remain in force.

## Impact

Adds a TypeScript loan service under `src/` and tests under `test/`, integrating with `Catalog` and `Members`. The catalog needs a copy lookup by ID; existing public status updates remain available. No new runtime dependencies or external services are expected.
