import { describe, expect, it } from 'vitest';
import {
  classifyPage,
  exportFileName,
  harvestCoverageAge,
  oldestVisibleAge,
  oldestHarvestAge,
  recentHarvestUnits,
  relativeAgeMs,
  stopDecision,
  trailingOldBoundary,
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
    expect(relativeAgeMs('October 13', now)).toBeNull();
    expect(relativeAgeMs('October 24', now)).toBeNull();
    expect(relativeAgeMs('August 18, 2014', now)).toBeGreaterThan(4_000 * 86_400_000);
    expect(oldestVisibleAge(['2 h', '8 d', '3 d'], now)).toBe(8 * 86_400_000);
  });

  it('stops safely for seven days, feed end, and the hard cap', () => {
    expect(stopDecision({ ageStopMet: true, stagnantScrolls: 0, scrollCount: 2 })).toEqual({
      stop: true,
      reason: 'seven-days',
      ageRuleMet: true,
    });
    expect(stopDecision({ stagnantScrolls: 3, scrollCount: 2 })).toEqual({
      stop: true,
      reason: 'feed-end',
      ageRuleMet: true,
    });
    expect(stopDecision({ stagnantScrolls: 0, scrollCount: 250 })).toEqual({
      stop: true,
      reason: 'scroll-cap',
      ageRuleMet: false,
    });
    expect(stopDecision({ stagnantScrolls: 0, scrollCount: 2, elapsedMs: 1_200_000 })).toEqual({
      stop: true,
      reason: 'wall-budget',
      ageRuleMet: false,
    });
  });

  it('drops an isolated mid-feed old unit from the output without stopping the feed', () => {
    const units = [
      { position: 1, ownTimestamp: '3 h', ignoreForAge: false },
      { position: 2, ownTimestamp: 'August 18, 2014', ignoreForAge: false },
      { position: 3, ownTimestamp: '3 h', ignoreForAge: false },
    ];
    expect(trailingOldBoundary(units, now)).toBeNull();
    expect(recentHarvestUnits(units, now)).toEqual([units[0], units[2]]);
    expect(harvestCoverageAge(units, now, 'wall-budget')).toBe(3 * 3_600_000);
  });

  // Codex round 3 #6: fewer than three trailing old posts do not stop the feed, but a known old
  // post still never reaches the output. Unreadable timestamps are kept; a pinned unit with a
  // readable old timestamp is dropped too (Codex round 4 #3: pinned only affects the boundary).
  it('filters every known unit older than seven days, pinned or not, boundary or not', () => {
    const units = [
      { position: 1, ownTimestamp: '1 h', ignoreForAge: false },
      { position: 2, ownTimestamp: '30 d', ignoreForAge: true },
      { position: 3, ownTimestamp: null, ignoreForAge: false },
      { position: 4, ownTimestamp: '9 d', ignoreForAge: false },
      { position: 5, ownTimestamp: '8 d', ignoreForAge: false },
    ];
    expect(trailingOldBoundary(units, now)).toBeNull();
    expect(recentHarvestUnits(units, now)).toEqual([units[0], units[2]]);
    expect(recentHarvestUnits([units[0], units[3]], now)).toEqual([units[0]]);
  });

  it('ignores a future month-day when calculating capped coverage', () => {
    const units = [
      { position: 1, ownTimestamp: '2 h', ignoreForAge: false },
      { position: 2, ownTimestamp: 'October 24', ignoreForAge: false },
      { position: 3, ownTimestamp: '4 h', ignoreForAge: false },
    ];
    expect(trailingOldBoundary(units, now)).toBeNull();
    expect(harvestCoverageAge(units, now, 'scroll-cap')).toBe(4 * 3_600_000);
  });

  it('stops on three trailing readable old units and excludes only that tail', () => {
    const units = [
      { position: 1, ownTimestamp: '2 h', ignoreForAge: false },
      { position: 2, ownTimestamp: 'August 18, 2014', ignoreForAge: false },
      { position: 3, ownTimestamp: '4 h', ignoreForAge: false },
      { position: 4, ownTimestamp: '8 d', ignoreForAge: false },
      { position: 5, ownTimestamp: null, ignoreForAge: false },
      { position: 6, ownTimestamp: '9 d', ignoreForAge: false },
      { position: 7, ownTimestamp: '10 d', ignoreForAge: false },
    ];
    expect(trailingOldBoundary(units, now)).toEqual({
      boundaryIndex: 3,
      coverageAgeMs: 8 * 86_400_000,
    });
    // units[1] is readable and old: excluded by the independent age filter, not the boundary.
    expect(recentHarvestUnits(units, now)).toEqual([units[0], units[2], units[4]]);
    expect(harvestCoverageAge(units, now, 'seven-days')).toBe(8 * 86_400_000);
  });

  it('ignores pinned units for the stop boundary without changing legacy age inspection', () => {
    const units = [
      { position: 1, ownTimestamp: '2 d', ignoreForAge: false },
      { position: 2, ownTimestamp: '6 weeks', ignoreForAge: true },
      { position: 3, ownTimestamp: null, ignoreForAge: false },
    ];
    expect(oldestHarvestAge(units, now, { ignorePinned: true })).toBe(2 * 86_400_000);
    expect(oldestHarvestAge(units, now)).toBe(42 * 86_400_000);
    expect(trailingOldBoundary(units, now)).toBeNull();
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
