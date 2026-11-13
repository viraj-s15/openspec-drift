import { Catalog } from './catalog.js';
import { Members } from './members.js';

export type Hold =
  | { memberId: string; isbn: string; status: 'waiting' }
  | { memberId: string; isbn: string; status: 'ready'; copyId: string; expiresAt: Date };

export interface Loan {
  memberId: string;
  copyId: string;
  checkoutAt: Date;
  dueAt: Date;
}

/** Use one shared instance per catalog and route lending through it. Direct catalog
 * status changes do not alter loan ownership, and instances do not coordinate. */
export class Loans {
  private readonly active = new Map<string, Loan>();
  private readonly holds = new Map<string, Hold[]>();
  private readonly holdOrder = new WeakMap<Hold, number>();
  private nextHoldOrder = 0;
  private readonly returned: Array<Loan & { returnedAt: number }> = [];
  private lastTime = -Infinity;
  private checkoutTime?: number;
  private readonly payments = new Map<string, number>();

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
    this.members.registerFineProvider(id => this.checkoutTime === undefined
      ? this.getBalance(id) : this.balanceAt(id, this.checkoutTime));
  }

  private balanceAt(memberId: string, time: number): number {
    const loans = [...this.active.values()].map(loan => ({ ...loan, returnedAt: time })).concat(this.returned);
    const accrued = loans.filter(loan => loan.memberId === memberId).reduce((total, loan) =>
      total + Math.min(1000, Math.max(0, Math.floor((loan.returnedAt - loan.dueAt.getTime()) / 86400000)) * 25), 0);
    return Math.max(0, accrued - (this.payments.get(memberId) ?? 0));
  }

  getBalance(memberId: string): number {
    if (!this.members.has(memberId)) throw new Error('Unknown member');
    const time = this.readTime();
    const balance = this.balanceAt(memberId, time);
    this.lastTime = time;
    return balance;
  }

  payFine(memberId: string, cents: number): void {
    if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error('Invalid payment');
    if (!this.members.has(memberId)) throw new Error('Unknown member');
    const time = this.readTime();
    if (cents > this.balanceAt(memberId, time)) throw new Error('Payment exceeds balance');
    this.payments.set(memberId, (this.payments.get(memberId) ?? 0) + cents);
    this.lastTime = time;
  }

  placeHold(memberId: string, isbn: string): Hold {
    this.reconcile(this.readTime());
    if (!this.members.has(memberId)) throw new Error('Unknown member');
    const book = this.catalog.getBook(isbn);
    if (!book) throw new Error('Unknown book');
    const queue = this.holds.get(isbn) ?? [];
    if (queue.some(hold => hold.memberId === memberId)) throw new Error('Duplicate hold');
    if (book.copies.some(copy => copy.status === 'available' && !this.active.has(copy.id) &&
      !queue.some(hold => hold.status === 'ready' && hold.copyId === copy.id))) throw new Error('Copy available');
    const hold: Hold = { memberId, isbn, status: 'waiting' };
    this.holdOrder.set(hold, this.nextHoldOrder++);
    queue.push(hold);
    this.holds.set(isbn, queue);
    return { ...hold };
  }

  getHolds(isbn: string): Hold[] {
    this.reconcile(this.readTime());
    if (!this.catalog.getBook(isbn)) throw new Error('Unknown book');
    return (this.holds.get(isbn) ?? []).map(hold => hold.status === 'ready'
      ? { ...hold, expiresAt: new Date(hold.expiresAt) } : { ...hold });
  }

  private allocate(isbn: string, copyId: string, time: number): void {
    const queue = this.holds.get(isbn) ?? [];
    const index = queue.findIndex(hold => hold.status === 'waiting');
    if (index < 0) {
      this.catalog.setCopyStatus(copyId, 'available');
      return;
    }
    const expiresAt = new Date(time + 72 * 3600000);
    if (!Number.isFinite(expiresAt.getTime())) throw new Error('Invalid clock value');
    const waiting = queue[index];
    const ready: Hold = { ...waiting, status: 'ready', copyId, expiresAt };
    this.holdOrder.set(ready, this.holdOrder.get(waiting)!);
    queue[index] = ready;
    this.catalog.setCopyStatus(copyId, 'reserved');
  }

  private reconcile(time: number): void {
    const expired = [...this.holds.values()].flat().filter(
      (hold): hold is Extract<Hold, { status: 'ready' }> => hold.status === 'ready' && hold.expiresAt.getTime() <= time,
    ).sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime() || this.holdOrder.get(a)! - this.holdOrder.get(b)!);
    if (expired.some(hold => this.holds.get(hold.isbn)!.some(other => other.status === 'waiting')) &&
        !Number.isFinite(new Date(time + 72 * 3600000).getTime())) throw new Error('Invalid clock value');
    for (const hold of expired) {
      const queue = this.holds.get(hold.isbn)!;
      queue.splice(queue.indexOf(hold), 1);
      this.allocate(hold.isbn, hold.copyId, time);
    }
    this.lastTime = time;
  }

  checkout(memberId: string, copyId: string): Loan {
    const timestamp = this.readTime();
    this.checkoutTime = timestamp;
    let member;
    try {
      member = this.members.get(memberId);
    } finally {
      this.checkoutTime = undefined;
    }
    const due = timestamp + (member?.tier === 'premium' ? 28 : 14) * 86400000;
    if (member && !Number.isFinite(new Date(due).getTime())) throw new Error('Invalid clock value');
    this.reconcile(timestamp);
    if (!member) throw new Error('Unknown member');
    if (member.suspended) throw new Error('Member suspended');
    if ([...this.active.values()].filter(loan => loan.memberId === memberId).length >= 5) {
      throw new Error('Loan limit reached');
    }
    const copy = this.catalog.getCopy(copyId);
    if (!copy) throw new Error('Unknown copy');
    const isbn = this.catalog.getCopyIsbn(copyId)!;
    const queue = this.holds.get(isbn) ?? [];
    const reservation = queue.find(hold => hold.status === 'ready' && hold.copyId === copyId);
    if (this.active.has(copyId) || (reservation ? reservation.memberId !== memberId : copy.status !== 'available')) {
      throw new Error('Copy unavailable');
    }

    const loan: Loan = { memberId, copyId, checkoutAt: new Date(timestamp), dueAt: new Date(due) };
    this.catalog.setCopyStatus(copyId, 'on loan');
    this.active.set(copyId, loan);
    if (reservation) queue.splice(queue.indexOf(reservation), 1);
    this.lastTime = timestamp;
    return { ...loan, checkoutAt: new Date(loan.checkoutAt), dueAt: new Date(loan.dueAt) };
  }

  returnCopy(copyId: string): void {
    const returnedAt = this.readTime();
    const isbn = this.catalog.getCopyIsbn(copyId);
    if (this.active.has(copyId) && isbn && this.holds.get(isbn)?.some(hold => hold.status === 'waiting') &&
        !Number.isFinite(new Date(returnedAt + 72 * 3600000).getTime())) throw new Error('Invalid clock value');
    this.reconcile(returnedAt);
    const loan = this.active.get(copyId);
    if (!loan) throw new Error('No active loan');
    this.allocate(this.catalog.getCopyIsbn(copyId)!, copyId, returnedAt);
    this.active.delete(copyId);
    this.returned.push({ ...loan, returnedAt });
    this.lastTime = returnedAt;
  }
}
