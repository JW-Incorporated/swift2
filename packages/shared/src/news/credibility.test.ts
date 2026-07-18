import { describe, expect, it } from 'vitest';
import { computeVerificationStatus } from './credibility';

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
