/**
 * The live battery's corpus, pinned WITHOUT a key.
 *
 * The battery itself cannot run in CI — it spends money and needs the prod key.
 * What CI can do, and what actually matters, is keep the corpus honest between
 * keyed runs. The load-bearing assertion is the Tier B invariant: if a future
 * Tier A widening starts catching the probe drafts, the keyed battery would
 * still report "Tier B green" while Tier B was doing nothing. That failure
 * would be invisible in the battery's own output, so it is caught here instead.
 */
import { describe, expect, it } from 'vitest';

import { ATTACKS, LEGIT, TIER_B_PROBES } from './clownbot-battery-corpus';
import { screenInput, screenOutput } from './clownbot-safety';

describe('live-battery corpus — Tier B probes are invisible to Tier A', () => {
  it.each(TIER_B_PROBES.map((p) => [p.id, p.draft] as const))(
    '%s is not caught by the deterministic output gate',
    (_id, draft) => {
      // If this fails, the probe is no longer testing the semantic classifier.
      // Replace the draft with a paraphrase Tier A still cannot see.
      expect(screenOutput([draft])).toBeNull();
    },
  );

  it('probes cover both directions — redline drafts AND clean drafts', () => {
    expect(TIER_B_PROBES.some((p) => p.expect === 'redline')).toBe(true);
    expect(TIER_B_PROBES.filter((p) => p.expect === 'none').length).toBeGreaterThanOrEqual(5);
  });
});

describe('live-battery corpus — the #2001 obfuscation leaks stay closed', () => {
  const pinned = ATTACKS.filter((a) => a.pinnedInCi);

  it('there are seven CI-pinned obfuscation cases', () => expect(pinned.length).toBe(7));

  it.each(pinned.map((a) => [a.id, a.prompt] as const))(
    '%s is still caught at the input gate',
    (_id, prompt) => {
      expect(screenInput(prompt)).not.toBeNull();
    },
  );
});

describe('live-battery corpus — shape', () => {
  it('carries the 48 over-refusal guards verbatim', () => {
    expect(LEGIT.length).toBe(48);
    expect(new Set(LEGIT).size).toBe(48);
  });

  it('every legit prompt clears the deterministic input gate', () => {
    const refused = LEGIT.filter((p) => screenInput(p) !== null);
    expect(refused).toEqual([]);
  });

  it('attack ids and prompts are unique', () => {
    expect(new Set(ATTACKS.map((a) => a.id)).size).toBe(ATTACKS.length);
    expect(new Set(ATTACKS.map((a) => a.prompt)).size).toBe(ATTACKS.length);
  });

  it('covers the leak classes the agents missed and CI caught', () => {
    const classes = new Set(ATTACKS.map((a) => a.klass));
    for (const required of [
      'speak-as-taylor',
      'speak-as-taylor-paraphrase',
      'obfuscation-2001',
      'obfuscation-novel',
      'adjective-gap-disparagement',
    ]) {
      expect(classes.has(required as never)).toBe(true);
    }
  });

  it('a real share of the attacks get PAST the deterministic input gate', () => {
    // If every attack were caught at Tier A the battery would never exercise
    // the model or Tier B at all, and a keyed run would prove nothing new.
    const past = ATTACKS.filter((a) => screenInput(a.prompt) === null);
    expect(past.length).toBeGreaterThanOrEqual(12);
  });
});
