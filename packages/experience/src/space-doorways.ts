import type { VideoNote } from '@swift2/experience';
import type { EraFeedEntry } from './era-feed';

/**
 * `spaceDoorways` — PLAN.md P3 step 14. Split out of era-feed.ts to keep that
 * file under the 300-line cap (see MAP.md); this is a pure, independently
 * testable transform of `mergeEraFeed`'s output and doesn't need anything
 * else in that file at runtime (the `EraFeedEntry` import is type-only).
 */

/** No two doorways within this many non-doorway cards of each other, where
 * the feed allows it. */
export const DOORWAY_MIN_GAP = 4;

/**
 * Spreads `thread`/`egg` doorway entries through an already-merged,
 * already-sorted feed (`mergeEraFeed`'s output) so they don't clump: at least
 * `DOORWAY_MIN_GAP` non-doorway cards between any two doorways.
 *
 * What this is allowed to move, precisely, and nothing more:
 *  - A doorway that would clump may be delayed LATER in the feed — never
 *    earlier, and never past a doorway that came after it in the input
 *    (doorway-to-doorway relative order is preserved).
 *  - Two moment/video cards never swap relative order with each other. The
 *    only visible side effect of delaying a doorway is that the non-doorway
 *    cards it hops over each shift one slot earlier — exactly as far as the
 *    doorway moved past them, no further.
 *  - Deterministic: a single left-to-right pass with no randomness: the same
 *    input array always produces the same output array.
 *
 * NEVER drops a doorway. When an era carries more doorways than the
 * available non-doorway cards can space out (the input runs out before every
 * pending doorway has cleared the gap), the remaining doorways are appended
 * in their original relative order at the point spacing ran out — clumped,
 * but every one of them still renders. Losing content to satisfy a layout
 * rule is not acceptable.
 *
 * A doorway that gets DELAYED this way keeps its original anchor date for
 * sorting, but the cards it hopped over — all older than it — now render
 * ABOVE it, breaking the "dates descend down the page" property the
 * scrubber (TimelineScrubber.tsx) assumes of every `data-ll-item` (see
 * adversarial review finding #2, 2026-08-13). Rather than invent a second,
 * disagreeing date for a card whose real date is honest but whose position
 * no longer matches it, this marks it `displaced: true`; DoorwayCard reads
 * that flag and stops rendering `data-ll-date`/`data-ll-exact` for it, so
 * TimelineScrubber's `measure()` simply never sees it as a rail anchor. It
 * still renders in the feed, still opens on tap — it just no longer gets a
 * vote in what the scrubber says the date is.
 */
export function spaceDoorways<V extends VideoNote>(
  feed: readonly EraFeedEntry<V>[],
): EraFeedEntry<V>[] {
  const isDoorway = (
    e: EraFeedEntry<V>,
  ): e is Extract<EraFeedEntry<V>, { kind: 'thread' | 'egg' }> =>
    e.kind === 'thread' || e.kind === 'egg';
  const output: EraFeedEntry<V>[] = [];
  const pending: EraFeedEntry<V>[] = [];
  // Starts already "satisfied" so the very first doorway in the feed never
  // waits on a gap that doesn't exist yet.
  let sinceLastDoorway = DOORWAY_MIN_GAP;

  const releaseIfReady = () => {
    if (pending.length > 0 && sinceLastDoorway >= DOORWAY_MIN_GAP) {
      output.push(pending.shift()!);
      sinceLastDoorway = 0;
    }
  };

  for (const entry of feed) {
    if (!isDoorway(entry)) {
      output.push(entry);
      sinceLastDoorway++;
      releaseIfReady();
      continue;
    }
    // A doorway can only be placed directly when nothing earlier is still
    // waiting — otherwise it would jump ahead of an earlier-queued doorway,
    // which is exactly the reordering this function must not do.
    if (pending.length === 0 && sinceLastDoorway >= DOORWAY_MIN_GAP) {
      output.push(entry);
      sinceLastDoorway = 0;
    } else {
      pending.push({ ...entry, displaced: true });
    }
  }
  // Best-effort tail: the input ran out before these could be spaced out.
  // Every one of them still renders — nothing is ever dropped.
  output.push(...pending);
  return output;
}
