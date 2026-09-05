import type { EraId, LensId, TheoryNote } from '@swift2/experience';
import { getThread, threadPoints, threadsInEra } from '@swift2/experience';
import { theoriesForEra } from './theories';
import { resolveAnchor } from './anchor-date';
import type { Anchored, ThreadDoorway, EggDoorway } from '@swift2/experience';

export type { ThreadDoorway, EggDoorway };

/**
 * Builds the `thread`/`egg` doorway entries that widen `EraFeedEntry`
 * (era-feed.ts) to four kinds — PLAN.md P3 step 13. Split out of era-feed.ts
 * to keep that file under the 300-line cap (see MAP.md); this is the only
 * module that reaches into `lenses.ts`/`theories.ts` for doorway data.
 *
 * `era-feed.ts` imports only the two doorway TYPES from here, plus these two
 * builder functions where a caller (EraSection, in a later step) assembles
 * the era's full doorway list to hand to `mergeEraFeed`.
 *
 * `ThreadDoorway`/`EggDoorway` moved to `packages/experience` in OS-021
 * (they are part of `EraFeedEntry`'s shape); re-exported above.
 */

const THREAD_DOORWAY_KICKER = 'THREADS — one storyline at a time, across every era';
const EGG_DOORWAY_KICKER = 'EGGS — the secrets she plants';

/**
 * One doorway per thread present in this era (same granularity as the
 * existing threads-pivot strip at the bottom of `EraSection` — one card per
 * thread, not one per dated point). Anchored on the EARLIEST of the thread's
 * own dated points that fall in this era — a real, authored date, so
 * `via: 'exact'` in the common case. A thread can have more than one point in
 * one era (e.g. a relationship spanning eras, or a clue's plant and payoff
 * landing in the same year); picking the earliest is a deterministic,
 * documented choice, not a guess — `threadsInEra`'s own `count > 0` guarantees
 * at least one point exists, so the array here is never empty.
 *
 * PLAN.md P3 step 14a: `threadPoints` can hand back a point dated OUTSIDE
 * [eraStart, eraEnd] — a relationship's real start (or the proposal thread's
 * own real date) can predate the era it's plotted against, e.g. debut's
 * `taylors-version` point (2006-01-01) against debut's own 2006-10-24 start.
 * `TimelineScrubber` interpolates a card's rail position from its date, so an
 * out-of-window date would distort that era's rail. Clamp the point INTO the
 * era before anchoring. A clamped date is genuinely not this era's own date,
 * so it can no longer be shown as fact: it anchors via `'clamped'`, and the
 * honesty rule (`displayDate` null unless `via === 'exact'`) drops the date
 * without any special-casing here. A point already inside the window is
 * untouched and keeps its real, exact, displayed date.
 */
export function threadDoorwaysForEra(
  eraId: EraId,
  eraStart: string,
  eraEnd: string,
): { kind: 'thread'; doorway: ThreadDoorway; anchor: Anchored }[] {
  return threadsInEra(eraId).map(({ id }) => {
    const points = threadPoints(id)
      .filter((p) => p.eraId === eraId)
      .sort((a, b) => a.date.localeCompare(b.date));
    const point = points[0];
    const clampedDate = point.date < eraStart ? eraStart : point.date > eraEnd ? eraEnd : point.date;
    const anchor: Anchored =
      clampedDate === point.date
        ? resolveAnchor({ exactDate: point.date, eraStart, eraEnd, id: `thread:${eraId}:${id}` })
        : { sortDate: clampedDate, displayDate: null, via: 'clamped' };
    return {
      kind: 'thread' as const,
      doorway: {
        threadId: id,
        kicker: THREAD_DOORWAY_KICKER,
        title: getThread(id).title,
        example: point.label,
      },
      anchor,
    };
  });
}

/**
 * One doorway per theory/egg the guide has for this era (`theoriesForEra`).
 *
 * `TheoryNote` carries no date, no song pointer and no moment pointer, and
 * its `sources` carry no publication date either (§ PLAN.md Plan amendments
 * (3), verified against types.ts before writing this). There is nothing real
 * to anchor to, so every egg doorway anchors via `era-scatter` — deliberately
 * NOT by text-matching the theory's title/claim against track or moment
 * titles, which would be exactly the unverifiable heuristic banned for
 * `track-video.ts` (PLAN.md P2 step 10), for the same reason and a stronger
 * one here: there is no curated pointer to even start from.
 */
export function eggDoorwaysForEra(
  eraId: EraId,
  eraStart: string,
  eraEnd: string,
): { kind: 'egg'; doorway: EggDoorway; anchor: Anchored }[] {
  return theoriesForEra(eraId).map((theory) => ({
    kind: 'egg' as const,
    doorway: {
      eggId: `${eraId}:${theory.slug}`,
      threadId: theoryThreadId(theory),
      kicker: EGG_DOORWAY_KICKER,
      title: theory.title,
    },
    anchor: resolveAnchor({ eraStart, eraEnd, id: `egg:${eraId}:${theory.slug}` }),
  }));
}

/**
 * The thread a theory/egg detail should link back to (R4), shared by
 * `eggDoorwaysForEra` (the `EggDoorway.threadId` field) and TheoryGuide's own
 * per-card back-link — one mapping, not two that can drift apart.
 *
 * PLAN.md P3 step 17 correction: `kind === 'theory'` used to map to `null`
 * unconditionally. Checked, not assumed, against both candidate threads
 * before deciding:
 *  - `easter-eggs` (EGG_NODES, the Clue Web) and `hidden-clues` (CLUE_PAIRS,
 *    plant/payoff pairs) are both VERIFIED, curated datasets — separate
 *    arrays in lenses.ts, neither derived from THEORIES_RAW at all.
 *  - `TheoryNote.kind` itself draws the line the types.ts comment states
 *    directly: "Planted-and-decoded easter egg vs. speculative fan theory."
 *    A sample of real `theory`-kind records (1989's "no it's becky", "Blank
 *    Space is satire") are interpretive readings, not planted-and-decoded
 *    content — the category `easter-eggs`/`hidden-clues` exist for.
 * Mapping a `theory` onto either would claim a confirmed-content thread for
 * content the record's OWN `confidence`/`outcome` fields may grade as
 * `plausible` or `joke_meme` — the "plausible but not actually verified"
 * move § Plan amendments (3) already rejected for anchoring, for the same
 * reason here. So: `easter_egg` still maps to `easter-eggs`; `theory` stays
 * `null`. R4's educational half is unconditional regardless — see
 * TheoryGuide.tsx's `TheoryCard`, which renders a "there is a whole section
 * for this" line pointing at Threads even when this returns null.
 */
export function theoryThreadId(theory: TheoryNote): LensId | null {
  return theory.kind === 'easter_egg' ? 'easter-eggs' : null;
}
