import { describe, expect, it } from 'vitest';
import { COMMUNITIES, communitiesByNiche, communitiesByPlatform } from './communities';

describe('COMMUNITIES', () => {
  it('has the real curated count — asserted exactly so a silent drop/pad fails loudly', () => {
    expect(COMMUNITIES.length).toBe(30);
  });

  it('never substitutes 0 or an estimate for a missing member count', () => {
    for (const c of COMMUNITIES) {
      if (c.memberCount === null) continue;
      expect(c.memberCount).toBeGreaterThan(0);
    }
  });

  it('has 15 entries with a null member_count (Reddit-blocked or otherwise uncounted)', () => {
    expect(COMMUNITIES.filter((c) => c.memberCount === null).length).toBe(15);
  });

  it('carries verification.status on every entry — never flattened away', () => {
    const validStatuses = new Set([
      'verified-live',
      'third-party-cited',
      'listed-only',
      'blocked-unverified',
    ]);
    for (const c of COMMUNITIES) {
      expect(validStatuses.has(c.verification.status)).toBe(true);
    }
  });

  it('carries flags through as a real (possibly empty) array on every entry', () => {
    for (const c of COMMUNITIES) {
      expect(Array.isArray(c.flags)).toBe(true);
    }
  });

  it('surfaces the impersonator-spinoff warning on Taylor Swift\'s Vault', () => {
    const vault = COMMUNITIES.find((c) => c.name === "Taylor Swift's Vault");
    expect(vault?.flags.some((f) => /spinoff|spin-off|impersonat/i.test(f))).toBe(true);
  });

  it('surfaces the reportedly-private warning on r/GaylorSwift', () => {
    const gaylor = COMMUNITIES.find((c) => c.name === 'r/GaylorSwift');
    expect(gaylor?.flags.some((f) => /private/i.test(f))).toBe(true);
  });
});

describe('communitiesByPlatform', () => {
  it('matches the real platform breakdown', () => {
    const groups = communitiesByPlatform();
    expect(groups.get('Discord')?.length).toBe(11);
    expect(groups.get('Reddit')?.length).toBe(3);
    expect(groups.get('Forum')?.length).toBe(5);
    expect(groups.get('Facebook')?.length).toBe(5);
    expect(groups.get('Tumblr')?.length).toBe(2);
    expect(groups.get('AO3')?.length).toBe(2);
    expect(groups.get('Steam')?.length).toBe(1);
    expect(groups.get('Wattpad')?.length).toBe(1);
  });

  it('sorts each group by hypeScore descending', () => {
    const groups = communitiesByPlatform();
    for (const group of groups.values()) {
      for (let i = 1; i < group.length; i++) {
        expect(group[i - 1].hypeScore).toBeGreaterThanOrEqual(group[i].hypeScore);
      }
    }
  });

  it('every community appears in exactly one platform group', () => {
    const groups = communitiesByPlatform();
    const total = [...groups.values()].reduce((sum, g) => sum + g.length, 0);
    expect(total).toBe(COMMUNITIES.length);
  });
});

describe('communitiesByNiche', () => {
  it('groups into the real 9 curated niches', () => {
    const groups = communitiesByNiche();
    expect(groups.size).toBe(9);
  });

  it('sorts each group by hypeScore descending', () => {
    const groups = communitiesByNiche();
    for (const group of groups.values()) {
      for (let i = 1; i < group.length; i++) {
        expect(group[i - 1].hypeScore).toBeGreaterThanOrEqual(group[i].hypeScore);
      }
    }
  });

  it('every community appears in exactly one niche group', () => {
    const groups = communitiesByNiche();
    const total = [...groups.values()].reduce((sum, g) => sum + g.length, 0);
    expect(total).toBe(COMMUNITIES.length);
  });
});
