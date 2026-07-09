import { describe, expect, it } from 'vitest';
import { TRACKS_RAW } from './tracks.generated';
import { tracksForEra } from './tracks';
import { ERAS } from './eras';

// Guards the generated track-guide data against generator drift: everything
// the TrackGuide overlay assumes about tracks.generated.ts is asserted here.
describe('tracks.generated.ts invariants', () => {
  const eraIds = new Set(ERAS.map((e) => e.id));

  it('only contains known era ids (seed slugs fully mapped)', () => {
    for (const key of Object.keys(TRACKS_RAW)) {
      expect(eraIds, `unknown era id ${key}`).toContain(key);
    }
  });

  it('every track is renderable: non-empty title + note, well-formed sources', () => {
    for (const tracks of Object.values(TRACKS_RAW)) {
      for (const t of tracks) {
        expect(t.title.trim()).not.toBe('');
        expect(t.note.trim()).not.toBe('');
        for (const s of t.sources ?? []) {
          expect(s.name.trim()).not.toBe('');
          expect(s.url).toMatch(/^https?:\/\//);
        }
      }
    }
  });

  it('each era is sorted by track number, unnumbered last', () => {
    for (const [eraId, tracks] of Object.entries(TRACKS_RAW)) {
      const numbers = tracks.map((t) => t.trackNumber);
      const numbered = numbers.filter((n): n is number => n !== null);
      expect(numbered, `era ${eraId} out of order`).toEqual([...numbered].sort((a, b) => a - b));
      const firstNull = numbers.indexOf(null);
      if (firstNull !== -1) {
        expect(numbers.slice(firstNull).every((n) => n === null), `era ${eraId} mixes null into numbered run`).toBe(true);
      }
    }
  });
});

describe('tracksForEra', () => {
  it('returns the era track list, or empty (never undefined) when an era has none', () => {
    // The seeded catalog covers all 12 eras today, but the accessor must not
    // assume that — it backs a conditional entry point in the era hero.
    for (const era of ERAS) {
      expect(Array.isArray(tracksForEra(era.id))).toBe(true);
    }
  });
});
