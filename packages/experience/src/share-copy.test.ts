import { describe, expect, it } from 'vitest';
import {
  buildShareUrl,
  clownbotShareCopy,
  communityShareCopy,
  merchShareCopy,
  momentShareCopy,
  moodShareCopy,
  siteShareCopy,
  theoryGuideShareCopy,
  threadsGalleryShareCopy,
  topbarShareTarget,
  trackGuideShareCopy,
  trackShareCopy,
} from './share-copy';

// OS-038 — these mirror apps/web/lib/longlive/share.test.ts's coverage
// exactly (that file now re-exports this module unchanged), plus new
// coverage for buildShareUrl, which used to live only inline in
// ShareSheet.tsx with no direct unit test of its own.

describe('momentShareCopy', () => {
  it('builds title and self-contained text from the moment + era', () => {
    const copy = momentShareCopy(
      {
        title: 'The interrupted speech',
        summary: 'A VMAs moment becomes pop-culture lore and a defining public turning point.',
        dateLabel: 'September 2009',
      },
      { name: 'Fearless' },
    );
    expect(copy.title).toBe('The interrupted speech — Fearless · Long Live');
    expect(copy.text).toBe(
      'The interrupted speech (Fearless, September 2009) — A VMAs moment becomes pop-culture lore and a defining public turning point.',
    );
  });

  it('carries the sub-confirmed qualifier into outbound text (rumor tier)', () => {
    const copy = momentShareCopy(
      {
        title: 'The wedding gown',
        summary: 'A custom Dior commission, per reporting.',
        dateLabel: 'July 3, 2026',
        confidence: 'reputable_reporting',
      },
      { name: 'The Life of a Showgirl' },
    );
    expect(copy.text).toBe(
      'The wedding gown (The Life of a Showgirl, July 3, 2026) [reported — not confirmed] — A custom Dior commission, per reporting.',
    );
  });
});

describe('trackShareCopy', () => {
  it('builds title + self-contained text from the song note (#707)', () => {
    const copy = trackShareCopy(
      { title: 'All Too Well', note: 'The ten-minute reclaiming of the scarf.' },
      { name: 'Red' },
    );
    expect(copy.title).toBe('All Too Well — Red · Long Live');
    expect(copy.text).toBe('All Too Well (Red) — The ten-minute reclaiming of the scarf.');
  });
});

describe('trackGuideShareCopy / theoryGuideShareCopy / siteShareCopy', () => {
  it('name the album and year / frame the decode / describe the front door', () => {
    expect(trackGuideShareCopy({ album: '1989', yearLabel: '2014' }).text).toContain(
      'Every song on 1989 (2014)',
    );
    expect(theoryGuideShareCopy({ shortName: 'Reputation' }).text).toContain('sourced and graded');
    expect(siteShareCopy().text).toContain('any era');
  });
});

describe('threadsGalleryShareCopy / moodShareCopy / clownbotShareCopy / communityShareCopy / merchShareCopy', () => {
  it('each describe their surface, never user input (#2105)', () => {
    expect(threadsGalleryShareCopy().title).toContain('Threads');
    expect(moodShareCopy().title).toContain('Mood');
    expect(clownbotShareCopy().title).toContain('Clownbot');
    expect(communityShareCopy().title).toContain('communities');
    expect(merchShareCopy().title).toContain('Merch');
  });
});

describe('topbarShareTarget', () => {
  it('shares the era in era mode, the gallery/thread in threads mode, and the bare surface for mood/clownbot/community/merch', () => {
    expect(topbarShareTarget('era', 'tloas', null)).toEqual({ kind: 'era', eraId: 'tloas' });
    expect(topbarShareTarget('threads', 'tloas', 'love-story')).toEqual({
      kind: 'lens',
      lensId: 'love-story',
    });
    expect(topbarShareTarget('threads', 'tloas', null)).toEqual({ kind: 'threads' });
    expect(topbarShareTarget('mood', 'tloas', null)).toEqual({ kind: 'mood' });
    expect(topbarShareTarget('clownbot', 'tloas', null)).toEqual({ kind: 'clownbot' });
    expect(topbarShareTarget('community', 'tloas', null)).toEqual({ kind: 'community' });
    expect(topbarShareTarget('merch', 'tloas', null)).toEqual({ kind: 'merch' });
  });
});

describe('buildShareUrl', () => {
  const base = 'https://www.longlivets.com';

  it('builds every target kind\'s query-param shape, matching ShareSheet.tsx\'s shareUrl builder', () => {
    expect(buildShareUrl({ kind: 'item', itemId: 'm1' }, base)).toBe(`${base}?item=m1`);
    expect(buildShareUrl({ kind: 'lens', lensId: 'love-story' }, base)).toBe(`${base}?lens=love-story`);
    expect(buildShareUrl({ kind: 'era', eraId: 'tloas' }, base)).toBe(`${base}?era=tloas`);
    expect(buildShareUrl({ kind: 'track', eraId: 'red', trackKey: 'red::5::all too well' }, base)).toBe(
      `${base}?song=${encodeURIComponent('red::5::all too well')}`,
    );
    expect(buildShareUrl({ kind: 'trackGuide', eraId: '1989' }, base)).toBe(`${base}?guide=1989`);
    expect(buildShareUrl({ kind: 'theoryGuide', eraId: 'reputation' }, base)).toBe(`${base}?theories=reputation`);
    expect(buildShareUrl({ kind: 'threads' }, base)).toBe(`${base}?mode=threads`);
    expect(buildShareUrl({ kind: 'mood' }, base)).toBe(`${base}?mode=mood`);
    expect(buildShareUrl({ kind: 'clownbot' }, base)).toBe(`${base}?mode=clownbot`);
    expect(buildShareUrl({ kind: 'community' }, base)).toBe(`${base}?mode=community`);
    expect(buildShareUrl({ kind: 'merch' }, base)).toBe(`${base}?mode=merch`);
    expect(buildShareUrl({ kind: 'site' }, base)).toBe(base);
  });

  it('strips a trailing slash from baseUrl before appending params', () => {
    expect(buildShareUrl({ kind: 'era', eraId: 'tloas' }, `${base}/`)).toBe(`${base}?era=tloas`);
  });
});
