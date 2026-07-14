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
});
