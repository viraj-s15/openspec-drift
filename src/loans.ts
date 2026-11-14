import { Catalog } from './catalog.js';
import { Members } from './members.js';
import { Fines } from './fines.js';
import { Holds, type Hold } from './holds.js';
import { Notifications, type Notification } from './notifications.js';

export type { Hold } from './holds.js';
export type { Notification } from './notifications.js';

const MILLISECONDS_PER_DAY = 86_400_000;
const STANDARD_LOAN_DAYS = 14;
const PREMIUM_LOAN_DAYS = 28;
const MAX_ACTIVE_LOANS = 5;
const MAX_RENEWALS = 2;

export interface Loan {
  memberId: string;
  copyId: string;
  checkoutAt: Date;
  dueAt: Date;
}

type ActiveLoan = Loan & { renewals: number };

function dueTimestamp(timestamp: number, tier: string | undefined): number {
  const days = tier === 'premium' ? PREMIUM_LOAN_DAYS : STANDARD_LOAN_DAYS;
  return timestamp + days * MILLISECONDS_PER_DAY;
}

function copyLoan(loan: Loan): Loan {
  return {
    memberId: loan.memberId,
    copyId: loan.copyId,
    checkoutAt: new Date(loan.checkoutAt),
    dueAt: new Date(loan.dueAt),
  };
}

/** Use one shared instance per catalog and route lending through it. Direct catalog
 * status changes do not alter loan ownership, and instances do not coordinate. */
export class Loans {
  private readonly active = new Map<string, ActiveLoan>();
  private readonly fines: Fines;
  private readonly holds: Holds;
  private readonly notifications = new Notifications();
  private lastTime = -Infinity;
  private memberLookupTime?: number;

  getOutbox(): Notification[] {
    return this.notifications.getOutbox();
  }

  scanNotifications(date: Date): void {
    this.notifications.scan(date, this.active.values());
  }

  private readTime(): number {
    const now = this.clock();
    const time = now instanceof Date ? now.getTime() : NaN;
    if (!Number.isFinite(time)) throw new Error('Invalid clock value');
    return Math.max(time, this.lastTime);
  }

  constructor(
    private readonly catalog: Catalog,
    private readonly members: Members,
    private readonly clock: () => Date = () => new Date(),
  ) {
    this.fines = new Fines(this.members, () => this.readTime(), time => { this.lastTime = time; });
    this.holds = new Holds(this.catalog, this.members, copyId => this.active.has(copyId),
      hold => this.notifications.holdReady(hold));
    this.members.registerFineProvider(id => this.memberLookupTime === undefined
      ? this.getBalance(id) : this.fines.balanceAt(id, this.memberLookupTime));
  }

  getBalance(memberId: string): number {
    return this.fines.getBalance(memberId);
  }

  payFine(memberId: string, cents: number): void {
    this.fines.payFine(memberId, cents);
  }

  placeHold(memberId: string, isbn: string): Hold {
    this.reconcile(this.readTime());
    return this.holds.placeHold(memberId, isbn);
  }

  getHolds(isbn: string): Hold[] {
    this.reconcile(this.readTime());
    return this.holds.getHolds(isbn);
  }

  private reconcile(time: number): void {
    this.holds.reconcile(time);
    this.lastTime = time;
  }

  private getMemberAt(memberId: string, timestamp: number) {
    this.memberLookupTime = timestamp;
    try {
      return this.members.get(memberId);
    } finally {
      this.memberLookupTime = undefined;
    }
  }

  private hasReachedLoanLimit(memberId: string): boolean {
    return [...this.active.values()].filter(loan => loan.memberId === memberId).length >= MAX_ACTIVE_LOANS;
  }

  checkout(memberId: string, copyId: string): Loan {
    const timestamp = this.readTime();
    const member = this.getMemberAt(memberId, timestamp);
    const due = dueTimestamp(timestamp, member?.tier);
    if (member && !Number.isFinite(new Date(due).getTime())) throw new Error('Invalid clock value');
    this.reconcile(timestamp);
    if (!member) throw new Error('Unknown member');
    if (member.suspended) throw new Error('Member suspended');
    if (this.hasReachedLoanLimit(memberId)) {
      throw new Error('Loan limit reached');
    }
    const copy = this.catalog.getCopy(copyId);
    if (!copy) throw new Error('Unknown copy');
    const isbn = this.catalog.getCopyIsbn(copyId)!;
    this.holds.assertCheckoutAllowed(memberId, isbn, copy);

    const loan = { memberId, copyId, checkoutAt: new Date(timestamp), dueAt: new Date(due), renewals: 0 };
    this.catalog.setCopyStatus(copyId, 'on loan');
    this.active.set(copyId, loan);
    this.fines.recordCheckout(loan, member.tier);
    this.holds.consumeReservation(isbn, copyId);
    this.lastTime = timestamp;
    return copyLoan(loan);
  }

  renew(memberId: string, copyId: string): Loan {
    const timestamp = this.readTime();
    this.reconcile(timestamp);
    const member = this.getMemberAt(memberId, timestamp);
    if (!member) throw new Error('Unknown member');
    const isbn = this.catalog.getCopyIsbn(copyId);
    if (isbn === undefined) throw new Error('Unknown copy');
    const loan = this.active.get(copyId);
    if (!loan || loan.memberId !== memberId) throw new Error('No active loan for member');
    if (timestamp > loan.dueAt.getTime()) throw new Error('Loan overdue');
    if (loan.renewals >= MAX_RENEWALS) throw new Error('Renewal limit reached');
    this.holds.assertRenewalAllowed(memberId, isbn);
    const due = new Date(dueTimestamp(timestamp, member.tier));
    if (!Number.isFinite(due.getTime())) throw new Error('Invalid clock value');
    loan.dueAt = due;
    loan.renewals++;
    return copyLoan(loan);
  }

  returnCopy(copyId: string): void {
    const returnedAt = this.readTime();
    const isbn = this.catalog.getCopyIsbn(copyId);
    if (this.active.has(copyId) && isbn) this.holds.validateAllocation(isbn, returnedAt);
    this.reconcile(returnedAt);
    const loan = this.active.get(copyId);
    if (!loan) throw new Error('No active loan');
    this.holds.allocate(this.catalog.getCopyIsbn(copyId)!, copyId, returnedAt);
    this.active.delete(copyId);
    this.fines.recordReturn(loan, returnedAt);
    this.lastTime = returnedAt;
  }
}
