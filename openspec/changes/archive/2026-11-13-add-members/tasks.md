# Tasks

## 1. Member registry

- [x] 1.1 Add the member types and in-memory registration in `src/members.ts`; add Vitest cases for both tiers, initially active members, duplicate IDs, and invalid runtime tiers without mutation.
- [x] 1.2 Implement lookup and registration-ordered listing with detached snapshots; add Vitest cases for missing IDs, empty lists, all statuses, ordering, and mutation isolation.
- [x] 1.3 Implement suspension and reinstatement; add Vitest cases for transitions, preserved fields, repeated operations, and unknown IDs without mutation.

## 2. Integration verification

- [x] 2.1 Run `npm test` and `npm run typecheck` and confirm the member and existing catalog tests pass.
