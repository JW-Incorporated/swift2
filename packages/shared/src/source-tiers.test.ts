import { describe, expect, it } from 'vitest';
import {
  computeVerificationStatus,
  ESTABLISHED_DOMAINS,
  ESTABLISHED_SOURCE_NAMES,
  isEstablishedDomain,
  isEstablishedName,
  isOfficialDomain,
  lookupOutletTier,
  OFFICIAL_DOMAINS,
  OUTLET_TIER_MAP,
  RUMOR_SOURCE_TIERS,
  VAULT_SOURCE_TIER_BY_TYPE,
} from './source-tiers';

describe('computeVerificationStatus', () => {
  it('is single_source for a brand-new story with no corroboration yet', () => {
    expect(computeVerificationStatus([])).toBe('single_source');
  });

  it('is official when any corroborating source is official-tier', () => {
    expect(computeVerificationStatus([{ tier: 'official' }])).toBe('official');
    expect(computeVerificationStatus([{ tier: 'fan' }, { tier: 'official' }])).toBe('official');
  });

  it('is corroborated at 2+ sources regardless of tier (once official is ruled out)', () => {
    expect(computeVerificationStatus([{ tier: 'established' }, { tier: 'fan' }])).toBe(
      'corroborated',
    );
    expect(computeVerificationStatus([{ tier: 'unverified' }, { tier: 'unverified' }])).toBe(
      'corroborated',
    );
  });

  it('single-established-outlet is single_source, not rumor', () => {
    expect(computeVerificationStatus([{ tier: 'established' }])).toBe('single_source');
  });

  it('single fan/unverified outlet is rumor', () => {
    expect(computeVerificationStatus([{ tier: 'fan' }])).toBe('rumor');
    expect(computeVerificationStatus([{ tier: 'unverified' }])).toBe('rumor');
  });

  it('an explicit signal always wins, never auto-computed from corroboration', () => {
    expect(
      computeVerificationStatus([{ tier: 'official' }, { tier: 'official' }], 'debunked'),
    ).toBe('debunked');
    expect(computeVerificationStatus([], 'disputed')).toBe('disputed');
  });
});

describe('lookupOutletTier / OUTLET_TIER_MAP', () => {
  it('resolves a known domain case-insensitively and www.-stripped', () => {
    expect(lookupOutletTier('billboard.com')?.tier).toBe('established');
    expect(lookupOutletTier('WWW.Billboard.com')?.name).toBe('Billboard');
  });

  it('returns undefined for an unlisted domain', () => {
    expect(lookupOutletTier('some-random-blog.example')).toBeUndefined();
  });

  it('the map only ever grants the established tier', () => {
    expect(Object.values(OUTLET_TIER_MAP).every((e) => e.tier === 'established')).toBe(true);
  });
});

describe('reputable-source allowlist (official/established domains + names)', () => {
  it('official tier is earned only by taylorswift.com', () => {
    expect(isOfficialDomain('https://www.taylorswift.com/news')).toBe(true);
    expect(isOfficialDomain('https://people.com/article')).toBe(false);
  });

  it('established tier is earned by a listed domain', () => {
    expect(isEstablishedDomain('https://www.billboard.com/x')).toBe(true);
    expect(isEstablishedDomain('https://reuters-daily.co/x')).toBe(false);
  });

  it('established tier is earned by a listed outlet name', () => {
    expect(isEstablishedName('Billboard')).toBe(true);
    expect(isEstablishedName('some rando blog')).toBe(false);
  });

  it('OFFICIAL_DOMAINS and ESTABLISHED_DOMAINS/NAMES are non-empty', () => {
    expect(OFFICIAL_DOMAINS.size).toBeGreaterThan(0);
    expect(ESTABLISHED_DOMAINS.size).toBeGreaterThan(0);
    expect(ESTABLISHED_SOURCE_NAMES.length).toBeGreaterThan(0);
  });
});

describe('VAULT_SOURCE_TIER_BY_TYPE', () => {
  it('maps official/interview to official tier', () => {
    expect(VAULT_SOURCE_TIER_BY_TYPE.official).toBe('official');
    expect(VAULT_SOURCE_TIER_BY_TYPE.interview).toBe('official');
  });

  it('maps fan_forum/social to fan tier', () => {
    expect(VAULT_SOURCE_TIER_BY_TYPE.fan_forum).toBe('fan');
    expect(VAULT_SOURCE_TIER_BY_TYPE.social).toBe('fan');
  });
});

describe('RUMOR_SOURCE_TIERS', () => {
  it('is the 4-value RumorSourceTier vocabulary', () => {
    expect(RUMOR_SOURCE_TIERS).toEqual(['official', 'established', 'tabloid', 'social']);
  });
});
