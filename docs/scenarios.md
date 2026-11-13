# Scenarios

Each scenario is a branch cut from the `baseline` tag and opened as a PR against `main`. PRs are never merged, so every tool sees the same base.

This file was written before any tool ran. The "should report" column is the answer key.

| Branch | What the agent did | A good tool should report |
| --- | --- | --- |
| `clean-change` | Followed OpenSpec fully: proposal, delta spec, code, tests, archive. Change: a member can hold at most 3 books at once. | Nothing. |
| `bypass` | Raised the late fee from $0.25 to $0.50 a day in code and tests. No proposal, no spec update. | The fines spec no longer matches the code. |
| `changed-more-than-planned` | Proposal covers one loans change: a renewal extends from the current due date, not from today. The agent also lowered the fine cap. | The fine cap change sits outside the proposal and the fines spec. |
| `silent-mismatch` | Proposal and delta spec say premium loans last 35 days. The code uses 42. | The code does not match the delta spec. |
| `refactor` | Reorganized loan code with no behavior change. No proposal. | Nothing, or at most a note. A warning is a false alarm. |
| `several-changes-at-once` | One PR with three things: a correct OpenSpec change to notifications, an OpenSpec change to holds whose code differs from its delta, and a bypass edit to the member suspension threshold. | Pass notifications. Flag the holds mismatch and the members bypass. |
