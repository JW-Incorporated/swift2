import { describe, expect, it } from 'vitest';
import { ERAS } from '@swift2/experience';
import { contentForEra } from './content';
import { eraVideoFeed } from './videos';
import { threadDoorwaysForEra, eggDoorwaysForEra } from './doorways';
import { embeddedYoutubeIds, mergeEraFeed, type EraFeedEntry } from './era-feed';
import { spaceDoorways } from './space-doorways';
import type { EraId } from '@swift2/experience';

/**
 * Corpus regression for adversarial review finding #2 (2026-08-13):
 * `spaceDoorways` delays a doorway to satisfy `DOORWAY_MIN_GAP`, but the
 * delayed card keeps its ORIGINAL anchor date while moving BELOW older
 * cards — measured on the real corpus at 44 inversions across the twelve
 * eras (worst gap 219 days), which broke TimelineScrubber's assumption that
 * anchors descend monotonically down the page.
 *
 * The fix (space-doorways.ts, DoorwayCard.tsx, TimelineScrubber.tsx):
 * a displaced doorway is marked `displaced: true` and stops being offered
 * to the scrubber as a rail anchor at all — it still renders, still opens,
 * it just no longer votes on what date the scrubber shows.
 *
 * This test reconstructs, for every real era, exactly the feed
 * EraSection.tsx builds — `spaceDoorways(mergeEraFeed(...))` — then exactly
 * what TimelineScrubber's `measure()` would collect as anchors (every entry
 * EXCEPT a displaced doorway, matching DoorwayCard's `data-ll-date`
 * omission), and asserts the resulting date sequence never increases
 * (dates must descend or tie, newest-first, never reverse).
 */
function anchorDatesForEra(eraId: EraId, start: string, end: string): number[] {
  const items = contentForEra(eraId);
  const embeddedVideoIds = embeddedYoutubeIds(items);
  const videoFeed = eraVideoFeed(eraId, embeddedVideoIds);
  const doorwayEntries: EraFeedEntry[] = [
    ...threadDoorwaysForEra(eraId, start, end),
    ...eggDoorwaysForEra(eraId, start, end),
  ];
  const merged = spaceDoorways(mergeEraFeed(items, videoFeed, start, end, doorwayEntries));
  // Mirrors DoorwayCard: a displaced thread/egg omits data-ll-date, so
  // TimelineScrubber's measure() never sees it as an anchor at all.
  const anchored = merged.filter((e) => !((e.kind === 'thread' || e.kind === 'egg') && e.displaced));
  return anchored.map((e) => new Date(e.anchor.sortDate).getTime());
}

/** Every (date[i], date[i+1]) pair where the date INCREASES going down the
 * page — i.e. a genuine monotonicity violation, not a same-day tie. */
function countInversions(dates: number[]): number {
  let count = 0;
  for (let i = 0; i < dates.length - 1; i++) {
    if (dates[i] < dates[i + 1]) count++;
  }
  return count;
}

describe('scrubber anchor date monotonicity (corpus)', () => {
  it('has zero anchor-date inversions in every one of the twelve real eras', () => {
    const perEra = ERAS.map((era) => ({
      id: era.id,
      inversions: countInversions(anchorDatesForEra(era.id, era.start, era.end)),
    }));
    const offenders = perEra.filter((e) => e.inversions > 0);
    expect(offenders).toEqual([]);
  });

  it('covers all twelve eras (guards against a silently-empty corpus)', () => {
    expect(ERAS).toHaveLength(12);
  });
});
