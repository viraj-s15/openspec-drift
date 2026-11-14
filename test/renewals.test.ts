import { describe, expect, it, vi } from 'vitest';
import { Catalog } from '../src/catalog.js';
import { Members } from '../src/members.js';
import { Loans } from '../src/loans.js';

const day = 86400000;
const start = Date.parse('2024-01-01T00:00:00Z');
function setup() {
  let now = start;
  const catalog = new Catalog();
  catalog.addBook('isbn', 'Title', 'Author', ['a', 'b']);
  const members = new Members();
  members.register('standard', 'Standard', 'standard');
  members.register('premium', 'Premium', 'premium');
  members.register('other', 'Other', 'standard');
  const clock = vi.fn(() => new Date(now));
  const loans = new Loans(catalog, members, clock);
  return { catalog, members, loans, clock, setTime: (value: number) => { now = value; } };
}

describe('renewals', () => {
  it.each([['standard', 14], ['premium', 28]] as const)('renews %s from the renewal instant', (member, days) => {
    const { loans, setTime, clock } = setup();
    loans.checkout(member, 'a');
    setTime(start + day);
    clock.mockClear();
    const loan = loans.renew(member, 'a');
    expect(clock).toHaveBeenCalledTimes(1);
    expect(loan.dueAt.getTime()).toBe(start + (days + 1) * day);
    expect(loan.checkoutAt.getTime()).toBe(start);
    expect(loan).not.toHaveProperty('renewals');
  });

  it('rejects unknown IDs, a different borrower, and absent or returned loans without consuming allowance', () => {
    const { loans, catalog } = setup();
    loans.checkout('standard', 'a');
    for (const [member, copy] of [['missing', 'a'], ['standard', 'missing'], ['premium', 'a'], ['standard', 'b']]) {
      expect(() => loans.renew(member, copy)).toThrow();
    }
    expect(catalog.getCopy('a')?.status).toBe('on loan');
    expect(catalog.getCopy('b')?.status).toBe('available');
    loans.renew('standard', 'a');
    loans.renew('standard', 'a');
    loans.returnCopy('a');
    expect(() => loans.renew('standard', 'a')).toThrow();
    expect(catalog.getCopy('a')?.status).toBe('available');
  });

  it('allows renewal exactly at the due instant', () => {
    const { loans, setTime } = setup();
    const loan = loans.checkout('standard', 'a');
    setTime(loan.dueAt.getTime());
    expect(loans.renew('standard', 'a').dueAt.getTime()).toBe(start + 28 * day);
  });

  it('rejects a renewal one millisecond overdue without changing the due date', () => {
    const { loans, setTime, catalog } = setup();
    const loan = loans.checkout('standard', 'a');
    setTime(loan.dueAt.getTime() + 1);
    expect(() => loans.renew('standard', 'a')).toThrow();
    expect(catalog.getCopy('a')?.status).toBe('on loan');
    setTime(loan.dueAt.getTime() + day);
    expect(loans.getBalance('standard')).toBe(25);
  });

  it('rejects another member’s waiting hold and preserves it and the allowance', () => {
    const { loans } = setup();
    loans.checkout('standard', 'a'); loans.checkout('standard', 'b');
    loans.placeHold('other', 'isbn');
    expect(() => loans.renew('standard', 'a')).toThrow();
    expect(loans.getHolds('isbn')).toMatchObject([{ memberId: 'other', status: 'waiting' }]);
    loans.returnCopy('b'); loans.checkout('other', 'b');
    loans.renew('standard', 'a'); loans.renew('standard', 'a');
  });

  it('allows the borrower’s own waiting and ready holds', () => {
    const { loans } = setup();
    loans.checkout('standard', 'a'); loans.checkout('premium', 'b');
    loans.placeHold('standard', 'isbn');
    loans.renew('standard', 'a');
    loans.returnCopy('b');
    expect(loans.getHolds('isbn')).toMatchObject([{ memberId: 'standard', status: 'ready', copyId: 'b' }]);
    loans.renew('standard', 'a');
  });

  it('blocks a ready hold on a different copy until it expires', () => {
    const { loans, catalog, setTime } = setup();
    loans.checkout('standard', 'a'); loans.checkout('premium', 'b');
    loans.placeHold('other', 'isbn'); loans.returnCopy('b');
    setTime(start + 7 * day - 1);
    expect(() => loans.renew('standard', 'a')).toThrow();
    expect(loans.getHolds('isbn')).toMatchObject([{ memberId: 'other', status: 'ready', copyId: 'b' }]);
    setTime(start + 7 * day);
    loans.renew('standard', 'a');
    expect(loans.getHolds('isbn')).toEqual([]);
    expect(catalog.getCopy('b')?.status).toBe('available');
  });

  it('reassigns an expired hold before checking renewal eligibility', () => {
    const { loans, setTime } = setup();
    loans.checkout('standard', 'a'); loans.checkout('premium', 'b');
    loans.placeHold('standard', 'isbn'); loans.placeHold('other', 'isbn');
    loans.returnCopy('b');
    setTime(start + 7 * day);
    expect(() => loans.renew('standard', 'a')).toThrow();
    expect(loans.getHolds('isbn')).toMatchObject([{ memberId: 'other', status: 'ready', copyId: 'b' }]);
    setTime(start + 14 * day);
    loans.renew('standard', 'a'); loans.renew('standard', 'a');
  });

  it('clamps backward clocks and isolates renewed snapshots from later decisions', () => {
    const { loans, members, setTime } = setup();
    loans.checkout('standard', 'a');
    setTime(start + 2 * day);
    const snapshot = loans.renew('standard', 'a');
    snapshot.memberId = 'other'; snapshot.copyId = 'b';
    snapshot.checkoutAt.setTime(0); snapshot.dueAt.setTime(0);
    members.suspend('standard');
    setTime(start + day);
    const renewed = loans.renew('standard', 'a');
    expect(renewed).toEqual({ memberId: 'standard', copyId: 'a', checkoutAt: new Date(start), dueAt: new Date(start + 16 * day) });
  });

  it('rejects invalid clock readings without consuming the allowance', () => {
    const { loans, setTime, catalog } = setup();
    loans.checkout('standard', 'a');
    setTime(NaN);
    expect(() => loans.renew('standard', 'a')).toThrow();
    expect(catalog.getCopy('a')?.status).toBe('on loan');
    setTime(start + day);
    loans.renew('standard', 'a'); loans.renew('standard', 'a');
    expect(() => loans.renew('standard', 'a')).toThrow();
  });

  it('rejects a due-date overflow without changing the loan or copy', () => {
    const { loans, setTime, catalog } = setup();
    const max = 8640000000000000;
    setTime(max - 20 * day);
    const loan = loans.checkout('standard', 'a');
    setTime(max - 10 * day);
    expect(() => loans.renew('standard', 'a')).toThrow('Invalid clock value');
    expect(catalog.getCopy('a')?.status).toBe('on loan');
    setTime(loan.dueAt.getTime() + day);
    expect(loans.getBalance('standard')).toBe(25);
  });

  it('allows two renewals, rejects the third, and resets on recheckout', () => {
    const { loans, setTime } = setup();
    loans.checkout('standard', 'a');
    setTime(start + day);
    loans.renew('standard', 'a');
    setTime(start + 2 * day);
    const second = loans.renew('standard', 'a');
    setTime(start + 3 * day);
    expect(() => loans.renew('standard', 'a')).toThrow();
    setTime(second.dueAt.getTime() + day);
    expect(loans.getBalance('standard')).toBe(25);
    loans.returnCopy('a');
    loans.checkout('standard', 'a');
    loans.renew('standard', 'a');
    loans.renew('standard', 'a');
    expect(() => loans.renew('standard', 'a')).toThrow();
  });
});
