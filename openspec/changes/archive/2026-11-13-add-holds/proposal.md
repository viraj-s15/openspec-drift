# Proposal

## Why

Members cannot currently claim a place in line when all copies of a book are unavailable. Holds make returned copies available fairly to waiting members.

## What Changes

- Allow members to place one active hold per book when no copy is available, and inspect the queue and ready reservations.
- Allocate returned copies to waiting members in first-come order; reserve each ready copy for its member for three 24-hour days.
- Expire and reassign reservations lazily on lending and hold operations, and allow the reserved member to check out the copy under existing eligibility rules.
- Expose reserved copy status in the catalog. Direct catalog status changes remain a low-level operation and cannot override lending ownership.

## Capabilities

### New Capabilities
- `holds`: Per-book queues, reservations, expiration, and hold inspection.

### Modified Capabilities
- `loans`: Returns allocate to holds and checkout respects reservations.
- `catalog`: Copy availability includes reserved copies.

## Impact

Changes affect the in-memory `Loans` and `Catalog` APIs, copy status type, and Vitest coverage. The additional copy status can require callers with exhaustive status handling to update. No HTTP service, persistence, notifications, or background scheduler is introduced.
