import { describe, expect, it } from 'vitest';
import { MOOD_STARTERS, STARTERS_VISIBLE, visibleStarters } from './mood-starters';
import { matchMoods } from '@swift2/experience';
import './vault-wiring';
import { MOOD_AXES } from '@swift2/experience';

/**
 * The safety doc's bar for these chips is explicit: they are the demo path, so
 * "a chip that returns something mediocre is worse than no chip at all". These
 * tests hold that line — they assert each chip returns real, on-theme songs
 * deterministically, with no model call.
 */

describe('the approved chip set', () => {
  it('carries all ten approved labels verbatim', () => {
    expect(MOOD_STARTERS).toHaveLength(10);
    const labels = MOOD_STARTERS.map((s) => s.label);
    // Block 3 names these two as load-bearing; a redesign that drops them
    // should fail here loudly rather than quietly change what the set signals.
    expect(labels).toContain('feral about a bridge');
    expect(labels).toContain('winning, quietly');
  });

  // The labels are approved copy, so the real guard is that they still match
  // the approved set EXACTLY — changing one is a founder call, not an edit.
  // (An earlier version of this test flagged any quote mark as a possible
  // lyric, which wrongly failed the approved `someone said "we need to talk"`:
  // those quotes are a person speaking, not quoted verse. A quote-mark
  // heuristic guards nothing; exact-match on approved copy guards what matters.)
  it('matches the approved Block 3 copy exactly', () => {
    expect(MOOD_STARTERS.map((s) => s.label)).toEqual([
      'crying in the car, cinematically',
      "3am and the group chat's asleep",
      'plotting something in a ball gown',
      'feral about a bridge',
      'cardigan weather',
      'driving out of a small town for good',
      'romanticizing a Tuesday',
      'someone said "we need to talk"',
      'winning, quietly',
      'unhinged in the best way',
    ]);
  });

  it('uses only real mood axes, all in range', () => {
    for (const s of MOOD_STARTERS) {
      for (const [axis, v] of Object.entries(s.moods)) {
        expect(MOOD_AXES).toContain(axis);
        expect(v).toBeGreaterThan(0);
        expect(v).toBeLessThanOrEqual(1);
      }
      if (s.energy !== undefined) expect(s.energy).toBeGreaterThanOrEqual(0);
      if (s.valence !== undefined) expect(s.valence).toBeLessThanOrEqual(1);
    }
  });
});

describe('every chip returns real matches', () => {
  it.each(MOOD_STARTERS.map((s) => [s.label, s] as const))('%s', (_label, s) => {
    const picks = matchMoods({ moods: s.moods, energy: s.energy, valence: s.valence }, { limit: 5 });
    expect(picks.length).toBeGreaterThanOrEqual(3);
    // Every pick must be a real catalogue entry, not a fabricated title.
    for (const p of picks) {
      expect(p.slug).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.eraId).toBeTruthy();
    }
    // A chip whose top hit is a weak match is the "mediocre chip" the doc warns
    // about — it would be the first thing a reader ever taps.
    expect(picks[0].score).toBeGreaterThan(0.6);
  });

  it('is deterministic — the demo path never varies between taps', () => {
    const s = MOOD_STARTERS[0];
    const a = matchMoods({ moods: s.moods, energy: s.energy, valence: s.valence }, { limit: 5 });
    const b = matchMoods({ moods: s.moods, energy: s.energy, valence: s.valence }, { limit: 5 });
    expect(a.map((p) => p.slug)).toEqual(b.map((p) => p.slug));
  });

  it('gives distinct chips distinct results — the set is not one mood in ten coats', () => {
    const top = MOOD_STARTERS.map(
      (s) => matchMoods({ moods: s.moods, energy: s.energy, valence: s.valence }, { limit: 1 })[0].slug,
    );
    expect(new Set(top).size).toBeGreaterThanOrEqual(7);
  });

  it('"winning, quietly" returns something genuinely upbeat, not more heartbreak', () => {
    const s = MOOD_STARTERS.find((x) => x.label === 'winning, quietly')!;
    const picks = matchMoods({ moods: s.moods, energy: s.energy, valence: s.valence }, { limit: 5 });
    // It is load-bearing precisely because the catalogue skews sad; if this
    // starts returning breakup songs the set has drifted.
    expect(picks.length).toBeGreaterThanOrEqual(3);
    expect(picks[0].score).toBeGreaterThan(0.6);
  });

  // #2000 — the chip had drifted onto the high-energy DEFIANT breakup songs
  // (Getaway Car / Is It Over Now? / The Story of Us) with All Too Well buried at
  // #5. Re-pinned, All Too Well leads and the defiant-drift songs are gone.
  it('"feral about a bridge" re-pins to All Too Well, not the defiant drift', () => {
    const s = MOOD_STARTERS.find((x) => x.label === 'feral about a bridge')!;
    const slugs = matchMoods({ moods: s.moods, energy: s.energy, valence: s.valence }, { limit: 5 }).map(
      (p) => p.slug,
    );
    expect(slugs[0]).toBe('all-too-well-10-minute-version');
    expect(slugs).not.toContain('the-story-of-us');
    expect(slugs).not.toContain('getaway-car');
    expect(slugs).not.toContain('is-it-over-now');
  });
});

describe('visibleStarters', () => {
  it('shows a window, not the whole menu', () => {
    expect(visibleStarters(0)).toHaveLength(STARTERS_VISIBLE);
  });

  it('rotates so the set never reads as fixed', () => {
    expect(visibleStarters(0)[0].label).not.toBe(visibleStarters(3)[0].label);
  });

  it('wraps around rather than running out', () => {
    const w = visibleStarters(MOOD_STARTERS.length - 1);
    expect(w).toHaveLength(STARTERS_VISIBLE);
    expect(new Set(w.map((s) => s.label)).size).toBe(STARTERS_VISIBLE);
  });

  it('handles a negative offset without crashing', () => {
    expect(visibleStarters(-1)).toHaveLength(STARTERS_VISIBLE);
  });
});
