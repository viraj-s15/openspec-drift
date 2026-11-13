import { describe, expect, it } from 'vitest';
import { Members, type MemberTier } from '../src/members.js';

describe('member registration', () => {
  it.each(['standard', 'premium'] as const)('registers an active %s member', tier => {
    const members = new Members();
    members.register('1', 'Ada', tier);
    expect(members.get('1')).toEqual({ id: '1', name: 'Ada', tier, suspended: false });
  });

  it('rejects duplicate IDs without changing the existing member', () => {
    const members = new Members();
    members.register('1', 'Ada', 'standard');
    expect(() => members.register('1', 'Other', 'premium')).toThrow();
    expect(members.get('1')).toEqual({ id: '1', name: 'Ada', tier: 'standard', suspended: false });
  });

  it('rejects unsupported runtime tiers without changing the registry', () => {
    const members = new Members();
    members.register('1', 'Ada', 'standard');
    expect(() => members.register('2', 'Other', 'gold' as MemberTier)).toThrow();
    expect(members.get('2')).toBeUndefined();
    expect(members.get('1')).toEqual({ id: '1', name: 'Ada', tier: 'standard', suspended: false });
  });
});

describe('member retrieval', () => {
  it('looks up an existing member by exact ID and returns its current status', () => {
    const members = new Members();
    members.register('Ada', 'Ada', 'premium');
    members.suspend('Ada');
    expect(members.get('Ada')).toEqual({ id: 'Ada', name: 'Ada', tier: 'premium', suspended: true });
    expect(members.get('ada')).toBeUndefined();
  });

  it('returns undefined for an unknown ID', () => {
    expect(new Members().get('missing')).toBeUndefined();
  });

  it('lists all members once in registration order, including suspended members', () => {
    const members = new Members();
    members.register('2', 'Ada', 'standard');
    members.register('1', 'Grace', 'premium');
    members.suspend('2');
    expect(members.list()).toEqual([
      { id: '2', name: 'Ada', tier: 'standard', suspended: true },
      { id: '1', name: 'Grace', tier: 'premium', suspended: false },
    ]);
  });

  it('lists an empty registry', () => {
    expect(new Members().list()).toEqual([]);
  });

  it('returns detached lookup and list snapshots', () => {
    const members = new Members();
    members.register('1', 'Ada', 'standard');
    const lookup = members.get('1')!;
    const list = members.list();
    lookup.name = 'Changed';
    list[0].tier = 'premium';
    list[0].suspended = true;
    list.length = 0;
    expect(members.get('1')).toEqual({ id: '1', name: 'Ada', tier: 'standard', suspended: false });
    expect(members.list()).toHaveLength(1);
  });
});

describe('member suspension', () => {
  it('suspends and reinstates without changing other fields', () => {
    const members = new Members();
    members.register('1', 'Ada', 'premium');
    members.suspend('1');
    expect(members.get('1')).toEqual({ id: '1', name: 'Ada', tier: 'premium', suspended: true });
    members.reinstate('1');
    expect(members.get('1')).toEqual({ id: '1', name: 'Ada', tier: 'premium', suspended: false });
  });

  it('allows repeated operations without changing the record', () => {
    const members = new Members();
    members.register('1', 'Ada', 'standard');
    const active = members.get('1');
    members.reinstate('1');
    expect(members.get('1')).toEqual(active);
    members.suspend('1');
    const suspended = members.get('1');
    members.suspend('1');
    expect(members.get('1')).toEqual(suspended);
  });

  it('rejects unknown status updates without changing the registry', () => {
    const members = new Members();
    members.register('1', 'Ada', 'standard');
    const before = members.list();
    expect(() => members.suspend('missing')).toThrow();
    expect(members.list()).toEqual(before);
    expect(() => members.reinstate('missing')).toThrow();
    expect(members.list()).toEqual(before);
  });
});
