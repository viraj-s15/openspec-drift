import type { Hold } from './holds.js';
import type { Loan } from './loans.js';

const MILLISECONDS_PER_DAY = 86_400_000;
const DUE_SOON_DAY_OFFSET = -3;
const OVERDUE_DAY_OFFSET = 1;

export type Notification =
  | { type: 'due-soon' | 'overdue'; memberId: string; copyId: string; dueAt: Date }
  | { type: 'hold-ready'; memberId: string; isbn: string; copyId: string; expiresAt: Date };

export class Notifications {
  private readonly outbox: Notification[] = [];
  private readonly noticeHistory = new WeakMap<Loan, Set<string>>();

  getOutbox(): Notification[] {
    return this.outbox.map(notice => notice.type === 'hold-ready'
      ? { ...notice, expiresAt: new Date(notice.expiresAt) }
      : { ...notice, dueAt: new Date(notice.dueAt) });
  }

  scan(date: Date, loans: Iterable<Loan>): void {
    const time = date instanceof Date ? date.getTime() : NaN;
    if (!Number.isFinite(time)) throw new Error('Invalid scan date');
    const day = Math.floor(time / MILLISECONDS_PER_DAY);
    for (const loan of loans) {
      const difference = day - Math.floor(loan.dueAt.getTime() / MILLISECONDS_PER_DAY);
      const type = difference === DUE_SOON_DAY_OFFSET ? 'due-soon' : difference === OVERDUE_DAY_OFFSET ? 'overdue' : undefined;
      if (!type) continue;
      const key = `${type}:${loan.dueAt.getTime()}`;
      let history = this.noticeHistory.get(loan);
      if (history?.has(key)) continue;
      if (!history) this.noticeHistory.set(loan, history = new Set());
      history.add(key);
      this.outbox.push({ type, memberId: loan.memberId, copyId: loan.copyId, dueAt: new Date(loan.dueAt) });
    }
  }

  holdReady(hold: Extract<Hold, { status: 'ready' }>): void {
    this.outbox.push({
      type: 'hold-ready', memberId: hold.memberId, isbn: hold.isbn,
      copyId: hold.copyId, expiresAt: new Date(hold.expiresAt),
    });
  }
}
