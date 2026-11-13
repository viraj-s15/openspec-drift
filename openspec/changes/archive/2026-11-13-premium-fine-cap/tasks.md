# Tasks

## 1. Tier-aware fine calculation

- [x] 1.1 In `src/loans.ts`, retain private tier or cap metadata at checkout and on return, and apply the per-loan cap in `balanceAt` without changing public loan snapshots; verify premium boundary and standard cap behavior with Vitest tests in `test/fines.test.ts`.
- [x] 1.2 Add tests for premium returned loans, multiple independently capped loans, payments after reaching a cap, and fine-based suspension at and above 500 cents; verify they pass alongside the existing fine tests.

## 2. Integration verification

- [x] 2.1 Run `npm test` and `npm run typecheck` and confirm the full suite and TypeScript checks pass.
