import { describe, expect, it } from 'vitest';

import { NAME_REGISTRY, resolveTheoryName, type NamedReceipt } from './clown-names';

function receipt(id: string): NamedReceipt {
  return { id };
}

describe('theory naming — deterministic reuse without cross-session memory', () => {
  it('has the six canonical names', () => {
    expect(NAME_REGISTRY.map((e) => e.name)).toEqual([
      'Debutation',
      'The Sourdough Fiasco',
      'The Twelve Doors',
      'The Machine Question',
      'The Twelve-Twelve Cipher',
      'The evermore Hill',
    ]);
  });

  it('pins the canonical name from a cited receipt', () => {
    const got = resolveTheoryName('anything at all', [receipt('lore:rep-tv-debut-tv')], 'Some Other Name');
    expect(got).toEqual({ name: 'Debutation', canonical: true });
  });

  it('pins the canonical name from the question alone', () => {
    const got = resolveTheoryName('will we ever get rep tv', [], null);
    expect(got?.name).toBe('Debutation');
    expect(got?.canonical).toBe(true);
  });

  it('the canonical name beats whatever the model coined — same theory, same name', () => {
    const a = resolveTheoryName('super bowl theory', [], 'Bot Coined A');
    const b = resolveTheoryName('the halftime clue trail', [], 'Bot Coined B');
    expect(a?.name).toBe(b?.name);
    expect(a?.canonical).toBe(true);
  });

  it('falls back to the model name when nothing canonical matches', () => {
    const got = resolveTheoryName('what about the cardigan sleeve', [], 'The Sleeve Hypothesis');
    expect(got).toEqual({ name: 'The Sleeve Hypothesis', canonical: false });
  });

  it('rejects a model "name" that is really a sentence', () => {
    const long = 'x'.repeat(200);
    expect(resolveTheoryName('no match here at all', [], long)).toBeNull();
    expect(resolveTheoryName('no match here at all', [], 'a')).toBeNull();
    expect(resolveTheoryName('no match here at all', [], 42)).toBeNull();
    expect(resolveTheoryName('no match here at all', [], null)).toBeNull();
  });

  it('every registry entry is reachable', () => {
    for (const entry of NAME_REGISTRY) {
      const viaId = entry.receiptIds?.[0]
        ? resolveTheoryName('', [receipt(entry.receiptIds[0])], null)
        : null;
      const viaKeyword = entry.keywords?.[0] ? resolveTheoryName(entry.keywords[0], [], null) : null;
      expect(viaId?.name ?? viaKeyword?.name, `${entry.name} unreachable`).toBe(entry.name);
    }
  });

  it('the label matches the matched receipt, not a default (#1996)', () => {
    // The AI receipt must surface as The Machine Question even though Debutation
    // sits earlier in the registry — the theory a take stands on decides its
    // name, so nothing collapses to the first entry any more.
    expect(resolveTheoryName('anything', [receipt('lore:swifties-against-ai')], null)?.name).toBe(
      'The Machine Question',
    );
    expect(
      resolveTheoryName('anything', [receipt('lore:tloas-countdown-announcement')], null)?.name,
    ).toBe('The Twelve-Twelve Cipher');
    // The evermore hill is reachable by its own receipts, name and all.
    expect(
      resolveTheoryName('anything', [receipt('moment:vault-evermore-folklores-sister-arrives')], null)
        ?.name,
    ).toBe('The evermore Hill');
  });

  it('picks the theory with the most cited-receipt overlap on a tie of one', () => {
    // A single unambiguous AI receipt resolves to The Machine Question, not the
    // first registry entry — that overlap-count logic is the thing that mattered.
    const single = resolveTheoryName('', [receipt('lore:swifties-against-ai')], null);
    expect(single?.canonical).toBe(true);
    expect(single?.name).toBe('The Machine Question');
  });

  it('is deterministic — same inputs, same output', () => {
    const a = resolveTheoryName('rep tv when', [receipt('lore:rep-tv-debut-tv')], null);
    const b = resolveTheoryName('rep tv when', [receipt('lore:rep-tv-debut-tv')], null);
    expect(a).toEqual(b);
  });
});
