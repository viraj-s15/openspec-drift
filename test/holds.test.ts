import { describe, expect, it } from 'vitest';
import { Catalog } from '../src/catalog.js';
import { Members } from '../src/members.js';
import { Loans } from '../src/loans.js';

function setup() {
  let now = new Date('2024-01-01T00:00:00Z');
  const catalog = new Catalog();
  catalog.addBook('one', 'One', 'Author', ['a', 'b']);
  catalog.addBook('two', 'Two', 'Author', ['c']);
  const members = new Members();
  for (const id of ['borrower', 'first', 'second', 'third']) members.register(id, id, 'standard');
  const loans = new Loans(catalog, members, () => now);
  return { catalog, members, loans, setTime: (time: number) => { now = new Date(time); }, time: () => now.getTime() };
}

function addUnavailableBooks(catalog: Catalog, count: number) {
  for (let i = 1; i <= count; i++) {
    catalog.addBook(`extra-${i}`, `Extra ${i}`, 'Author', [`extra-copy-${i}`]);
    catalog.setCopyStatus(`extra-copy-${i}`, 'on loan');
  }
}

describe('holds', () => {
  it('accepts a third hold and rejects a fourth without changing queues or copies', () => {
    const { catalog, loans } = setup();
    addUnavailableBooks(catalog, 4);
    for (let i = 1; i <= 3; i++) loans.placeHold('first', `extra-${i}`);
    const books = [1, 2, 3, 4].map(i => `extra-${i}`);
    const before = books.map(isbn => loans.getHolds(isbn));
    const copies = books.map((_, i) => catalog.getCopy(`extra-copy-${i + 1}`));
    expect(before.map(queue => queue.length)).toEqual([1, 1, 1, 0]);
    expect(() => loans.placeHold('first', 'extra-4')).toThrow('Hold limit reached');
    expect(books.map(isbn => loans.getHolds(isbn))).toEqual(before);
    expect(books.map((_, i) => catalog.getCopy(`extra-copy-${i + 1}`))).toEqual(copies);
  });

  it('counts ready and waiting holds together while keeping member limits independent', () => {
    const { catalog, loans } = setup();
    addUnavailableBooks(catalog, 3);
    loans.checkout('borrower', 'a');
    loans.checkout('borrower', 'b');
    loans.placeHold('first', 'one');
    loans.returnCopy('a');
    loans.placeHold('first', 'extra-1');
    loans.placeHold('first', 'extra-2');
    expect(loans.getHolds('one')[0].status).toBe('ready');
    expect(loans.getHolds('extra-1')[0].status).toBe('waiting');
    expect(() => loans.placeHold('first', 'extra-3')).toThrow('Hold limit reached');
    expect(loans.placeHold('second', 'extra-3')).toMatchObject({ status: 'waiting', memberId: 'second' });
  });
  it('continues counting a hold after allocation and frees its slot on pickup', () => {
    const { catalog, loans } = setup();
    addUnavailableBooks(catalog, 3);
    loans.checkout('borrower', 'a');
    loans.checkout('borrower', 'b');
    loans.placeHold('first', 'one');
    loans.placeHold('first', 'extra-1');
    loans.placeHold('first', 'extra-2');
    loans.returnCopy('a');
    expect(loans.getHolds('one')[0]).toMatchObject({ status: 'ready', copyId: 'a' });
    expect(() => loans.placeHold('first', 'extra-3')).toThrow('Hold limit reached');
    loans.checkout('first', 'a');
    expect(loans.getHolds('one')).toEqual([]);
    expect(loans.placeHold('first', 'extra-3')).toMatchObject({ status: 'waiting' });
  });

  it('expires a ready hold at its deadline before checking the placement limit', () => {
    const { catalog, loans, setTime, time } = setup();
    addUnavailableBooks(catalog, 3);
    loans.checkout('borrower', 'a');
    loans.checkout('borrower', 'b');
    loans.placeHold('first', 'one');
    loans.returnCopy('a');
    loans.placeHold('first', 'extra-1');
    loans.placeHold('first', 'extra-2');
    const deadline = time() + 72 * 3600000;
    setTime(deadline - 1);
    expect(() => loans.placeHold('first', 'extra-3')).toThrow('Hold limit reached');
    setTime(deadline);
    expect(loans.placeHold('first', 'extra-3')).toMatchObject({ status: 'waiting' });
    expect(loans.getHolds('one')).toEqual([]);
    expect(catalog.getCopy('a')?.status).toBe('available');
  });

  it('queues per book in order and returns detached waiting snapshots', () => {
    const { catalog, loans } = setup();
    for (const id of ['a', 'b', 'c']) catalog.setCopyStatus(id, 'on loan');
    const placed = loans.placeHold('first', 'one');
    loans.placeHold('second', 'one');
    loans.placeHold('first', 'two');
    placed.memberId = 'third';
    const snapshots = loans.getHolds('one');
    snapshots[0].memberId = 'third';
    snapshots.pop();
    expect(loans.getHolds('one').map(h => h.memberId)).toEqual(['first', 'second']);
    expect(loans.getHolds('two').map(h => h.memberId)).toEqual(['first']);
  });

  it('allocates multiple returned copies in FIFO order and consumes only eligible checkouts', () => {
    const { catalog, members, loans, setTime, time } = setup();
    loans.checkout('borrower', 'a');
    loans.checkout('borrower', 'b');
    loans.placeHold('first', 'one');
    loans.placeHold('second', 'one');
    setTime(time() + 16 * 86400000);
    loans.returnCopy('b');
    loans.returnCopy('a');
    expect(loans.getBalance('borrower')).toBe(100);
    expect(loans.getHolds('one')).toMatchObject([
      { memberId: 'first', status: 'ready', copyId: 'b' },
      { memberId: 'second', status: 'ready', copyId: 'a' },
    ]);
    expect(catalog.getCopy('a')?.status).toBe('reserved');
    expect(() => loans.checkout('third', 'b')).toThrow();
    members.suspend('first');
    expect(() => loans.checkout('first', 'b')).toThrow();
    expect(loans.getHolds('one')).toHaveLength(2);
    members.reinstate('first');
    loans.checkout('first', 'b');
    expect(catalog.getCopy('b')?.status).toBe('on loan');
    expect(loans.getHolds('one').map(h => h.memberId)).toEqual(['second']);
  });

  it('retains a ready hold when its member has reached the loan limit', () => {
    const { catalog, loans } = setup();
    catalog.addBook('extra', 'Extra', 'Author', ['d', 'e', 'f', 'g', 'h']);
    for (const id of ['d', 'e', 'f', 'g', 'h']) loans.checkout('first', id);
    loans.checkout('borrower', 'a');
    loans.checkout('borrower', 'b');
    loans.placeHold('first', 'one');
    loans.returnCopy('a');
    expect(() => loans.checkout('first', 'a')).toThrow();
    expect(loans.getHolds('one')).toMatchObject([{ memberId: 'first', status: 'ready' }]);
  });

  it('expires at 72 hours, reassigns from processing time, and isolates ready snapshots', () => {
    const { catalog, loans, setTime, time } = setup();
    loans.checkout('borrower', 'a'); loans.checkout('borrower', 'b');
    loans.placeHold('first', 'one'); loans.placeHold('second', 'one');
    loans.returnCopy('a');
    const start = time();
    const hold = loans.getHolds('one')[0];
    if (hold.status !== 'ready') throw new Error('Expected ready');
    hold.expiresAt.setTime(0); hold.copyId = 'b';
    setTime(start + 72 * 3600000 - 1);
    expect(loans.getHolds('one')[0]).toMatchObject({ memberId: 'first', copyId: 'a' });
    setTime(start + 72 * 3600000);
    expect(catalog.getCopy('a')?.status).toBe('reserved');
    expect(loans.getHolds('one')).toEqual([{ memberId: 'second', isbn: 'one', status: 'ready', copyId: 'a', expiresAt: new Date(start + 144 * 3600000) }]);
    setTime(start + 144 * 3600000);
    expect(loans.getHolds('one')).toEqual([]);
    expect(catalog.getCopy('a')?.status).toBe('available');
  });

  it('processes simultaneous expirations by original hold order, not return order', () => {
    const { loans, setTime, time } = setup();
    loans.checkout('borrower', 'a'); loans.checkout('borrower', 'b');
    loans.placeHold('first', 'one'); loans.placeHold('second', 'one');
    loans.placeHold('third', 'one');
    loans.returnCopy('b'); loans.returnCopy('a');
    setTime(time() + 72 * 3600000);
    expect(() => loans.checkout('missing', 'a')).toThrow();
    expect(loans.getHolds('one')).toMatchObject([{ memberId: 'third', copyId: 'b', status: 'ready' }]);
  });

  it('reconciles on return and placeHold, clamps time, and rejects invalid clocks atomically', () => {
    const { loans, catalog, setTime, time } = setup();
    loans.checkout('borrower', 'a'); loans.checkout('borrower', 'b');
    loans.placeHold('first', 'one'); loans.returnCopy('a');
    const start = time();
    setTime(NaN);
    expect(() => loans.getHolds('one')).toThrow();
    expect(() => loans.returnCopy('b')).toThrow();
    expect(catalog.getCopy('a')?.status).toBe('reserved');
    setTime(start + 72 * 3600000);
    loans.returnCopy('b');
    expect(catalog.getCopy('a')?.status).toBe('available');
    setTime(start);
    loans.checkout('second', 'a');
    expect(loans.getHolds('one')).toEqual([]);
    loans.checkout('second', 'b');
    loans.placeHold('third', 'one');
    loans.returnCopy('a');
    const ready = loans.getHolds('one')[0];
    if (ready.status !== 'ready') throw new Error('Expected ready');
    expect(ready.expiresAt.getTime()).toBe(start + 144 * 3600000);
    setTime(start + 144 * 3600000);
    expect(() => loans.placeHold('first', 'one')).toThrow();
    expect(catalog.getCopy('a')?.status).toBe('available');
  });

  it('treats active loans and reservations as authoritative after catalog tampering', () => {
    const { catalog, loans } = setup();
    loans.checkout('borrower', 'a'); loans.checkout('borrower', 'b');
    catalog.setCopyStatus('a', 'available');
    expect(() => loans.checkout('third', 'a')).toThrow();
    loans.placeHold('first', 'one');
    loans.returnCopy('a');
    catalog.setCopyStatus('a', 'available');
    expect(() => loans.checkout('third', 'a')).toThrow();
    loans.placeHold('second', 'one');
    expect(loans.getHolds('one').map(h => h.memberId)).toEqual(['first', 'second']);
    loans.checkout('first', 'a');
    expect(catalog.getCopy('a')?.status).toBe('on loan');
  });

  it('rejects unknown, duplicate and available requests without changes', () => {
    const { catalog, loans } = setup();
    expect(() => loans.placeHold('missing', 'one')).toThrow();
    expect(() => loans.placeHold('first', 'missing')).toThrow();
    expect(() => loans.getHolds('missing')).toThrow();
    expect(() => loans.placeHold('first', 'one')).toThrow();
    for (const id of ['a', 'b']) catalog.setCopyStatus(id, 'on loan');
    loans.placeHold('first', 'one');
    expect(() => loans.placeHold('first', 'one')).toThrow();
    expect(loans.getHolds('one')).toHaveLength(1);
    expect(catalog.getCopy('a')?.status).toBe('on loan');
  });
});
