# Tasks

## 1. Catalog and hold queue

- [x] 1.1 Add reserved copy status and copy-to-book lookup in `src/catalog.ts`; verify catalog tests cover status, lookup, and detached snapshots.
- [x] 1.2 Add `placeHold` and `getHolds` to `src/loans.ts`, including per-book FIFO, validation, duplicate prevention, and detached snapshots; verify Vitest cases for multiple books, invalid requests, and mutations.

## 2. Allocation and expiry

- [x] 2.1 Allocate returned copies to waiting holds in FIFO order and consume a member's ready hold on eligible checkout; test multiple copies, other-member rejection, ineligibility, returns, and fines.
- [x] 2.2 Reconcile expirations on checkout, return, and hold operations using the existing clock; test before and at the 72-hour boundary, successor and no-successor cases, simultaneous expirations, invalid clocks, and time clamping.
- [x] 2.3 Protect loan and reservation ownership against direct catalog status edits; test attempted unauthorized checkout and hold placement with manually changed statuses.
- [x] 2.4 Document hold APIs, lazy expiry, and reserved status in `README.md`; verify examples match the implemented API.

## 3. Integration

- [x] 3.1 Run the full Vitest suite and TypeScript type checking; verify existing catalog, member, loan, and fine behavior remains intact.
