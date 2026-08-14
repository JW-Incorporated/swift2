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

  it('passes a take that cites nothing at all', () => {
    expect(screenClownTake(take({ citedIds: [] }), RETRIEVED)).toBeNull();
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
