import { describe, expect, it } from 'vitest';
import {
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
} from './share';

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
    // Share copy leaves the app — no downstream banner can correct the
    // framing, so the qualifier must travel in the text itself.
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

  it('adds no qualifier for confirmed-tier or unlabeled moments', () => {
    const confirmed = momentShareCopy(
      { title: 'T', summary: 'S.', dateLabel: 'July 2026', confidence: 'official' },
      { name: 'Era' },
    );
    expect(confirmed.text).toBe('T (Era, July 2026) — S.');
  });

  it('truncates a long summary on a word boundary with an ellipsis', () => {
    const long =
      'She burned it all down and rebuilt as a pop star with clean synth-pop, a Polaroid aesthetic, and the squad era that ruled the mid-2010s, plus a whole lot more words to push this well past the share limit for body text.';
    const copy = momentShareCopy(
      { title: '1989 arrives', summary: long, dateLabel: 'October 2014' },
      { name: '1989' },
    );
    expect(copy.text.startsWith('1989 arrives (1989, October 2014) — She burned it all down')).toBe(
      true,
    );
    expect(copy.text.endsWith('…')).toBe(true);
    // prefix + truncated summary stays comfortably short for share targets
    expect(copy.text.length).toBeLessThanOrEqual(
      '1989 arrives (1989, October 2014) — '.length + 181,
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

describe('trackGuideShareCopy', () => {
  it('names the album and its year (#707)', () => {
    const copy = trackGuideShareCopy({ album: '1989', yearLabel: '2014' });
    expect(copy.title).toBe('1989 — track guide · Long Live');
    expect(copy.text).toContain('Every song on 1989 (2014)');
  });
});

describe('theoryGuideShareCopy', () => {
  it('frames the era decode without asserting any theory as fact (#707)', () => {
    const copy = theoryGuideShareCopy({ shortName: 'Reputation' });
    expect(copy.title).toBe('Reputation decoded — theories & Easter eggs · Long Live');
    expect(copy.text).toContain('sourced and graded');
  });
});

describe('siteShareCopy', () => {
  it('is the bare front-door copy (#707)', () => {
    const copy = siteShareCopy();
    expect(copy.title).toContain('Long Live');
    expect(copy.text).toContain('any era');
  });
});

describe('threadsGalleryShareCopy', () => {
  it('describes the gallery, not any one thread (#2105)', () => {
    const copy = threadsGalleryShareCopy();
    expect(copy.title).toContain('Threads');
    expect(copy.text).toContain('Long Live');
  });
});

describe('moodShareCopy', () => {
  it('describes the surface, carries no user input (#2105)', () => {
    const copy = moodShareCopy();
    expect(copy.title).toContain('Mood');
    expect(copy.text).toContain('Long Live');
  });
});

describe('clownbotShareCopy', () => {
  it('describes the surface, carries no user input (#2105)', () => {
    const copy = clownbotShareCopy();
    expect(copy.title).toContain('Clownbot');
    expect(copy.text).toContain('Long Live');
  });
});

describe('communityShareCopy', () => {
  it('describes the fan-community directory, carries no user input (#2105)', () => {
    const copy = communityShareCopy();
    expect(copy.title).toContain('communities');
    expect(copy.text).toContain('Long Live');
  });
});

describe('merchShareCopy', () => {
  it('describes the merch directory, carries no user input (#2105)', () => {
    const copy = merchShareCopy();
    expect(copy.title).toContain('Merch');
    expect(copy.text).toContain('Long Live');
  });
});

describe('topbarShareTarget', () => {
  it('shares the era in era mode', () => {
    expect(topbarShareTarget('era', 'tloas', null)).toEqual({ kind: 'era', eraId: 'tloas' });
  });

  it('shares the open thread in threads mode', () => {
    expect(topbarShareTarget('threads', 'tloas', 'love-story')).toEqual({
      kind: 'lens',
      lensId: 'love-story',
    });
  });

  // #2105: the gallery itself is now a real target, not a disabled button.
  it('shares the gallery in threads mode with no thread open', () => {
    expect(topbarShareTarget('threads', 'tloas', null)).toEqual({ kind: 'threads' });
  });

  // #2105: Mood and Clownbot share the surface as a destination — never the
  // conversation, so the target carries no user input at all.
  it('shares the surface (not the conversation) in mood mode', () => {
    expect(topbarShareTarget('mood', 'tloas', null)).toEqual({ kind: 'mood' });
  });

  it('shares the surface (not the conversation) in clownbot mode', () => {
    expect(topbarShareTarget('clownbot', 'tloas', null)).toEqual({ kind: 'clownbot' });
  });

  // #2105: Community and Merch are top-level tabs too, so they share the
  // same destination-only shape as the other no-user-input surfaces.
  it('shares the directory in community mode', () => {
    expect(topbarShareTarget('community', 'tloas', null)).toEqual({ kind: 'community' });
  });

  it('shares the directory in merch mode', () => {
    expect(topbarShareTarget('merch', 'tloas', null)).toEqual({ kind: 'merch' });
  });
});
