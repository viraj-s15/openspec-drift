# Design

## Context

`Loans` uses one premium duration constant for both checkout and renewal. Stored due timestamps are also read by fines and notification scans. See the proposal for motivation.

## Goals / Non-Goals

**Goals:** Keep checkout and renewal consistent and preserve existing due-date-dependent rules.

**Non-Goals:** Change fine rates, notice schedules, loan eligibility, or the public API; migrate persisted data (the service is in-memory).

## Decisions

- Change the shared premium duration constant to 35 rather than add separate checkout and renewal policies. Both operations already share it, so this avoids divergent periods.
- Do not rewrite existing loan records. Their recorded due dates continue to govern overdue checks, fines, and notices; a successful future renewal uses the new duration. Retroactive extension would change commitments and downstream timing unexpectedly. In a normal restart, in-memory state does not survive deployment.
- Retain fixed 24-hour arithmetic and existing clock and overflow handling rather than introduce calendar-day calculations.

## Risks / Trade-offs

- [Tests or consumers assume 28 days] → Update tier-specific assertions and overdue fixtures; cover fines and notifications against the new due date.
- [Existing active loans have differing durations] → Preserve their recorded due dates and apply the new policy on renewal; do not infer dates from checkout time.
