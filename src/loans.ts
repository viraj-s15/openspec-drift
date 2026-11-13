import { Catalog } from './catalog.js';
import { Members } from './members.js';

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

  checkout(memberId: string, copyId: string): Loan {
    if (!this.members.has(memberId)) throw new Error('Unknown member');
    const timestamp = this.readTime();
    this.checkoutTime = timestamp;
    let member;
    try {
      member = this.members.get(memberId);
    } finally {
      this.checkoutTime = undefined;
    }
    if (!member) throw new Error('Unknown member');
    if (member.suspended) throw new Error('Member suspended');
    if ([...this.active.values()].filter(loan => loan.memberId === memberId).length >= 5) {
      throw new Error('Loan limit reached');
    }
    const copy = this.catalog.getCopy(copyId);
    if (!copy) throw new Error('Unknown copy');
    if (copy.status !== 'available' || this.active.has(copyId)) throw new Error('Copy unavailable');

    const due = timestamp + (member.tier === 'premium' ? 28 : 14) * 86400000;
    if (!Number.isFinite(timestamp) || !Number.isFinite(new Date(due).getTime())) throw new Error('Invalid clock value');
    const loan: Loan = { memberId, copyId, checkoutAt: new Date(timestamp), dueAt: new Date(due) };
    this.catalog.setCopyStatus(copyId, 'on loan');
    this.active.set(copyId, loan);
    this.lastTime = timestamp;
    return { ...loan, checkoutAt: new Date(loan.checkoutAt), dueAt: new Date(loan.dueAt) };
  }

  returnCopy(copyId: string): void {
    const loan = this.active.get(copyId);
    if (!loan) throw new Error('No active loan');
    const returnedAt = this.readTime();
    this.catalog.setCopyStatus(copyId, 'available');
    this.active.delete(copyId);
    this.returned.push({ ...loan, returnedAt });
    this.lastTime = returnedAt;
  }
}
