# openspec-drift

A test bed for tools that claim to catch drift between OpenSpec specs and code in pull requests.

- `docs/baseline.md` describes the starting repo.
- `docs/scenarios.md` lists each test PR and what a good tool should report. It was written before any tool ran.
- `docs/log.md` records each step as it happened.

All code and OpenSpec changes come from pi running `openai/gpt-6.1-terra` at high thinking effort, through `scripts/agent.sh`.

## Lending and fines

Use a single shared `Loans` instance for each `Members` registry and catalog; a second loans instance for the same registry is rejected. Construct it as `new Loans(catalog, members, clock?)`, and route lending through that instance. State is in memory.

`loans.getBalance(memberId)` returns unpaid cents. `loans.payFine(memberId, cents)` accepts a positive safe integer no greater than the current balance. Loans accrue 25 cents per completed overdue day, capped at 1,000 cents per loan; returns freeze accrual. Members with balances above 500 cents cannot borrow, independently of manual suspension. Paying down to 500 cents or less removes only the fine-related hold.

## Renewals

`loans.renew(memberId, copyId)` renews a member's active loan at most twice per checkout and returns a detached `Loan` snapshot. The new due date is the renewal time plus 14 fixed days for standard members or 28 for premium members, rather than an extension of the old due date. Renewal is allowed exactly at the due instant, but not afterward. It also fails if another member has a waiting or unexpired ready hold for the same ISBN, even on another copy. The borrower's own hold does not block renewal. Suspension and the active-loan limit do not prevent renewal.

Renewal uses the injectable, monotonic-clamped clock and processes hold expiry first; even a rejected renewal can expire or reassign holds. Other than this processing, a rejection leaves the loan and copy unchanged and does not consume a renewal.

## Notifications

`loans.scanNotifications(date)` scans active loans using the date's UTC calendar day, ignoring time of day. It appends `due-soon` notices exactly two days before the due day and `overdue` notices exactly one day after it; invalid dates throw. Scans do not backfill missed days, process holds, or change lending state. The caller must schedule scans, typically daily. Each notice is emitted at most once per loan, notice type, and due timestamp; renewal can create a new eligible timestamp.

`loans.getOutbox()` returns detached notifications in emission order. Loan notices contain `type`, `memberId`, `copyId`, and a `dueAt` Date. A `hold-ready` notice contains `memberId`, `isbn`, `copyId`, and an `expiresAt` Date. It is emitted whenever a waiting hold is allocated on return or expiration reassignment, including when the operation that processes expiration subsequently fails. Waiting holds and releases without reassignment emit no notice. The outbox and deduplication history live only for the lifetime of the `Loans` instance; delivery and persistence are the caller's responsibility.

```ts
loans.scanNotifications(new Date('2024-01-13T00:00:00Z'));
const notices = loans.getOutbox();
```

## Holds

`loans.placeHold(memberId, isbn)` queues a member when no copy is available. A member may have one active hold per book, even if currently ineligible to borrow. `loans.getHolds(isbn)` returns detached records in queue order: waiting records have `status: 'waiting'`; ready records have `status: 'ready'`, `copyId`, and an `expiresAt` Date.

A return reserves its copy for the first waiting member for 72 hours. Only that member can check it out, subject to the usual eligibility rules. Expiry is lazy: checkout, renewal, return, `placeHold`, and `getHolds` process expired reservations first, assigning the copy to the next waiting member for another 72 hours or making it available. Catalog-only reads do not process expiry and may show stale status.

Catalog copy statuses are `available`, `on loan`, and `reserved`; `catalog.getCopyIsbn(copyId)` returns the ISBN or `undefined`. Catalog status setters are low-level: changing a status does not override active loan or reservation ownership.

```ts
loans.checkout('borrower', 'copy-1'); // assuming this is the only copy
loans.placeHold('reader', 'isbn-1');
loans.returnCopy('copy-1');
const holds = loans.getHolds('isbn-1'); // reader's hold is ready
loans.checkout('reader', 'copy-1'); // consumes the hold
```
