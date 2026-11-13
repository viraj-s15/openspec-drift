# Tasks

## 1. Outbox and loan scans

- [x] 1.1 Add notification types and a private outbox to `Loans`, exposing detached snapshots; verify message fields, ordering, and mutation isolation with Vitest.
- [x] 1.2 Implement UTC calendar-date scanning of active loans and reject invalid dates without mutation; test exact boundaries, returned loans, missed days, and no lending-state changes.
- [x] 1.3 Deduplicate by individual loan, notice type, and due timestamp; test repeated and out-of-order scans, renewal, and subsequent loans of the same copy.
- [x] 1.4 Document the scan and outbox API, UTC date convention, caller scheduling, and in-memory lifetime in `README.md`; verify the examples match the implemented API.

## 2. Hold-ready notices

- [x] 2.1 Emit ready notices from successful hold allocation and test return allocations, expiration reassignment, and no-allocation cases.
- [x] 2.2 Test expiration allocations during an operation that subsequently fails, plus outbox snapshot isolation and ordering across notice types; document hold-ready emission in `README.md`.

## 3. Integration

- [x] 3.1 Run `npm test` and `npm run typecheck` and verify existing lending behavior and notification tests pass.
