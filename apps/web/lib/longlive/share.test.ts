import { describe, expect, it } from 'vitest';
import { momentShareCopy } from './share';

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
    expect(copy.text.length).toBeLessThanOrEqual('1989 arrives (1989, October 2014) — '.length + 181);
  });
});
