/**
 * The live battery's corpus, pinned WITHOUT a key. Ported from build A's
 * clownbot-battery-corpus.test.ts.
 *
 * The battery itself cannot run in CI — it spends money and needs the prod
 * key. What CI can do, and what actually matters, is keep the corpus honest
 * between keyed runs.
 *
 * Corrected 2026-08-14 (Finding 2): this file used to assert the DETERMINISTIC
 * gate catches NONE of the TIER_B_PROBES, redline drafts included — on the
 * theory that if it ever did, a keyed battery run would misreport "Tier B
 * green" while the semantic layer did nothing. That reasoning was sound for
 * an ACCIDENTAL widening, but it was pinning a real gap as a feature: a
 * reviewer reproduced screenOutput catching 0/13 redline drafts live, with
 * the battery only "holding" because the model happened to deflect them. The
 * deterministic gate now deliberately catches (nearly) all of them — see
 * clown-safety.test.ts's "Finding 2" suite for the regression lock, including
 * the one documented gap. What THIS file still pins is the half of the old
 * invariant that is still true and still load-bearing: the CLEAN ('none')
 * probes must stay invisible to the deterministic gate, because a gate that
 * flags those is an over-refusal engine.
 */
import { describe, expect, it } from 'vitest';

import { ATTACKS, LEGIT, TIER_B_PROBES } from './clown-battery-corpus';
import { screenInput, screenOutput } from './clown-safety';

describe('live-battery corpus — Tier B probes vs. the deterministic output gate', () => {
  // Reversed 2026-08-14 (Finding 2): this used to assert `screenOutput`
  // returns null for EVERY TIER_B_PROBES draft, redline and clean alike —
  // encoding as a PINNED INVARIANT the exact gap a reviewer then reproduced
  // live (screenOutput caught 0/13 redline drafts, only because the model
  // happened to deflect them). The clean ('none') probes still MUST stay
  // invisible — a gate that catches those is an over-refusal engine, per
  // clown-battery-corpus-tier-b.ts's own header. See clown-safety.test.ts's
  // "Finding 2" suite for the full regression lock (including the one
  // documented gap, tb-priv-02).
  it.each(TIER_B_PROBES.filter((p) => p.expect === 'none').map((p) => [p.id, p.draft] as const))(
    '%s (clean) is not caught by the deterministic output gate',
    (_id, draft) => {
      expect(screenOutput([draft]), `false positive (over-refusal) on: ${draft}`).toBeNull();
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

  it('ATTACKS carries every case from build A (53, exact)', () => {
    // Build A's clownbot-battery-corpus.ts had exactly 53 ATTACKS cases (7
    // imp-direct + 7 imp-para + 7 obf-2001 + 8 obf-new + 3 off + 3 cert +
    // 4 adj + 8 priv + 4 lang + 2 bait). Pinned exactly so a future split
    // accidentally dropping a case fails loudly, and any addition is a
    // deliberate, visible test update.
    expect(ATTACKS.length).toBe(53);
  });

  it('TIER_B_PROBES carries every case from build A (21, exact)', () => {
    expect(TIER_B_PROBES.length).toBe(21);
  });
});
