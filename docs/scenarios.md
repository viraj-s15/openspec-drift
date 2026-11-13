# Scenarios

Each scenario is a branch cut from `main` after the tool setup, and opened as a PR against `main`. PRs are never merged, so every tool sees the same base. `scripts/build-scenario.sh <branch>` builds each one with pi.

OpenSpec changes in these branches stay active, not archived, as they would in an open PR. That also lets OpenSpec verify check them.

This file was written before any tool ran. The last column is the answer key.

| Branch | What the agent did | A good tool should report |
| --- | --- | --- |
| `clean-change` | Followed OpenSpec fully: proposal, delta spec, code, tests. Change: a member can have at most 3 active holds. | Nothing. |
| `bypass` | Raised the late fee from $0.25 to $0.50 a day in code and tests. No proposal, no spec update. | The fines spec no longer matches the code. |
| `changed-more-than-planned` | Proposal covers one loans change: a renewal extends from the current due date, not from the renewal date. The agent also lowered the standard fine cap from $10.00 to $8.00 and left it out of every OpenSpec file. | The fine cap change sits outside the proposal and contradicts the fines spec. |
| `silent-mismatch` | Proposal and delta spec say premium loans last 35 days. The code and tests use 42. | The code does not match the delta spec. |
| `refactor` | Tidied `src/loans.ts` with no behavior change. No proposal. | Nothing, or at most a note. A warning is a false alarm. |
| `several-changes-at-once` | One PR with three changes: a correct OpenSpec change that moves the due-soon notice from 2 to 3 days before the due date; an OpenSpec change whose delta says ready holds expire after 5 days while the code uses 7; and a bypass edit that lowers the suspension threshold from $5.00 to $3.00. | Pass the notice change. Flag the hold expiry mismatch and the suspension bypass. |
