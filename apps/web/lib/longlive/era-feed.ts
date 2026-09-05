import type { ContentItem, VideoNote } from '@swift2/experience';
import { ALL_FILTERS, filterMatches, filtersForEntry, type FilterId } from '@swift2/experience';
import { resolveAnchor, type Anchored } from './anchor-date';
import type { EggDoorway, ThreadDoorway } from './doorways';
import type { CurrentItem } from '@swift2/shared';
import type { EraFeedEntry as SharedEraFeedEntry } from '@swift2/experience';

/**
 * `EraFeedEntry` moved to `packages/experience/src/feed-types.ts` in OS-021
 * (it's `filtersForEntry`'s parameter type); re-exported here under its
 * original name so this file's existing exports keep working for its many
 * `apps/web` importers until OS-022 moves the rest of this module.
 */
export type EraFeedEntry<V extends VideoNote = VideoNote> = SharedEraFeedEntry<V>;

/**
 * The era feed's SELECTION rules, as pure functions.
 *
 * EraSection renders this; it does not decide it. The repo boundary
 * (docs/dev-quickstart.md — "business logic goes in packages/shared/core, not
 * the view layer") applies inside the web app too, and there is a concrete
 * reason here: vitest runs in a `node` environment with no component tests in
 * the suite, so anything left inside the component is untestable by
 * construction. The Videos filter is the acceptance criterion of this
 * feature — it does not get to be the untested part.
 *
 * One global filter (R2): six FilterIds — the five ContentTags plus Videos —
 * OR-matched, Videos a peer chip rather than a second axis. mergeEraFeed
 * merges the FULL, unfiltered moment + video lists into one newest-first
 * feed; visibleFeed then filters that merged feed in a single pass, so
 * "moments only", "videos only" and "moments+videos" all fall out of the
 * same rule instead of a branch choosing between two candidate lists.
 */

/**
 * One entry in the merged feed: a curated moment, a video record, or a
 * doorway into a THREADS gallery or an egg/theory detail (PLAN.md P3 step
 * 13). Every entry carries an `anchor` (see anchor-date.ts) so undated
 * records still have a defensible sort position instead of piling at the
 * end. Doorway construction (`threadDoorwaysForEra`/`eggDoorwaysForEra`)
 * lives in `doorways.ts`, not here — this file stays the merge/sort/filter
 * logic, doorways.ts is the only module that reaches into `lenses.ts`/
 * `theories.ts` for that data (kept the split to stay under the 300-line cap
 * — see MAP.md).
 *
 * `displaced` (thread/egg only, set by `spaceDoorways`): true when
 * `DOORWAY_MIN_GAP` spacing pushed this doorway LATER than its anchor's
 * `sortDate` would otherwise place it — it keeps that original date for
 * sorting purposes, but is no longer at a position the date describes, so it
 * must not be presented to the scrubber as a rail anchor (adversarial review
 * finding #2, 2026-08-13 — see space-doorways.ts).
 *
 * `current` (PLAN.md Stage 5, knowledge-engine proposal issue 6): a live
 * `current_item` row for the current era only — built by
 * `currentFeedEntries` (current-feed.ts) from data fetched at request time
 * (ISR, `/vault/current/[eraId]`), not from the build-time Vault. Always
 * anchors `via: 'exact'` (`observedOn` is a real, authored date), so it is
 * never a `spaceDoorways` candidate and never `displaced`.
 */

/**
 * The merged feed (mergeEraFeed's output over every moment and every
 * watchable video record in the era), filtered against the active global
 * filter set in one pass (R2) — the replacement for the old two-branch
 * visibleMoments/visibleVideos.
 *
 * Returns the input array itself when the active set is empty ("show
 * everything"), so the common case allocates nothing and referential
 * equality holds for memo consumers.
 *
 * `entries` MUST be the era's full, unfiltered feed (exactly what
 * `mergeEraFeed` returns) — `filtersForEntry`'s inline-video ownership rule
 * has to be computed over every moment on the timeline before any filter is
 * applied, or a tag filter could hide the owner and leave a footage-carrying
 * moment unreachable under Videos (see `inlineVideoMomentIds`'s doc comment).
 *
 * PLAN.md P3 step 14b: this and `mergeEraFeed` used to be overloaded so a
 * caller that never passed doorways in kept the narrower `moment | video`
 * return type. Now that `EraSection.tsx` renders all four kinds (step 15),
 * that caller no longer exists — one signature, over the full union.
 */
export function visibleFeed<V extends VideoNote>(
  entries: EraFeedEntry<V>[],
  active: ReadonlySet<FilterId>,
): EraFeedEntry<V>[] {
  if (active.size === 0) return entries;
  const moments = entries.flatMap((e) => (e.kind === 'moment' ? [e.item] : []));
  const ctx = { inlineVideoOwnerIds: inlineVideoMomentIds(moments) };
  return entries.filter((e) => filterMatches(filtersForEntry(e, ctx), active));
}

/**
 * Which moments own the inline player for their video (#2057 part 3).
 *
 * The #439 de-dupe stops one video appearing as both a moment card and a video
 * card, but nothing stopped two MOMENTS embedding the same YouTube id — and
 * tloas does it twice. "The Elizabeth Taylor video: a supercut of the real Liz"
 * and "'Elizabeth Taylor' goes to radio" carry the same music video, as do the
 * two Fate of Ophelia beats, so the Videos filter offered the reader four cards
 * for two videos.
 *
 * The rule: the FIRST moment in feed order (newest-first, the order the reader
 * meets them) keeps the embed; later moments carrying the same id defer to it.
 * The reader is offered each video at the first card that could play it, and
 * never offered it again — which is the property that was broken, stated
 * directly. It is deliberately not an editorial judgement about which beat
 * "deserves" the video: on tloas it gives Elizabeth Taylor to the video's own
 * premiere beat (2026-03-31, over the radio beat) but gives Fate of Ophelia to
 * the chart beat (2025-10-13, over the premiere two days earlier). Both are
 * defensible; neither is inferable from the data, and inventing a ranking
 * signal to prefer one would be guessing with extra steps.
 *
 * Nothing is deleted. A deferring moment keeps its card, its full text, its
 * place in the timeline and the video in its own story detail; it just doesn't
 * re-play a video the reader was already offered further up the same feed.
 *
 * A moment whose video carries no id can't be played at all, so it owns
 * nothing — same outcome, one fewer dead control.
 *
 * Ownership is a property of THE LIST YOU PASS, not of the era: hand it the
 * moments actually on screen. Computing it era-wide and then filtering would
 * let a tag filter hide the owner and leave the survivor unplayable — a card
 * with footage looking exactly like one without, i.e. #2051 all over again.
 */
export function inlineVideoMomentIds(items: ContentItem[]): Set<string> {
  // Feed order, not seed order: mergeEraFeed sorts newest-first, so "first in
  // feed order" is the newest. Sort is stable (ES2019), so same-day moments
  // fall back to the order they were authored in.
  const byFeedOrder = [...items].sort((a, b) => b.date.localeCompare(a.date));
  const claimed = new Set<string>();
  const owners = new Set<string>();
  for (const item of byFeedOrder) {
    const youtubeId = item.video?.youtubeId;
    if (!youtubeId || claimed.has(youtubeId)) continue;
    claimed.add(youtubeId);
    owners.add(item.id);
  }
  return owners;
}

/**
 * Merge moments, videos and doorways into one newest-first feed, so
 * cross-type ordering is correct instead of several concatenated lists.
 *
 * Every entry is anchored via `resolveAnchor` (anchor-date.ts) before
 * sorting. Moments always carry an authored date (`ContentItem.date` is
 * required), so a moment's anchor is always `exact`. A video without a
 * `releasedOn` has no exact anchor and no related-item/related-song signal
 * available at this call site, so it falls back to `era-scatter` — a
 * deterministic, id-derived position spread across the era's span, instead of
 * piling at the end of the feed (the plain date-sort this replaced) or
 * clumping mid-era (the fixed-midpoint fallback this replaced — see § Plan
 * amendments in PLAN.md). Nothing about that fallback is ever shown:
 * `Anchored.displayDate` is null for anything but `via: 'exact'` (see
 * anchor-date.ts's honesty rule), so an undated video card still renders
 * "Date unknown".
 *
 * `doorways` (PLAN.md P3 step 13) are ALREADY `EraFeedEntry`-shaped with
 * their own `anchor` — built by `threadDoorwaysForEra`/`eggDoorwaysForEra`
 * in `doorways.ts` — so this function only needs to fold them into the same
 * sort, not compute their anchors itself. Optional and appended last, rather
 * than adding an `eraId` param up front, so every existing call site (this
 * function shipped with 4 args in P1) keeps compiling unchanged; the caller
 * that has doorways to offer passes them, everyone else gets the same
 * two-kind feed as before. Apply `spaceDoorways` to the result before
 * rendering — this function only merges and sorts, it does not space.
 *
 * This SUBSUMES the old, separate `undatedAnchorDate()` — that function
 * computed its own single floor value for the scrubber's tail anchor, a
 * second, disagreeing notion of "anchor" living alongside this one. Callers
 * that need a card's scroll anchor now read `entry.anchor.sortDate` directly.
 *
 * Ties (equal `sortDate` — rare with era-scatter, but not impossible when two
 * ids hash to the same day) break on a stable id per kind — the moment's id,
 * the video's slug, or a `kind:`-prefixed doorway id — so ordering is
 * deterministic regardless of input array order.
 *
 * PLAN.md P3 step 14b: `doorways` used to be optional scaffolding behind an
 * overload pair, so a 4-arg call (no doorways) kept returning the narrower
 * `moment | video` union and EraSection.tsx's pre-step-15 render loop kept
 * typechecking unchanged. Step 15 now dispatches all four kinds, so that
 * narrower caller no longer exists — one signature, over the full union.
 * `doorways` stays optional (default `[]`) purely for callers (tests) that
 * don't care about them, not to preserve a second return type.
 */
export function mergeEraFeed<V extends VideoNote>(
  moments: ContentItem[],
  videos: V[],
  eraStart: string,
  eraEnd: string,
  doorways: EraFeedEntry<V>[] = [],
): EraFeedEntry<V>[] {
  const entries: EraFeedEntry<V>[] = [
    ...moments.map(
      (item): EraFeedEntry<V> => ({
        kind: 'moment',
        item,
        anchor: resolveAnchor({ exactDate: item.date, eraStart, eraEnd, id: item.id }),
      }),
    ),
    ...videos.map(
      (video): EraFeedEntry<V> => ({
        kind: 'video',
        video,
        anchor: resolveAnchor({ exactDate: video.releasedOn, eraStart, eraEnd, id: video.slug }),
      }),
    ),
    ...doorways,
  ];
  return entries.sort((a, b) => {
    if (a.anchor.sortDate !== b.anchor.sortDate) {
      return b.anchor.sortDate.localeCompare(a.anchor.sortDate);
    }
    return entryTiebreakId(a).localeCompare(entryTiebreakId(b));
  });
}

/** The stable id an entry sorts on when two anchors tie — see `mergeEraFeed`.
 * Doorway ids are prefixed so they can never collide with a moment id or
 * video slug, which share one unprefixed string space today. */
function entryTiebreakId<V extends VideoNote>(entry: EraFeedEntry<V>): string {
  switch (entry.kind) {
    case 'moment':
      return entry.item.id;
    case 'video':
      return entry.video.slug;
    case 'thread':
      return `thread:${entry.doorway.threadId}`;
    case 'egg':
      return `egg:${entry.doorway.eggId}`;
    case 'current':
      return `current:${entry.item.id}`;
    default: {
      const exhaustive: never = entry;
      return exhaustive;
    }
  }
}

/** The YouTube ids already embedded on curated moments in this era — the
 * de-dup key that keeps one video from appearing as both a moment card and a
 * video card in the same list. */
export function embeddedYoutubeIds(items: ContentItem[]): Set<string> {
  return new Set(
    items.map((it) => it.video?.youtubeId).filter((id): id is string => Boolean(id)),
  );
}

/**
 * Copy for the moment a global filter genuinely turns up nothing in an era —
 * e.g. Tour in folklore, which never had one. That's newly reachable now that
 * the filter is global (PLAN.md step 6a): the era section itself must NOT
 * collapse, so this is only the feed body's replacement line — the hero and
 * lyric above it, and the section's own height, are untouched.
 *
 * Names every active filter (in chip order, per ALL_FILTERS) and the era by
 * its own `shortName` casing (folklore, TTPD, ...) rather than inventing a
 * second label set — that's what keeps this in the site's lowercase-warm
 * voice without any per-era special-casing here.
 */
export function emptyFeedMessage(active: ReadonlySet<FilterId>, eraShortName: string): string {
  if (active.size === 0) return 'No moments in this era yet.';
  const names = ALL_FILTERS.filter((f) => active.has(f));
  const joined =
    names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `Nothing under ${joined} in ${eraShortName}.`;
}

/**
 * Every video id the era can play: the moments' own embeds plus the Videos
 * rail's records.
 *
 * This is "a video the reader could meet in this era", which is the question
 * `feedCardImageHidden` needs when deciding whether a card's photo is a still of
 * footage that plays somewhere else on the page — a superset of
 * `embeddedYoutubeIds`, which only knows about moments.
 *
 * Takes the records rather than reading `videosForEra` itself so this module
 * stays a pure function of its arguments (the whole reason the selection rules
 * live here and not in the component — see the header note).
 */
export function eraKnownVideoIds(
  items: ContentItem[],
  videos: readonly { youtubeId: string }[],
): Set<string> {
  const ids = embeddedYoutubeIds(items);
  for (const v of videos) ids.add(v.youtubeId);
  return ids;
}
