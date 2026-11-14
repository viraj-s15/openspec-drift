# Tasks

## 1. Extend hold pickup periods

- [x] 1.1 Update the shared pickup-period calculation in `src/holds.ts` to 120 hours; verify new allocations and reassignments use the same duration.
- [x] 1.2 Update and extend `test/holds.test.ts` to check the initial deadline, a hold remains ready at three days and just before five days, expiration exactly at five days, delayed reassignment from processing time, release without a waiting member, and existing FIFO and clock behavior; run the holds tests.
- [x] 1.3 Update deadline-dependent `test/notifications.test.ts` scenarios to verify hold-ready notices carry the correct five-day expiration on initial allocation and reassignment; run the notification tests.

## 2. Integration verification

- [x] 2.1 Run `npm test` and `npm run typecheck` and confirm both pass.
