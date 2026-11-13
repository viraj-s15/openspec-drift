# openspec-drift

A test bed for tools that claim to catch drift between OpenSpec specs and code in pull requests.

- `docs/baseline.md` describes the starting repo.
- `docs/scenarios.md` lists each test PR and what a good tool should report. It was written before any tool ran.
- `docs/log.md` records each step as it happened.

All code and OpenSpec changes come from pi running `openai/gpt-6.1-terra` at high thinking effort, through `scripts/agent.sh`.

## Lending and fines

Use a single shared `Loans` instance for each `Members` registry and catalog; a second loans instance for the same registry is rejected. Construct it as `new Loans(catalog, members, clock?)`, and route lending through that instance. State is in memory.

`loans.getBalance(memberId)` returns unpaid cents. `loans.payFine(memberId, cents)` accepts a positive safe integer no greater than the current balance. Loans accrue 25 cents per completed overdue day, capped at 1,000 cents per loan; returns freeze accrual. Members with balances above 500 cents cannot borrow, independently of manual suspension. Paying down to 500 cents or less removes only the fine-related hold.

## Holds

`loans.placeHold(memberId, isbn)` queues a member when no copy is available. A member may have one active hold per book, even if currently ineligible to borrow. `loans.getHolds(isbn)` returns detached records in queue order: waiting records have `status: 'waiting'`; ready records have `status: 'ready'`, `copyId`, and an `expiresAt` Date.

A return reserves its copy for the first waiting member for 72 hours. Only that member can check it out, subject to the usual eligibility rules. Expiry is lazy: checkout, return, `placeHold`, and `getHolds` process expired reservations first, assigning the copy to the next waiting member for another 72 hours or making it available. Catalog-only reads do not process expiry and may show stale status.

Catalog copy statuses are `available`, `on loan`, and `reserved`; `catalog.getCopyIsbn(copyId)` returns the ISBN or `undefined`. Catalog status setters are low-level: changing a status does not override active loan or reservation ownership.

```ts
loans.checkout('borrower', 'copy-1'); // assuming this is the only copy
loans.placeHold('reader', 'isbn-1');
loans.returnCopy('copy-1');
const holds = loans.getHolds('isbn-1'); // reader's hold is ready
loans.checkout('reader', 'copy-1'); // consumes the hold
```
