import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  significanceHoldReason,
  significanceRuleHold,
  type SignificanceRuleInput,
} from './significance-rules';

interface LabeledRow extends SignificanceRuleInput {
  label: 'IMPORTANT' | 'MARGINAL' | 'NOISE';
}

const HOLDOUT: LabeledRow[] = readFileSync(
  new URL('../../../../scripts/news/fixtures/significance-holdout.jsonl', import.meta.url),
  'utf8',
).trim().split('\n').map((line) => {
  const row = JSON.parse(line) as LabeledRow & { outlet: string };
  return { ...row, status: 'reported', facts: [], sources: [] };
});

const ROWS: LabeledRow[] = readFileSync(
  new URL('../../../../scripts/news/fixtures/significance-labels.jsonl', import.meta.url),
  'utf8',
).trim().split('\n').map((line) => JSON.parse(line) as LabeledRow);

function item(overrides: Partial<SignificanceRuleInput>): SignificanceRuleInput {
  return { headline: 'Taylor announces a thing', category: 'release', status: 'reported', facts: [], sources: [], ...overrides };
}

describe('significanceRuleHold on the labeled live corpus', () => {
  it('never holds an IMPORTANT item', () => {
    const wrong = ROWS.filter((row) => row.label === 'IMPORTANT' && significanceRuleHold(row));
    expect(wrong.map((row) => row.headline)).toEqual([]);
  });

  it('never holds an IMPORTANT item of the held-out set', () => {
    const wrong = HOLDOUT.filter((row) => row.label === 'IMPORTANT' && significanceRuleHold(row));
    expect(wrong.map((row) => row.headline)).toEqual([]);
  });

  it('holds at least 70% of NOISE without the judge', () => {
    const noise = ROWS.filter((row) => row.label === 'NOISE');
    const held = noise.filter((row) => significanceRuleHold(row));
    expect(noise.length).toBeGreaterThan(40);
    expect(held.length / noise.length).toBeGreaterThanOrEqual(0.7);
  });
});

describe('significanceRuleHold rules', () => {
  it('holds an anonymous-source wedding story but not a confirmed one', () => {
    const headline = 'Insiders say the wedding guests grumbled';
    expect(significanceRuleHold(item({ headline, category: 'relationship' }))).toBe('anonymous_relationship');
    expect(significanceRuleHold(item({ headline, category: 'relationship', status: 'confirmed' }))).toBeUndefined();
  });

  it('holds a sighting or fashion item with no tier-1/2 event, keeps one tied to an awards show', () => {
    expect(significanceRuleHold(item({ headline: 'Taylor steps out in NYC in a plaid coat', category: 'sighting' }))).toBe('sighting_no_event');
    expect(significanceRuleHold(item({ headline: 'Taylor wears Dior to the Academy Museum Gala', category: 'fashion' }))).toBeUndefined();
    expect(significanceRuleHold(item({ headline: 'Taylor on the VMAs red carpet in a velvet gown', category: 'fashion' }))).toBeUndefined();
  });

  it('holds other people remarking on her but not her own news', () => {
    expect(significanceRuleHold(item({ headline: 'A hall of fame coach says he was too shy to meet Taylor' }))).toBe('celebrity_remark');
    expect(significanceRuleHold(item({ headline: 'Taylor says her new album took two years' }))).toBeUndefined();
    expect(significanceRuleHold(item({ headline: 'Billboard says Taylor is back at No. 1' }))).toBeUndefined();
  });

  it('holds Travis game filler', () => {
    expect(significanceRuleHold(item({ headline: 'Travis Kelce scores a touchdown while Taylor watches', category: 'music' }))).toBe('travis_filler');
  });

  it('holds listicles, predictions and anniversary rehashes, but not an official anniversary archive', () => {
    expect(significanceRuleHold(item({ headline: 'Rolling Stone predicts Taylor for the Grammys' }))).toBe('listicle');
    expect(significanceRuleHold(item({ headline: 'Stereogum marks 20 years since her debut' }))).toBe('listicle');
      });

  it('holds fan speculation', () => {
    expect(significanceRuleHold(item({ headline: 'Fans are debating who the song is about' }))).toBe('speculation');
  });

  it('never holds an item with an official-tier source', () => {
    const sources = [{ url: 'https://store.taylorswift.com/x', tier: 'official' as const }];
    expect(significanceRuleHold(item({ headline: 'Fans think the page hints at a drop', sources }))).toBeUndefined();
  });

  it('does not hold real news that merely sounds like a noise pattern', () => {
    const passes = [
      'Taylor Swift announces new album after weeks of speculation',
      'Eras Tour ranked highest-grossing tour of all time, Pollstar says',
      'Luminate says Taylor Swift sold 4M copies in a week',
      'Spotify says Taylor Swift set a new single-day record',
      'NFL confirms Taylor Swift halftime show at Super Bowl',
      "Taylor Swift marks 10 years since 1989 with new Taylor's Version vinyl",
    ];
    for (const headline of passes) {
      expect(significanceRuleHold(item({ headline, category: 'music' })), headline).toBeUndefined();
    }
  });

  it('still holds list-shaped rankings and Travis game filler', () => {
    expect(significanceRuleHold(item({ headline: 'Taylor Swift songs ranked: every single, worst to best' }))).toBe('listicle');
    expect(significanceRuleHold(item({ headline: 'Travis Kelce scores a touchdown and Taylor Swift cheers' }))).toBe('travis_filler');
  });

  it('never lets text claim an official source', () => {
    const headline = 'Fans think the official site and taylorswift.com hint at a drop';
    expect(significanceRuleHold(item({ headline, sources: [{ url: 'https://example.com/a', tier: 'unverified' }] }))).toBe('speculation');
    expect(significanceRuleHold(item({ headline, sources: [{ url: 'https://nottaylorswift.com/a', tier: 'unverified' }] }))).toBe('speculation');
    expect(significanceRuleHold(item({ headline, sources: [{ url: 'https://store.taylorswift.com/a', tier: 'unverified' }] }))).toBeUndefined();
    expect(significanceRuleHold(item({
      headline: "Taylor's official site adds an archive ahead of the debut anniversary",
    }))).toBe('listicle');
  });

  it('formats the hold reason', () => {
    expect(significanceHoldReason('listicle')).toBe('not_notable:listicle');
  });
});
