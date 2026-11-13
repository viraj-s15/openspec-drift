import { describe, expect, it, vi } from 'vitest';
import { Catalog } from '../src/catalog.js';
import { Members } from '../src/members.js';
import { Loans } from '../src/loans.js';

function setup(clock?: () => Date) {
  const catalog = new Catalog();
  catalog.addBook('isbn', 'Title', 'Author', ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  const members = new Members();
  members.register('standard', 'Standard', 'standard');
  members.register('premium', 'Premium', 'premium');
  return { catalog, members, loans: new Loans(catalog, members, clock) };
}

describe('loans', () => {
  it('checks out, returns, and checks out the same copy again', () => {
    const { catalog, loans } = setup();
    const loan = loans.checkout('standard', 'a');
    expect(loan).toMatchObject({ memberId: 'standard', copyId: 'a' });
    expect(catalog.getCopy('a')?.status).toBe('on loan');
    loans.returnCopy('a');
    expect(catalog.getCopy('a')?.status).toBe('available');
    expect(loans.checkout('premium', 'a').memberId).toBe('premium');
  });

  it.each([['standard', 14], ['premium', 28]] as const)('uses fixed %s duration', (member, days) => {
    const instant = new Date('2024-03-09T12:34:56.123Z');
    const clock = vi.fn(() => instant);
    const { loans } = setup(clock);
    const loan = loans.checkout(member, 'a');
    expect(clock).toHaveBeenCalledTimes(1);
    expect(loan.checkoutAt.getTime()).toBe(instant.getTime());
    expect(loan.dueAt.getTime() - loan.checkoutAt.getTime()).toBe(days * 86400000);
  });

  it('rejects invalid return clocks and clamps earlier readings for later loans', () => {
    let now = new Date('2024-01-02T00:00:00Z');
    const { loans, catalog } = setup(() => now);
    loans.checkout('standard', 'a');
    now = new Date(NaN);
    expect(() => loans.returnCopy('a')).toThrow();
    expect(catalog.getCopy('a')?.status).toBe('on loan');
    now = new Date('2024-01-01T00:00:00Z');
    loans.returnCopy('a');
    expect(loans.checkout('standard', 'a').checkoutAt.toISOString()).toBe('2024-01-02T00:00:00.000Z');
  });

  it('rejects invalid clock values without changing state', () => {
    let instant = new Date(NaN);
    const { catalog, loans } = setup(() => instant);
    expect(() => loans.checkout('standard', 'a')).toThrow();
    expect(catalog.getCopy('a')?.status).toBe('available');
    instant = new Date(8640000000000000);
    expect(() => loans.checkout('standard', 'a')).toThrow();
    expect(catalog.getCopy('a')?.status).toBe('available');
    instant = new Date('2024-01-01T00:00:00Z');
    expect(loans.checkout('standard', 'a').copyId).toBe('a');
  });

  it('isolates returned fields and dates and the clock date from stored loans', () => {
    const instant = new Date('2024-01-01T00:00:00Z');
    const { loans, catalog } = setup(() => instant);
    const loan = loans.checkout('standard', 'a');
    loan.memberId = 'premium';
    loan.copyId = 'b';
    loan.checkoutAt.setTime(0);
    loan.dueAt.setTime(0);
    instant.setTime(0);
    for (const copy of ['b', 'c', 'd', 'e']) loans.checkout('standard', copy);
    expect(() => loans.checkout('standard', 'f')).toThrow();
    loans.returnCopy('a');
    expect(catalog.getCopy('a')?.status).toBe('available');
    expect(loans.checkout('standard', 'f').copyId).toBe('f');
  });

  it.each(['standard', 'premium'])('enforces the limit for %s even when overdue and frees capacity on return', memberId => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      const { catalog, loans } = setup();
      for (const copy of ['a', 'b', 'c', 'd', 'e']) loans.checkout(memberId, copy);
      vi.setSystemTime(new Date(memberId === 'standard' ? '2024-01-16T00:00:00Z' : '2024-01-30T00:00:00Z'));
      expect(() => loans.checkout(memberId, 'f')).toThrow();
      expect(catalog.getCopy('f')?.status).toBe('available');
      loans.returnCopy('a');
      expect(loans.checkout(memberId, 'f').copyId).toBe('f');
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects suspended members but permits returns after suspension', () => {
    const { catalog, members, loans } = setup();
    loans.checkout('standard', 'a');
    members.suspend('standard');
    expect(() => loans.checkout('standard', 'b')).toThrow();
    expect(catalog.getCopy('b')?.status).toBe('available');
    loans.returnCopy('a');
    expect(catalog.getCopy('a')?.status).toBe('available');
  });

  it('guards active loans after manual status changes and returns them regardless of status', () => {
    const { catalog, loans } = setup();
    loans.checkout('standard', 'a');
    catalog.setCopyStatus('a', 'available');
    expect(() => loans.checkout('premium', 'a')).toThrow();
    expect(catalog.getCopy('a')?.status).toBe('available');
    loans.returnCopy('a');
    expect(catalog.getCopy('a')?.status).toBe('available');
    loans.checkout('premium', 'a');
    catalog.setCopyStatus('a', 'on loan');
    loans.returnCopy('a');
    expect(catalog.getCopy('a')?.status).toBe('available');
  });

  it('rejects invalid checkouts and returns without changing state', () => {
    const { catalog, loans } = setup();
    loans.checkout('standard', 'a');
    catalog.setCopyStatus('b', 'on loan');
    expect(() => loans.checkout('missing', 'c')).toThrow();
    expect(() => loans.checkout('standard', 'missing')).toThrow();
    expect(() => loans.checkout('standard', 'b')).toThrow();
    expect(() => loans.checkout('premium', 'a')).toThrow();
    expect(() => loans.returnCopy('missing')).toThrow();
    expect(() => loans.returnCopy('b')).toThrow();
    expect(catalog.getCopy('a')?.status).toBe('on loan');
    expect(catalog.getCopy('b')?.status).toBe('on loan');
    expect(catalog.getCopy('c')?.status).toBe('available');
    loans.returnCopy('a');
    expect(() => loans.returnCopy('a')).toThrow();
    expect(catalog.getCopy('a')?.status).toBe('available');
  });
});
