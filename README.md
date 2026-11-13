# openspec-drift

A test bed for tools that claim to catch drift between OpenSpec specs and code in pull requests.

- `docs/baseline.md` describes the starting repo.
- `docs/scenarios.md` lists each test PR and what a good tool should report. It was written before any tool ran.
- `docs/log.md` records each step as it happened.

All code and OpenSpec changes come from pi running `openai/gpt-6.1-terra` at high thinking effort, through `scripts/agent.sh`.

## Lending and fines

Use a single shared `Loans` instance for each `Members` registry and catalog; a second loans instance for the same registry is rejected. Construct it as `new Loans(catalog, members, clock?)`, and route lending through that instance. State is in memory.

`loans.getBalance(memberId)` returns unpaid cents. `loans.payFine(memberId, cents)` accepts a positive safe integer no greater than the current balance. Loans accrue 25 cents per completed overdue day, capped at 1,000 cents per loan; returns freeze accrual. Members with balances above 500 cents cannot borrow, independently of manual suspension. Paying down to 500 cents or less removes only the fine-related hold.
