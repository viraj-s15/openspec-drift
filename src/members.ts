export type MemberTier = 'standard' | 'premium';

export interface Member {
  id: string;
  name: string;
  tier: MemberTier;
  suspended: boolean;
}

export class Members {
  private readonly members = new Map<string, Member>();
  private fineBalance?: (id: string) => number;

  registerFineProvider(provider: (id: string) => number): void {
    if (this.fineBalance) throw new Error('Fine provider already registered');
    this.fineBalance = provider;
  }

  has(id: string): boolean {
    return this.members.has(id);
  }

  private snapshot(member: Member): Member {
    const balance = this.fineBalance?.(member.id) ?? 0;
    return { ...member, suspended: member.suspended || balance > 500 };
  }

  register(id: string, name: string, tier: MemberTier): void {
    if (this.members.has(id)) throw new Error('Member ID already exists');
    if (tier !== 'standard' && tier !== 'premium') throw new Error('Unsupported member tier');
    this.members.set(id, { id, name, tier, suspended: false });
  }

  get(id: string): Member | undefined {
    const member = this.members.get(id);
    return member && this.snapshot(member);
  }

  list(): Member[] {
    return [...this.members.values()].map(member => this.snapshot(member));
  }

  suspend(id: string): void {
    this.setSuspended(id, true);
  }

  reinstate(id: string): void {
    this.setSuspended(id, false);
  }

  private setSuspended(id: string, suspended: boolean): void {
    const member = this.members.get(id);
    if (!member) throw new Error('Unknown member');
    member.suspended = suspended;
  }
}
