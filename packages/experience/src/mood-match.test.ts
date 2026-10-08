import { describe, expect, it } from 'vitest';
import { matchMoods, type MoodQuery } from './mood-match';
import { MOOD_AXES, type MoodAxes, type SongMood } from './types';

// This suite exercises matchMoods' pure behaviour against synthetic,
// catalogue-injected fixtures — no app wiring, no generated data. See
// apps/web/lib/longlive/mood-match.test.ts for the suite that runs the real,
// app-wired SONG_MOODS catalogue.

describe('energy/valence tie-breaking', () => {
  it('energy/valence targets refine ordering without overriding mood', () => {
    // Two songs, same joy; the one nearer the requested low energy wins.
    const cat: SongMood[] = [
      buildSong('loud', '1989', { joy: 0.8 }, 0.95, 0.8),
      buildSong('quiet', 'folklore', { joy: 0.8 }, 0.15, 0.8),
    ];
    const picks = matchMoods({ moods: { joy: 1 }, energy: 0.1 }, { catalogue: cat });
    expect(picks[0]?.slug).toBe('quiet');
  });

  it('uses authored energy/valence as the secondary signal for a tied single axis (#2000)', () => {
    const cat: SongMood[] = [
      buildSong('alpha-chaos', '1989', { calm: 0.8 }, 0.95, 0.1),
      buildSong('zeta-calm', 'folklore', { calm: 0.8 }, 0.2, 0.7),
    ];
    const picks = matchMoods({ moods: { calm: 1 } }, { catalogue: cat, diversity: 0 });
    expect(picks.map((p) => p.slug)).toEqual(['zeta-calm', 'alpha-chaos']);
    expect(picks[0]?.score).toBe(picks[1]?.score);
  });
});

describe('matchMoods — era diversity', () => {
  it('diversity 0 lets one era dominate; the default spreads it', () => {
    // Build a lopsided catalogue: four strong Red songs, one weaker Lover song.
    const cat: SongMood[] = [
      buildSong('r1', 'red', { heartbreak: 0.9 }, 0.5, 0.2),
      buildSong('r2', 'red', { heartbreak: 0.88 }, 0.5, 0.2),
      buildSong('r3', 'red', { heartbreak: 0.86 }, 0.5, 0.2),
      buildSong('r4', 'red', { heartbreak: 0.84 }, 0.5, 0.2),
      buildSong('l1', 'lover', { heartbreak: 0.7 }, 0.5, 0.2),
    ];
    const q: MoodQuery = { moods: { heartbreak: 1 } };
    const noDiversity = matchMoods(q, { catalogue: cat, limit: 3, diversity: 0 }).map((m) => m.eraId);
    expect(new Set(noDiversity).size).toBe(1); // all Red
    const spread = matchMoods(q, { catalogue: cat, limit: 3, diversity: 0.6 }).map((m) => m.eraId);
    expect(new Set(spread).size).toBeGreaterThan(1); // Lover forced in
  });

  it('a genuinely dominant era still wins its slots despite diversity', () => {
    // One era is a runaway match; diversity must not evict a far-better song.
    const cat: SongMood[] = [
      buildSong('a1', 'red', { anger: 1 }, 0.9, 0.3),
      buildSong('a2', 'red', { anger: 0.98 }, 0.9, 0.3),
      buildSong('weak', 'lover', { anger: 0.05 }, 0.2, 0.9),
    ];
    const picks = matchMoods({ moods: { anger: 1 } }, { catalogue: cat, limit: 2, diversity: 0.2 });
    expect(picks.map((m) => m.slug)).toEqual(['a1', 'a2']);
  });
});

/** Build a fully-scored SongMood for catalogue-injection tests. */
function buildSong(
  slug: string,
  eraId: SongMood['eraId'],
  partialMoods: Partial<MoodAxes>,
  energy: number,
  valence: number,
): SongMood {
  const moods = Object.fromEntries(MOOD_AXES.map((a) => [a, partialMoods[a] ?? 0])) as MoodAxes;
  return { slug, title: slug.toUpperCase(), eraId, moods, energy, valence };
}
