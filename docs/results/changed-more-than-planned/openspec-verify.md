# OpenSpec verify on changed-more-than-planned

Model: openai/gpt-6.1-sol:low

## renew-from-due-date

## Verification Report: `renew-from-due-date`

**The renewal behavior matches the delta spec, but the implementation contains an unrelated fine-cap divergence.** Design adherence could not be verified because `design.md` is absent.

### Summary

| Dimension | Status |
|---|---|
| Completeness | 5/5 tasks marked complete; 1/1 modified requirement implemented |
| Correctness | 1/1 requirement mapped; all 3 specified scenarios covered by code and tests; 1 additional spec divergence found |
| Coherence | Renewal code follows existing patterns. **Design Adherence: Not verified** (`design.md` absent) |

### Verified behavior

- **Renewal calculation:** `src/loans.ts:132` adds 14 or 28 fixed 24-hour days to the stored due timestamp, rather than the renewal instant.
- **Eligibility and limits:** Clock-based overdue checks and the two-renewal limit remain in place at `src/loans.ts:129–130`. Overflow validation precedes due-date mutation and allowance consumption.
- **Scenario coverage:**
  - Both member tiers: `test/renewals.test.ts:22`.
  - Consecutive early renewals, third-renewal rejection, and reset on recheckout: `test/renewals.test.ts:165`.
- **Additional regression coverage:** Tests cover the exact due instant, overdue rejection, hold restrictions, detached snapshots, overflow rejection, renewed fine timing (`test/renewals.test.ts:66`), and notification timing/deduplication (`test/notifications.test.ts:64`).

### Issues by priority

#### CRITICAL

None found.

#### WARNING

**1. Standard-member fine cap diverges from the existing spec and exceeds the planned scope.**

- `src/fines.ts:7` sets `STANDARD_FINE_CAP_CENTS` to **800**.
- `openspec/specs/fines/spec.md:10` requires **1,000 cents** for standard members.
- Tests reinforce the divergent behavior: `test/fines.test.ts:29` expects 800 cents after 41 overdue days, and `test/fines.test.ts:40–42` expects 1,600 cents across two capped standard loans.
- This change’s proposal scopes the behavioral change to renewal due-date calculation, not fine caps.

**Recommendation:** Restore the standard cap to 1,000 cents and adjust the affected fine tests. If 800 cents is intentional, document and specify that separately rather than treating it as part of this renewal change.

#### SUGGESTION

None.

### Verification limits

- **Design Adherence — Not verified:** `openspec/changes/renew-from-due-date/design.md` is absent. This is a verification limit, not a newly imposed archive prerequisite.
- Tests and typechecking were **not executed** to preserve the strict no-file-changes constraint. Coverage findings are based on source inspection; checked task boxes do not independently prove successful execution.
- No git commands were run, so the fine-cap mismatch is confirmed in the current code, but its provenance cannot be attributed to this change.

### Final assessment

**No critical issues found in the checks that ran. One warning to address. Design Adherence is not verified because the design artifact is absent.** The renewal implementation appears correct on static inspection, but this is not a fully verified archive-readiness result.

No files were changed, and no git commands were run.

