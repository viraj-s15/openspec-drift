# Proposal

## Why

A member can currently accumulate an unlimited number of active holds across books. A per-member limit makes the hold queue more equitable and bounds each member's outstanding reservations.

## What Changes

- Limit each member to three active holds across all books, counting both waiting and ready holds.
- Reject a new hold when that member already has three active holds after normal expiration processing; expiration and successful pickup free capacity.
- Preserve existing hold eligibility, queue ordering, and expiration behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `holds`: Restrict the number of active holds per member and define how the limit interacts with the hold lifecycle.

## Impact

The in-memory lending API's `placeHold` operation gains a new rejection case. Changes are expected in `src/holds.ts` and `test/holds.test.ts`; no HTTP or persistence changes are involved.
