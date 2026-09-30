import { describe, expect, it } from 'vitest';
import {
  classifyPage,
  exportFileName,
  oldestVisibleAge,
  oldestHarvestAge,
  recentHarvestUnits,
  relativeAgeMs,
  stopDecision,
  weekOf,
} from './fb-export-helpers.mjs';

describe('Facebook export pure helpers', () => {
  const now = new Date('2026-09-30T12:00:00-07:00');

  it('builds the storage-key filename and rejects unsafe slugs', () => {
    expect(exportFileName('taylor-swifts-vault', '2026-09-30')).toBe(
      'fb-taylor-swifts-vault-2026-09-30.html',
    );
    expect(() => exportFileName('../vault', '2026-09-30')).toThrow(/slug/);
  });

  it('parses Facebook-style relative ages', () => {
    expect(relativeAgeMs('15 m', now)).toBe(15 * 60_000);
    expect(relativeAgeMs('3 h', now)).toBe(3 * 3_600_000);
    expect(relativeAgeMs('8 d', now)).toBe(8 * 86_400_000);
    expect(relativeAgeMs('2 weeks', now)).toBe(14 * 86_400_000);
    expect(oldestVisibleAge(['2 h', '8 d', '3 d'], now)).toBe(8 * 86_400_000);
  });

  it('stops safely for seven days, feed end, and the hard cap', () => {
    expect(
      stopDecision({ oldestAgeMs: 7 * 86_400_000 + 1, stagnantScrolls: 0, scrollCount: 2 }),
    ).toEqual({ stop: true, reason: 'seven-days', ageRuleMet: true });
    expect(stopDecision({ oldestAgeMs: null, stagnantScrolls: 3, scrollCount: 2 })).toEqual({
      stop: true,
      reason: 'feed-end',
      ageRuleMet: true,
    });
    expect(stopDecision({ oldestAgeMs: null, stagnantScrolls: 0, scrollCount: 250 })).toEqual({
      stop: true,
      reason: 'scroll-cap',
      ageRuleMet: false,
    });
    expect(
      stopDecision({ oldestAgeMs: null, stagnantScrolls: 0, scrollCount: 2, elapsedMs: 1_200_000 }),
    ).toEqual({ stop: true, reason: 'wall-budget', ageRuleMet: false });
  });

  it('uses own post timestamps, ignores pinned units for stopping, and filters old posts', () => {
    const units = [
      { ownTimestamp: '2 d', ignoreForAge: false },
      { ownTimestamp: '6 weeks', ignoreForAge: true },
      { ownTimestamp: null, ignoreForAge: false },
    ];
    expect(oldestHarvestAge(units, now, { ignorePinned: true })).toBe(2 * 86_400_000);
    expect(oldestHarvestAge(units, now)).toBe(42 * 86_400_000);
    expect(recentHarvestUnits(units, now)).toEqual([units[0], units[2]]);
  });

  it('classifies safety stops before ordinary login or membership states', () => {
    expect(classifyPage({ url: 'https://facebook.com/checkpoint', hasPassword: true })).toBe(
      'checkpoint',
    );
    expect(classifyPage({ url: 'https://facebook.com/two_step_verification' })).toBe('checkpoint');
    expect(classifyPage({ text: 'Complete this CAPTCHA', hasJoinGroup: true })).toBe('captcha');
    expect(classifyPage({ hasJoinGroup: true })).toBe('not-member');
    expect(classifyPage({ url: 'https://facebook.com/login' })).toBe('login');
  });

  it('classifies unavailable content separately from parser-ready pages', () => {
    expect(classifyPage({ text: "This content isn't available right now" })).toBe('unavailable');
    expect(classifyPage({ text: 'This content isn’t available' })).toBe('unavailable');
  });

  it('uses Sunday as the same-week ledger key', () => {
    expect(weekOf(new Date('2026-10-03T12:00:00'))).toBe('2026-09-27');
  });
});
