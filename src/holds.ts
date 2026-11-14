import { Catalog, type Copy } from './catalog.js';
import { Members } from './members.js';

const HOLD_PICKUP_PERIOD_MS = 72 * 3_600_000;

export type Hold =
  | { memberId: string; isbn: string; status: 'waiting' }
  | { memberId: string; isbn: string; status: 'ready'; copyId: string; expiresAt: Date };

export class Holds {
  private readonly queues = new Map<string, Hold[]>();
  private readonly order = new WeakMap<Hold, number>();
  private nextOrder = 0;

  constructor(
    private readonly catalog: Catalog,
    private readonly members: Members,
    private readonly isOnLoan: (copyId: string) => boolean,
    private readonly onReady: (hold: Extract<Hold, { status: 'ready' }>) => void,
  ) {}

  placeHold(memberId: string, isbn: string): Hold {
    if (!this.members.has(memberId)) throw new Error('Unknown member');
    const book = this.catalog.getBook(isbn);
    if (!book) throw new Error('Unknown book');
    const queue = this.queues.get(isbn) ?? [];
    if (queue.some(hold => hold.memberId === memberId)) throw new Error('Duplicate hold');
    if (book.copies.some(copy => copy.status === 'available' && !this.isOnLoan(copy.id) &&
      !queue.some(hold => hold.status === 'ready' && hold.copyId === copy.id))) throw new Error('Copy available');
    const activeHolds = [...this.queues.values()].reduce(
      (count, holds) => count + holds.filter(hold => hold.memberId === memberId).length, 0,
    );
    if (activeHolds >= 3) throw new Error('Hold limit reached');
    const hold: Hold = { memberId, isbn, status: 'waiting' };
    this.order.set(hold, this.nextOrder++);
    queue.push(hold);
    this.queues.set(isbn, queue);
    return { ...hold };
  }

  getHolds(isbn: string): Hold[] {
    if (!this.catalog.getBook(isbn)) throw new Error('Unknown book');
    return (this.queues.get(isbn) ?? []).map(hold => hold.status === 'ready'
      ? { ...hold, expiresAt: new Date(hold.expiresAt) } : { ...hold });
  }

  assertCheckoutAllowed(memberId: string, isbn: string, copy: Copy): void {
    const reservation = (this.queues.get(isbn) ?? []).find(
      hold => hold.status === 'ready' && hold.copyId === copy.id,
    );
    if (this.isOnLoan(copy.id) || (reservation ? reservation.memberId !== memberId : copy.status !== 'available')) {
      throw new Error('Copy unavailable');
    }
  }

  consumeReservation(isbn: string, copyId: string): void {
    const queue = this.queues.get(isbn) ?? [];
    const index = queue.findIndex(hold => hold.status === 'ready' && hold.copyId === copyId);
    if (index >= 0) queue.splice(index, 1);
  }

  assertRenewalAllowed(memberId: string, isbn: string): void {
    if ((this.queues.get(isbn) ?? []).some(hold => hold.memberId !== memberId)) {
      throw new Error('Book has another member’s hold');
    }
  }

  validateAllocation(isbn: string, time: number): void {
    if (this.queues.get(isbn)?.some(hold => hold.status === 'waiting')) this.expiryAt(time);
  }

  private expiryAt(time: number): Date {
    const expiresAt = new Date(time + HOLD_PICKUP_PERIOD_MS);
    if (!Number.isFinite(expiresAt.getTime())) throw new Error('Invalid clock value');
    return expiresAt;
  }

  allocate(isbn: string, copyId: string, time: number): void {
    const queue = this.queues.get(isbn) ?? [];
    const index = queue.findIndex(hold => hold.status === 'waiting');
    if (index < 0) {
      this.catalog.setCopyStatus(copyId, 'available');
      return;
    }
    const expiresAt = this.expiryAt(time);
    const waiting = queue[index];
    const ready: Hold = { ...waiting, status: 'ready', copyId, expiresAt };
    this.order.set(ready, this.order.get(waiting)!);
    queue[index] = ready;
    this.catalog.setCopyStatus(copyId, 'reserved');
    this.onReady(ready);
  }

  reconcile(time: number): void {
    const expired = [...this.queues.values()].flat().filter(
      (hold): hold is Extract<Hold, { status: 'ready' }> => hold.status === 'ready' && hold.expiresAt.getTime() <= time,
    ).sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime() || this.order.get(a)! - this.order.get(b)!);
    if (expired.some(hold => this.queues.get(hold.isbn)!.some(other => other.status === 'waiting'))) {
      this.expiryAt(time);
    }
    for (const hold of expired) {
      const queue = this.queues.get(hold.isbn)!;
      queue.splice(queue.indexOf(hold), 1);
      this.allocate(hold.isbn, hold.copyId, time);
    }
  }
}
