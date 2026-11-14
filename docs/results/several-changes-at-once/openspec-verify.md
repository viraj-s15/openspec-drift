# OpenSpec verify on several-changes-at-once

Model: openai/gpt-6.1-sol:low

## earlier-due-soon-notice

## Verification Report: `earlier-due-soon-notice`

### Summary

| Dimension | Status |
|---|---|
| Completeness | 3/3 tasks marked complete; 2/2 modified requirements implemented |
| Correctness | 2/2 requirements mapped to implementation; all 8 scenarios covered by code and test assertions, assessed statically |
| Coherence | Code follows existing project patterns. **Design Adherence not verified:** `design.md` is absent |

### Implementation evidence

- **Three-day UTC timing:** `src/notifications.ts:5` sets the due-soon offset to `-3`. UTC calendar-day comparisons and exact-day eligibility are implemented at `src/notifications.ts:25–29`; overdue remains `+1`.
- **Active loans only; no lending-state changes:** `src/loans.ts:36–38` passes only active loans to the notification scanner, without reconciliation or service-clock updates.
- **Invalid-date safety:** `src/notifications.ts:23–24` validates the date before changing the outbox or deduplication history.
- **Deduplication and renewal:** `src/notifications.ts:30–35` keys history by loan identity, notice type, and current due timestamp. Renewal updates that timestamp at `src/loans.ts:135`; checkout creates a new loan object at `src/loans.ts:101`.

### Scenario coverage

All eight specified scenarios have corresponding assertions in `test/notifications.test.ts`:

| Scenario | Test evidence |
|---|---|
| Exact calendar days | Lines 18–44, including a timezone-crossing scan |
| Former notice day, including a missed three-day scan | Lines 46–56 |
| Overdue and other days; no backfill or state changes | Lines 58–74 |
| Returned loan | Lines 76–89 |
| Invalid scan date | Lines 76–89 |
| Repeated and out-of-order scans | Lines 91–109 |
| Renewal changes due date | Lines 100–105 |
| Copy borrowed again | Lines 106–109 |

Additional assertions cover detached outbox snapshots and hold-ready notification behavior.

### Issues by priority

**CRITICAL:** None found.

**WARNING:** None found.

**SUGGESTION:** None.

### Verification limits

- **Design Adherence — Not verified:** No `openspec/changes/earlier-due-soon-notice/design.md` was available. This is a verification limit, not a recommendation to invent an optional design artifact.
- Tests were inspected but **not executed**, to avoid potential cache or generated-file writes. The task checkboxes record completed test runs; this report does not independently confirm those runs.

### Final assessment

**No critical issues found in the checks that ran. Design Adherence was not verified because the design artifact is absent.** Static inspection supports the requested timing change and all eight scenarios, but this is not a fully verified archive-readiness verdict.

No files were changed, and no git commands were run.

## longer-hold-pickup

## Verification Report: `longer-hold-pickup`

**The implementation uses a seven-day pickup window, but the change requires five days.** The completed task checklist does not match the code or tests.

### Summary

| Dimension | Status |
|---|---|
| Completeness | 4/4 tasks marked complete; both MODIFIED requirements have implementations, but neither satisfies the required 120-hour duration |
| Correctness | 0/2 requirements fully conform; FIFO allocation and expiration mechanics are present, but deadlines and deadline-dependent tests use 168 hours |
| Coherence | Code follows existing shared-calculation and notification patterns. **Design Adherence not verified:** `design.md` is absent |

### CRITICAL — Must fix before archive

1. **Both requirements use the wrong pickup duration.**  
   `src/holds.ts:4` defines `HOLD_PICKUP_PERIOD_MS = 168 * 3_600_000`, rather than 120 hours.
   - Initial allocation uses this duration through `expiryAt()` at `src/holds.ts:68–69` and `src/holds.ts:81`.
   - Reassignment uses the same allocation path at `src/holds.ts:90–100`.

   Consequently, a hold remains reserved at its required five-day deadline, and a reassigned hold receives seven days instead of five.

   **Recommendation:** Change the shared duration to 120 hours. Retain the existing processing-time basis for reassignment.

### WARNING — Should fix

1. **Hold tests assert seven-day behavior instead of the specified five-day scenarios.**  
   `test/holds.test.ts:69–88` checks initial expiration at 168 hours, the instant before 168 hours, and reassignment through 336 hours. The delayed-processing test also expects another 168 hours at `test/holds.test.ts:99`.

   **Recommendation:** Assert initial expiration at 120 hours, retention at 72 hours and immediately before 120 hours, reassignment exactly at 120 hours, release at the subsequent deadline, and delayed reassignment at processing time plus 120 hours. Update related FIFO and clock expectations at `test/holds.test.ts:108–134`.

2. **Notification tests encode seven-day expiration timestamps.**  
   In `test/notifications.test.ts`, the hold-ready scenarios expect January 8 after allocation on January 1, then January 15 after reassignment. `src/notifications.ts:39–44` copies the hold’s expiration into the notice, so the incorrect duration also reaches members.

   **Recommendation:** Update the scenarios to expect January 6 for initial expiration and January 11 for reassignment processed on January 6, preserving the `23:30:00Z` time.

### Other verification evidence

- Multiple-copy FIFO allocation is covered by `test/holds.test.ts:32–55`.
- Expiration uses an inclusive deadline comparison at `src/holds.ts:92`.
- Reassignment starts from processing time at `src/holds.ts:99`.
- Release without a waiting member is implemented at `src/holds.ts:76–79`.
- Lending and hold operations invoke reconciliation in `src/loans.ts`; catalog reads remain separate.
- No significant code-pattern deviations were found.
- **Test execution was not performed:** this was a static, read-only verification; passing test/typecheck results were not independently confirmed.

### Final assessment

**1 critical issue and 2 warnings found. Fix before archiving.** Design Adherence was not verified because `design.md` is absent; this report does not make creating that document a new archive prerequisite.

No files were changed, and no git commands were run.

