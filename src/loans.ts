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

  constructor(
    private readonly catalog: Catalog,
    private readonly members: Members,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  checkout(memberId: string, copyId: string): Loan {
    const member = this.members.get(memberId);
    if (!member) throw new Error('Unknown member');
    if (member.suspended) throw new Error('Member suspended');
    if ([...this.active.values()].filter(loan => loan.memberId === memberId).length >= 5) {
      throw new Error('Loan limit reached');
    }
    const copy = this.catalog.getCopy(copyId);
    if (!copy) throw new Error('Unknown copy');
    if (copy.status !== 'available' || this.active.has(copyId)) throw new Error('Copy unavailable');

    const now = this.clock();
    const timestamp = now instanceof Date ? now.getTime() : NaN;
    const due = timestamp + (member.tier === 'premium' ? 28 : 14) * 86400000;
    if (!Number.isFinite(timestamp) || !Number.isFinite(new Date(due).getTime())) throw new Error('Invalid clock value');
    const loan: Loan = { memberId, copyId, checkoutAt: new Date(timestamp), dueAt: new Date(due) };
    this.catalog.setCopyStatus(copyId, 'on loan');
    this.active.set(copyId, loan);
    return { ...loan, checkoutAt: new Date(loan.checkoutAt), dueAt: new Date(loan.dueAt) };
  }

  returnCopy(copyId: string): void {
    if (!this.active.has(copyId)) throw new Error('No active loan');
    this.catalog.setCopyStatus(copyId, 'available');
    this.active.delete(copyId);
  }
}
