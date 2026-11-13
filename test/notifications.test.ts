import { describe, expect, it } from 'vitest';
import { Catalog } from '../src/catalog.js';
import { Members } from '../src/members.js';
import { Loans } from '../src/loans.js';

function setup() {
  let now = new Date('2024-01-01T23:30:00Z');
  const catalog = new Catalog();
  catalog.addBook('book', 'Book', 'Author', ['a', 'b']);
  const members = new Members();
  for (const id of ['borrower', 'first', 'second']) members.register(id, id, 'standard');
  const loans = new Loans(catalog, members, () => now);
  return { catalog, loans, setTime: (date: string) => { now = new Date(date); } };
}
const scan = (loans: Loans, date: string) => loans.scanNotifications(new Date(date));

describe('loan notifications', () => {
  it('uses exact UTC days, preserves order and returns detached messages and dates', () => {
    const { loans } = setup();
    loans.checkout('borrower', 'a'); loans.checkout('first', 'b');
    scan(loans, '2024-01-12T23:59:59-01:00');
    expect(loans.getOutbox()).toEqual([
      { type: 'due-soon', memberId: 'borrower', copyId: 'a', dueAt: new Date('2024-01-15T23:30:00Z') },
      { type: 'due-soon', memberId: 'first', copyId: 'b', dueAt: new Date('2024-01-15T23:30:00Z') },
    ]);
    const snapshot = loans.getOutbox();
    const first = snapshot[0];
    if (first.type === 'hold-ready') throw new Error('Expected loan notice');
    first.dueAt.setTime(0); first.memberId = 'changed'; snapshot.pop();
    scan(loans, '2024-01-13T00:00:00Z');
    expect(loans.getOutbox()).toHaveLength(2);
    expect(loans.getOutbox()[0]).toMatchObject({ memberId: 'borrower', dueAt: new Date('2024-01-15T23:30:00Z') });
  });

  it('only emits overdue the next UTC day, without backfill or lending-state changes', () => {
    const { loans, catalog, setTime } = setup();
    loans.checkout('borrower', 'a'); loans.checkout('first', 'b');
    loans.placeHold('borrower', 'book');
    scan(loans, '2024-01-15T23:59:59Z');
    scan(loans, '2024-01-17T00:00:00Z');
    expect(loans.getOutbox()).toEqual([]);
    scan(loans, '2024-01-16T00:00:00Z');
    expect(loans.getOutbox().map(n => n.type)).toEqual(['overdue', 'overdue']);
    expect(loans.getHolds('book')).toMatchObject([{ memberId: 'borrower', status: 'waiting' }]);
    expect(catalog.getCopy('a')?.status).toBe('on loan');
    // A future scan must not advance the service clock.
    setTime('2024-01-02T00:00:00Z');
    expect(loans.renew('borrower', 'a').dueAt).toEqual(new Date('2024-01-16T00:00:00Z'));
  });

  it('ignores returned loans and rejects invalid dates without affecting deduplication', () => {
    const { loans } = setup();
    loans.checkout('borrower', 'a'); loans.checkout('first', 'b');
    loans.returnCopy('a');
    expect(() => loans.scanNotifications(new Date(NaN))).toThrow();
    expect(loans.getOutbox()).toEqual([]);
    scan(loans, '2024-01-13T10:00:00Z');
    expect(loans.getOutbox()).toMatchObject([{ memberId: 'first', copyId: 'b' }]);
    expect(() => loans.scanNotifications(new Date(NaN))).toThrow();
    scan(loans, '2024-01-13T11:00:00Z');
    expect(loans.getOutbox()).toHaveLength(1);
  });

  it('deduplicates out-of-order scans per loan, type and due timestamp, including renewal and reloan', () => {
    const { loans, setTime } = setup();
    loans.checkout('borrower', 'a');
    scan(loans, '2024-01-16T00:00:00Z');
    scan(loans, '2024-01-13T00:00:00Z');
    scan(loans, '2024-01-16T23:00:00Z');
    scan(loans, '2024-01-13T23:00:00Z');
    expect(loans.getOutbox().map(n => n.type)).toEqual(['overdue', 'due-soon']);
    setTime('2024-01-02T23:30:00Z');
    loans.renew('borrower', 'a');
    scan(loans, '2024-01-14T00:00:00Z');
    scan(loans, '2024-01-14T12:00:00Z');
    expect(loans.getOutbox()).toHaveLength(3);
    loans.returnCopy('a');
    loans.checkout('borrower', 'a');
    scan(loans, '2024-01-14T00:00:00Z');
    expect(loans.getOutbox()).toHaveLength(4);
  });
});

describe('hold-ready notifications', () => {
  it('emits on return and reassignment, but not for waiting or release without allocation', () => {
    const { loans, catalog, setTime } = setup();
    loans.checkout('borrower', 'a'); loans.checkout('borrower', 'b');
    loans.placeHold('first', 'book'); loans.placeHold('second', 'book');
    loans.getHolds('book');
    expect(loans.getOutbox()).toEqual([]);
    loans.returnCopy('a');
    expect(loans.getOutbox()).toEqual([{ type: 'hold-ready', memberId: 'first', isbn: 'book', copyId: 'a', expiresAt: new Date('2024-01-04T23:30:00Z') }]);
    setTime('2024-01-04T23:30:00Z');
    loans.getHolds('book');
    expect(loans.getOutbox()[1]).toEqual({ type: 'hold-ready', memberId: 'second', isbn: 'book', copyId: 'a', expiresAt: new Date('2024-01-07T23:30:00Z') });
    setTime('2024-01-07T23:30:00Z');
    loans.getHolds('book');
    expect(catalog.getCopy('a')?.status).toBe('available');
    expect(loans.getOutbox()).toHaveLength(2);
  });

  it('retains notices for committed expiry before failure, in order and detached from snapshots', () => {
    const { loans, setTime } = setup();
    loans.checkout('borrower', 'a'); loans.checkout('borrower', 'b');
    loans.placeHold('first', 'book'); loans.placeHold('second', 'book');
    scan(loans, '2024-01-13T00:00:00Z');
    loans.returnCopy('a');
    setTime('2024-01-04T23:30:00Z');
    expect(() => loans.checkout('missing', 'a')).toThrow();
    const notices = loans.getOutbox();
    expect(notices.map(n => n.type)).toEqual(['due-soon', 'due-soon', 'hold-ready', 'hold-ready']);
    expect(notices[3]).toEqual({ type: 'hold-ready', memberId: 'second', isbn: 'book', copyId: 'a', expiresAt: new Date('2024-01-07T23:30:00Z') });
    const ready = notices[3];
    if (ready.type !== 'hold-ready') throw new Error('Expected ready notice');
    ready.expiresAt.setTime(0); ready.memberId = 'changed'; notices.length = 0;
    expect(loans.getOutbox()[3]).toEqual({ type: 'hold-ready', memberId: 'second', isbn: 'book', copyId: 'a', expiresAt: new Date('2024-01-07T23:30:00Z') });
    expect(loans.getHolds('book')).toMatchObject([{ memberId: 'second', expiresAt: new Date('2024-01-07T23:30:00Z') }]);
    scan(loans, '2024-01-13T12:00:00Z');
    expect(loans.getOutbox()).toHaveLength(4);
  });
});
