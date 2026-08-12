import { describe, expect, it } from 'vitest';
import { TRACKS_RAW } from './tracks.generated';
import { tracksForEra } from './tracks';

// The "Track Five" pill (#689) is DERIVED, not authored: the UI badges a row
// purely when `track.trackNumber === 5`, the way milestones derive from
// `item.milestone`. These guards confirm the track-position data actually
// supports that derivation, so the badge can't silently mis-fire or drift.
describe('Track Five badge derivation (#689)', () => {
  it('never resolves to more than one track five in an era (no duplicate badge)', () => {
    for (const [eraId, tracks] of Object.entries(TRACKS_RAW)) {
      const fives = tracks.filter((t) => t.trackNumber === 5);
      expect(fives.length, `era ${eraId} has ${fives.length} track-5 rows`).toBeLessThanOrEqual(1);
    }
  });

  it('tracksForEra exposes the same track-5 row the badge keys off', () => {
    for (const eraId of Object.keys(TRACKS_RAW) as (keyof typeof TRACKS_RAW)[]) {
      const fromMap = (TRACKS_RAW[eraId] ?? []).find((t) => t.trackNumber === 5);
      const fromGetter = tracksForEra(eraId).find((t) => t.trackNumber === 5);
      expect(fromGetter).toBe(fromMap);
    }
  });

  it('the track-five tradition is broadly supported across the catalog', () => {
    // Every studio album has a 5th track; these all carry a sourced note today,
    // so the badge renders across the catalog rather than on a lone era. A drop
    // below the full set is a content gap worth noticing, not a crash.
    const erasWithFive = Object.values(TRACKS_RAW).filter((tracks) =>
      tracks.some((t) => t.trackNumber === 5),
    ).length;
    expect(erasWithFive).toBeGreaterThanOrEqual(12);
  });
});
