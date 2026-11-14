import type { Loan } from './loans.js';
import { Members, type MemberTier } from './members.js';

const MILLISECONDS_PER_DAY = 86_400_000;
const FINE_PER_DAY_CENTS = 25;
const PREMIUM_FINE_CAP_CENTS = 500;
const STANDARD_FINE_CAP_CENTS = 800;

export class Fines {
  private readonly active = new Map<Loan, number>();
  private readonly returned: Array<Loan & { returnedAt: number; fineCap: number }> = [];
  private readonly payments = new Map<string, number>();

  constructor(
    private readonly members: Members,
    private readonly readTime: () => number,
    private readonly commitTime: (time: number) => void,
  ) {}

  recordCheckout(loan: Loan, tier: MemberTier): void {
    this.active.set(loan, tier === 'premium' ? PREMIUM_FINE_CAP_CENTS : STANDARD_FINE_CAP_CENTS);
  }

  recordReturn(loan: Loan, returnedAt: number): void {
    this.returned.push({ ...loan, returnedAt, fineCap: this.active.get(loan)! });
    this.active.delete(loan);
  }

  balanceAt(memberId: string, time: number): number {
    const loans = [
      ...[...this.active].map(([loan, fineCap]) => ({ ...loan, fineCap, returnedAt: time })),
      ...this.returned,
    ];
    const accrued = loans.filter(loan => loan.memberId === memberId).reduce((total, loan) =>
      total + Math.min(loan.fineCap, Math.max(0, Math.floor((loan.returnedAt - loan.dueAt.getTime()) / MILLISECONDS_PER_DAY)) * FINE_PER_DAY_CENTS), 0);
    return Math.max(0, accrued - (this.payments.get(memberId) ?? 0));
  }

  getBalance(memberId: string): number {
    if (!this.members.has(memberId)) throw new Error('Unknown member');
    const time = this.readTime();
    const balance = this.balanceAt(memberId, time);
    this.commitTime(time);
    return balance;
  }

  payFine(memberId: string, cents: number): void {
    if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error('Invalid payment');
    if (!this.members.has(memberId)) throw new Error('Unknown member');
    const time = this.readTime();
    if (cents > this.balanceAt(memberId, time)) throw new Error('Payment exceeds balance');
    this.payments.set(memberId, (this.payments.get(memberId) ?? 0) + cents);
    this.commitTime(time);
  }
}
