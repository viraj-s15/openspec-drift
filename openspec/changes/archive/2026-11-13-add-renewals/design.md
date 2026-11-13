# Design

## Context

`Loans` owns active loans and ISBN-keyed holds, uses a monotonic-clamped injectable clock, and reconciles expired holds for lending operations. Member tier determines a fixed checkout period. Returned loan snapshots contain cloned dates. See the proposal and loans delta for behavior.

## Goals / Non-Goals

**Goals:** Keep renewal state scoped to each loan and reuse existing clock, tier, and hold semantics.

**Non-Goals:** Change checkout eligibility, fine policies, hold allocation rules, or add persistence or HTTP.

## Decisions

- Add `renew(memberId, copyId): Loan` to `Loans`, storing a renewal count on each internal active loan initialized at checkout. This avoids a separate copy-keyed counter that could survive a return and recheckout. Keep the count internal to preserve the existing public `Loan` shape.
- Capture one clamped clock reading; reconcile hold expirations at that instant, then check ownership, due time, count, and other members' active holds for the ISBN. Both waiting and ready holds count after reconciliation; the borrower's own hold does not. This reuses existing queue behavior rather than inventing a separate reservation interpretation.
- Use the borrower's current tier and the same fixed-day calculation as checkout, setting the due date from the captured instant. At the exact due instant the loan is not yet overdue. A renewal before the due date can therefore leave the due date unchanged or move it earlier if the applicable period has changed; do not add time to the old due date.
- Compute and validate the new date before mutating the loan; increment the count only on success and return a detached snapshot. Use existing error conventions. Rejected operations may reconcile expired holds but cannot alter loan or copy state otherwise. Renewal does not add suspension or active-loan-limit restrictions beyond the specified rules.

## Risks / Trade-offs

- [Hold reconciliation can mutate reservations on a rejected request] → Specify this exception and test expiry/reassignment before eligibility evaluation.
- [Clock overflow or invalid values could corrupt dates] → Apply the existing clock and date validation before loan mutation; test rejection.
- [Early renewal may not lengthen the prior due date] → Use the explicitly requested renewal-date calculation and test it.

## Migration Plan

The service is in-memory, so newly constructed instances start with no loans and need no data migration. Rollback removes the renewal API and its in-memory count; no persistent data conversion is required.
