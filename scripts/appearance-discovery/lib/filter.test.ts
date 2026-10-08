import { describe, expect, it } from 'vitest';
import { isFresh, matchRule } from './filter.mjs';

const entry = (title: string, description = '') => ({ videoId: 'AAAAAAAAAAA', title, description, published: '', url: '' });
const CHANNEL = { allUploads: false };
const OFFICIAL = { allUploads: true };

describe('matchRule — precision over recall (rules documented in channels.mjs)', () => {
  it("passes every upload on Taylor's own channel", () => {
    expect(matchRule(entry('BTS: shooting the new video'), OFFICIAL)).toBe('all-uploads');
  });

  it('matches "Taylor Swift" case-insensitively in the title', () => {
    expect(matchRule(entry('TAYLOR SWIFT performs live'), CHANNEL)).toBe('taylor-swift');
    expect(matchRule(entry('taylor  swift stops by'), CHANNEL)).toBe('taylor-swift');
  });

  it('matches capitalised word "Swift" in the title', () => {
    expect(matchRule(entry('Swift Talks Eras'), CHANNEL)).toBe('swift-title');
  });

  // Regression: the first live dry run (2026-08-12) matched GMA's "Rod Stewart
  // calls off remaining tour dates" because its description is a Pop News
  // segment list that happened to include a Taylor item. Descriptions on news
  // and talk-show channels are roundups and boilerplate, so a name in one is
  // not an appearance. Title only. See channels.mjs.
  it('NEVER matches on the description, however strong the phrase', () => {
    expect(
      matchRule(
        entry(
          'Rod Stewart calls off remaining tour dates to recover from medical procedure',
          'Plus, Taylor Swift to be inducted into the Nashville Songwriters Hall of Fame; 00:57 Taylor Swift makes songwriter history',
        ),
        CHANNEL,
      ),
    ).toBeNull();
    expect(matchRule(entry('Monologue', 'Tonight: taylor swift stops by.'), CHANNEL)).toBeNull();
    expect(matchRule(entry('Interview night', 'Swift appears'), CHANNEL)).toBeNull();
  });

  it('rejects Swiftie, lowercase adjectives, and unrelated titles', () => {
    expect(matchRule(entry('Swifties react to the finale'), CHANNEL)).toBeNull();
    expect(matchRule(entry('a swift reaction to the news'), CHANNEL)).toBeNull();
    expect(matchRule(entry('Best of late night this week'), CHANNEL)).toBeNull();
  });
});

describe('isFresh — the freshness window', () => {
  const NOW = Date.parse('2026-08-12T12:00:00Z');
  const days = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

  it('accepts inside the window, rejects outside it', () => {
    expect(isFresh(days(1), NOW, 30)).toBe(true);
    expect(isFresh(days(29.9), NOW, 30)).toBe(true);
    expect(isFresh(days(31), NOW, 30)).toBe(false);
  });

  it('tolerates ≤1 day of clock skew but not future-dated entries beyond it', () => {
    expect(isFresh(days(-0.5), NOW, 30)).toBe(true);
    expect(isFresh(days(-3), NOW, 30)).toBe(false);
  });

  it('rejects unparseable dates — an undatable video cannot be placed', () => {
    expect(isFresh('', NOW, 30)).toBe(false);
    expect(isFresh('not a date', NOW, 30)).toBe(false);
  });
});
