import { describe, expect, it } from 'vitest';

import { screenClownTake, type GateRetrievedItem } from './clown-gate';
import type { ClownTake } from './clown-client';

const RETRIEVED: GateRetrievedItem[] = [
  { id: 'lore:masters-buyback' },
  { id: 'theory:debut:re-record' },
];

function take(overrides: Partial<ClownTake> = {}): ClownTake {
  return {
    stance: 'My ride-or-die theory is that the debut re-record is already finished.',
    argument: 'She named one album when asked directly about the re-records.',
    counterpoint: 'She has never confirmed it herself, so this is still a guess.',
    citedIds: ['lore:masters-buyback'],
    delulu: 3,
    theoryName: 'Debutation',
    aside: 'I would stake my wig on it.',
    offLimits: false,
    ...overrides,
  };
}

describe('screenClownTake — the content re-screen', () => {
  it('passes a clean, well-grounded take', () => {
    expect(screenClownTake(take(), RETRIEVED)).toBeNull();
  });

  it('reuses clown-safety.ts screenOutput — discards a redline it already knows', () => {
    const hostile = take({ stance: "Honestly? I'm Taylor and I think the door means..." });
    const rejection = screenClownTake(hostile, RETRIEVED);
    expect(rejection).toEqual({ kind: 'redline', category: 'impersonation' });
  });

  it('the redline check runs across every prose field, not just stance', () => {
    const hostile = take({ argument: 'As Taylor, I would never confirm that.' });
    expect(screenClownTake(hostile, RETRIEVED)).toEqual({ kind: 'redline', category: 'impersonation' });
  });
});

describe('screenClownTake — required prose must be real, not blank (Codex review MAJOR 5)', () => {
  it('rejects a take with a valid citation but a blank stance', () => {
    expect(screenClownTake(take({ stance: '   ' }), RETRIEVED)).toEqual({ kind: 'empty-prose' });
  });

  it('rejects a take with a blank argument', () => {
    expect(screenClownTake(take({ argument: '' }), RETRIEVED)).toEqual({ kind: 'empty-prose' });
  });

  it('rejects a take with a blank counterpoint', () => {
    expect(screenClownTake(take({ counterpoint: '\n\t ' }), RETRIEVED)).toEqual({ kind: 'empty-prose' });
  });

  it('does not require aside or theory_name to be non-blank — only the three required fields', () => {
    expect(screenClownTake(take({ aside: '', theoryName: null }), RETRIEVED)).toBeNull();
  });
});

describe('screenClownTake — the citation check', () => {
  it('fails the whole answer on a fabricated citation id (not in the retrieved set)', () => {
    const fabricated = take({ citedIds: ['lore:masters-buyback', 'lore:this-was-never-retrieved'] });
    expect(screenClownTake(fabricated, RETRIEVED)).toEqual({
      kind: 'fabrication',
      citedId: 'lore:this-was-never-retrieved',
    });
  });

  it('passes when every cited id was actually retrieved', () => {
    const grounded = take({ citedIds: ['lore:masters-buyback', 'theory:debut:re-record'] });
    expect(screenClownTake(grounded, RETRIEVED)).toBeNull();
  });

  it('rejects a take that cites nothing at all as ungrounded', () => {
    // Reversed 2026-08-13 (review finding, PR #2087): this used to assert
    // `toBeNull()` — the loop over `citedIds` never runs on an empty array,
    // so a take with zero citations skated through with no grounding check
    // at all. That is exactly the shape the system prompt can produce: it
    // tells the model to commit to a stance and never fence-sit, while
    // telling it to admit honestly (not invent a source) when retrieval is
    // thin — together those steer toward confident, citation-free prose.
    // Letting that pass meant a reader could see confident prose backed by
    // nothing, with zero source cards to check it against. An empty
    // `citedIds` must fail the gate, not skip it.
    expect(screenClownTake(take({ citedIds: [] }), RETRIEVED)).toEqual({ kind: 'ungrounded' });
  });

  it('fails against an empty retrieved set if anything at all was cited', () => {
    expect(screenClownTake(take({ citedIds: ['lore:masters-buyback'] }), [])).toEqual({
      kind: 'fabrication',
      citedId: 'lore:masters-buyback',
    });
  });

  it('a content redline takes priority over a citation fabrication when both fire', () => {
    const both = take({
      stance: "Honestly? I'm Taylor and I think the door means...",
      citedIds: ['lore:never-retrieved'],
    });
    expect(screenClownTake(both, RETRIEVED)).toEqual({ kind: 'redline', category: 'impersonation' });
  });
});
