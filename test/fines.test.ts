import { describe, expect, it } from 'vitest';
import { Catalog } from '../src/catalog.js';
import { Members } from '../src/members.js';
import { Loans } from '../src/loans.js';

const day = 86400000;
function setup() {
  let time = Date.UTC(2024, 0, 1);
  const catalog = new Catalog();
  catalog.addBook('i', 'Title', 'Author', ['a', 'b', 'c']);
  const members = new Members();
  members.register('m', 'Member', 'standard');
  members.register('n', 'Other', 'standard');
  members.register('p', 'Premium', 'premium');
  const loans = new Loans(catalog, members, () => new Date(time));
  return { catalog, members, loans, setTime: (days: number, ms = 0) => { time = Date.UTC(2024, 0, 1) + days * day + ms; } };
}

describe('fine accounting', () => {
  it('counts completed days after the due instant and caps each loan', () => {
    const { loans, setTime } = setup();
    loans.checkout('m', 'a');
    setTime(14); expect(loans.getBalance('m')).toBe(0);
    setTime(15, -1); expect(loans.getBalance('m')).toBe(0);
    setTime(15); expect(loans.getBalance('m')).toBe(25);
    setTime(16); expect(loans.getBalance('m')).toBe(50);
    setTime(45); expect(loans.getBalance('m')).toBe(775);
    setTime(46); expect(loans.getBalance('m')).toBe(800);
    setTime(55); expect(loans.getBalance('m')).toBe(800);
    setTime(100); expect(loans.getBalance('m')).toBe(800);
    expect(() => loans.getBalance('missing')).toThrow();
  });

  it('caps standard loans independently and freezes returned loans at the cap', () => {
    const { loans, setTime } = setup();
    loans.checkout('m', 'a');
    loans.checkout('m', 'b');
    setTime(46);
    loans.returnCopy('a');
    expect(loans.getBalance('m')).toBe(1600);
    setTime(100);
    expect(loans.getBalance('m')).toBe(1600);
  });

  it('caps premium fines at 500 cents without exposing the cap on loan snapshots', () => {
    const { loans, setTime } = setup();
    const loan = loans.checkout('p', 'a');
    expect(Object.keys(loan).sort()).toEqual(['checkoutAt', 'copyId', 'dueAt', 'memberId']);
    setTime(47); expect(loans.getBalance('p')).toBe(475);
    setTime(48); expect(loans.getBalance('p')).toBe(500);
    setTime(49); expect(loans.getBalance('p')).toBe(500);
  });

  it('freezes a returned premium loan at its cap', () => {
    const { loans, setTime } = setup();
    loans.checkout('p', 'a');
    setTime(49); loans.returnCopy('a');
    setTime(100); expect(loans.getBalance('p')).toBe(500);
  });

  it('caps premium loans independently and suspends only above 500 cents', () => {
    const { loans, members, setTime } = setup();
    loans.checkout('p', 'a');
    setTime(10); loans.checkout('p', 'b');
    setTime(48); expect(loans.getBalance('p')).toBe(750);
    expect(members.get('p')?.suspended).toBe(true);
    setTime(58); expect(loans.getBalance('p')).toBe(1000);
    loans.payFine('p', 500);
    expect(loans.getBalance('p')).toBe(500);
    expect(members.get('p')?.suspended).toBe(false);
    setTime(100); expect(loans.getBalance('p')).toBe(500);
    loans.payFine('p', 500);
    expect(loans.getBalance('p')).toBe(0);
  });

  it('freezes returned fines and keeps separate loans of a reused copy', () => {
    const { loans, setTime } = setup();
    loans.checkout('m', 'a');
    setTime(17); loans.returnCopy('a');
    loans.checkout('n', 'a');
    setTime(33); loans.returnCopy('a');
    setTime(80);
    expect(loans.getBalance('m')).toBe(75);
    expect(loans.getBalance('n')).toBe(50);
  });

  it('accepts partial and full payments and accrues again afterward', () => {
    const { loans, setTime } = setup();
    loans.checkout('m', 'a');
    setTime(18); expect(loans.getBalance('m')).toBe(100);
    loans.payFine('m', 40); expect(loans.getBalance('m')).toBe(60);
    loans.payFine('m', 60); expect(loans.getBalance('m')).toBe(0);
    setTime(19); expect(loans.getBalance('m')).toBe(25);
  });

  it('rejects invalid payments without changing the balance', () => {
    const { loans, setTime } = setup();
    loans.checkout('m', 'a'); setTime(16);
    for (const amount of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, 51]) {
      expect(() => loans.payFine('m', amount)).toThrow();
      expect(loans.getBalance('m')).toBe(50);
    }
    expect(() => loans.payFine('missing', 1)).toThrow();
    setTime(NaN); expect(() => loans.payFine('m', 1)).toThrow();
    setTime(16); expect(loans.getBalance('m')).toBe(50);
  });

  it('clamps a backward return timestamp to the last observed instant', () => {
    const { loans, setTime } = setup();
    loans.checkout('m', 'a');
    setTime(17); expect(loans.getBalance('m')).toBe(75);
    setTime(14); loans.returnCopy('a');
    setTime(40); expect(loans.getBalance('m')).toBe(75);
  });

  it('does not advance observed time on a failed overpayment', () => {
    const { loans, setTime } = setup();
    loans.checkout('m', 'a');
    setTime(20); expect(() => loans.payFine('m', 999)).toThrow();
    setTime(15); expect(loans.getBalance('m')).toBe(25);
  });

  it('updates checkout eligibility as fines accrue and are paid, while allowing returns', () => {
    const { loans, members, catalog, setTime } = setup();
    loans.checkout('m', 'a');
    setTime(34); expect(members.get('m')?.suspended).toBe(false);
    setTime(35); expect(members.list()[0].suspended).toBe(true);
    expect(() => loans.checkout('m', 'b')).toThrow();
    expect(catalog.getCopy('b')?.status).toBe('available');
    members.reinstate('m'); expect(members.get('m')?.suspended).toBe(true);
    members.suspend('m'); loans.payFine('m', 25);
    expect(members.get('m')?.suspended).toBe(true);
    members.reinstate('m'); expect(members.get('m')?.suspended).toBe(false);
    loans.checkout('m', 'b');
    members.suspend('m'); loans.returnCopy('a');
    expect(catalog.getCopy('a')?.status).toBe('available');
  });

  it('rejects a second loans instance for the same member registry', () => {
    const { members, catalog } = setup();
    expect(() => new Loans(catalog, members)).toThrow();
  });

  it('adds fines across open and returned loans', () => {
    const { loans, setTime } = setup();
    loans.checkout('m', 'a');
    setTime(2); loans.checkout('m', 'b');
    setTime(26); loans.returnCopy('a');
    expect(loans.getBalance('m')).toBe(550);
    loans.payFine('m', 100);
    expect(loans.getBalance('m')).toBe(450);
    setTime(10); expect(loans.getBalance('m')).toBe(450);
  });
});
