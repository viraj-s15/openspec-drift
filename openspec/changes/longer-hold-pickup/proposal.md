# Proposal

## Why

A three-day pickup window can be too short for members to collect a reserved book. Extending it to five days gives members more time before their hold expires.

## What Changes

- Reserve a copy for exactly 120 hours after a hold becomes ready, instead of 72 hours, both on return and on reassignment after expiration.
- Preserve expiration at the deadline, lazy processing, queue order, and hold-ready notification behavior; reported expiration timestamps reflect the longer window.
- Out of scope: changes to loan periods, notification policy, and retroactive adjustment of already-stored deadlines.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `holds`: Extend the ready-hold pickup window from 72 to 120 hours for initial allocations and reassignments.

## Impact

- `src/holds.ts` calculates reservation deadlines for allocations and reassignments.
- `test/holds.test.ts` and `test/notifications.test.ts` contain deadline-dependent expectations. The public hold and notification shapes remain unchanged, but their expiration values and reservation availability change.
- State is in memory; existing stored deadlines are not recalculated, and new allocations receive the new period.
