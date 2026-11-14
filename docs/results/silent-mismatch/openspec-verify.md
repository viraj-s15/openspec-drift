# OpenSpec verify on silent-mismatch

Model: openai/gpt-6.1-sol:low

## longer-premium-loans

## Verification Report: `longer-premium-loans`

**The change is not ready to archive.** Implementation and tests agree on a **42-day** premium loan period, while the proposal, spec, design, and tasks require **35 days**.

### Summary

| Dimension | Status |
|---|---|
| Completeness | 5/5 tasks marked complete; both modified requirements have implementations, but their premium-duration clauses are incorrect |
| Correctness | Both requirements partially satisfied; 3/5 scenarios match the spec, while tier checkout and renewal scenarios assert 42 instead of 35 days |
| Coherence | Shared constant, stored-date preservation, and fixed-day arithmetic follow the design; the selected duration contradicts it. Code patterns are consistent |

### CRITICAL

None. Both requirement implementations exist, and no tasks remain unchecked. The implemented behavior nevertheless diverges from the specification, as detailed below.

### WARNING

1. **Premium checkout and renewal use 42 days instead of 35.**  
   `src/loans.ts:12` defines `PREMIUM_LOAN_DAYS = 42`. Both checkout and renewal consume this constant, so both modified requirements are violated for premium members. Standard loans retain the required 14-day period.

   **Recommendation:** Set the shared constant to 35, as required by `openspec/changes/longer-premium-loans/specs/loans/spec.md` and the design.

2. **Tests enforce the incorrect policy rather than the specified scenarios.**
   - `test/loans.test.ts:26`: premium checkout expects 42 days.
   - `test/renewals.test.ts:22`: premium renewal expects 42 days.
   - `test/renewals.test.ts:45`: renewal of a previous-policy loan at day 28 expects day 70; the required result is day **63**.
   - `test/fines.test.ts:32`: premium fine timing is tested around day 42 rather than day 35.
   - `test/notifications.test.ts:19`: notices are tested against a February 12 due date rather than **February 5** for the controlled January 1 checkout.

   **Recommendation:** Update these assertions and related fixtures to the 35-day policy. Cover fine accrual at day 36 and notification scheduling around the 35-day due date, retaining the checks that the former 28-day date does not trigger them.

### Confirmed behavior

- Existing recorded 28-day due timestamps remain unchanged before successful renewal, including after rejected renewal attempts.
- Successful renewal calculates its due date from the injectable renewal clock, not the previous due timestamp.
- Two-renewal limits and allowance reset on a new checkout have implementation and test coverage.
- Fines and notifications consume recorded due timestamps rather than independently calculating premium periods.
- Fixed 24-hour arithmetic and clock/overflow handling are retained.

### Validation

- `npm test -- --no-cache`: **81 tests passed across 7 files**
- `npm run typecheck`: **passed**

These results establish internal consistency, **not compliance with the 35-day specification**.

### Final assessment

**No critical issues. Two warnings require attention before treating this change as spec-compliant.** All verification checks ran; none were skipped. The completed checklist and passing tests conceal a consistent 42-versus-35-day mismatch.

No files were edited, and no git commands were run.

