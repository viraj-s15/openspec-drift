# Baseline

The baseline copies an established OpenSpec repo, with several spec domains and a history of archived changes. Drift tools must work at that size, not only on a repo with one spec.

The app is an in-memory library-lending service in TypeScript with Vitest tests. It has no HTTP layer, so each diff shows only domain logic.

Pi builds the baseline through eight OpenSpec changes. Each goes through propose, apply and archive, and gets one commit:

| # | Change | Domain(s) | Key rules |
| --- | --- | --- | --- |
| 1 | `add-catalog` | catalog | Books have copies. Search by title or author. |
| 2 | `add-members` | members | Standard and premium tiers. A member can be suspended. |
| 3 | `add-loans` | loans | Loan lasts 14 days, or 28 for premium. At most 5 active loans. Suspended members cannot borrow. |
| 4 | `add-fines` | fines, members | Late fee $0.25 a day, capped at $10.00 per loan. Unpaid fines over $5.00 suspend the member. |
| 5 | `add-holds` | holds | Members queue for a book with no free copy. A ready hold expires after 3 days. |
| 6 | `add-renewals` | loans | A loan renews up to 2 times. No renewal when someone holds the book. |
| 7 | `add-notifications` | notifications | Due-soon, overdue and hold-ready messages go to an in-memory outbox. |
| 8 | `premium-fine-cap` | fines | Premium members' cap drops to $5.00 per loan. |

Changes 4, 6 and 8 modify specs that already exist, so the archive holds MODIFIED deltas, not only ADDED ones.
