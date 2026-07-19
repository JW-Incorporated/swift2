import { describe, expect, it } from 'vitest';
import { momentShareCopy, topbarShareTarget } from './share';

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

  // #492: null = render the button disabled, never hide it (see the JSDoc).
  it('returns null in threads mode with no thread open (gallery or crossing)', () => {
    expect(topbarShareTarget('threads', 'tloas', null)).toBeNull();
  });

  // #684: the landing page renders no TopBar; the helper stays total anyway.
  it('returns null on the landing page', () => {
    expect(topbarShareTarget('landing', 'tloas', null)).toBeNull();
    expect(topbarShareTarget('landing', 'tloas', 'love-story')).toBeNull();
  });
});
