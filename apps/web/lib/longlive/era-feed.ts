import type { ContentItem, ContentTag, VideoNote } from './types';
import { itemMatchesFilter } from './tagBadges';

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
 * Two filter axes, deliberately exclusive (see EraSection's `videosOnly`):
 *   - tags      — select MOMENTS by category
 *   - videosOnly — select by "is there something to watch here"
 */

/** One entry in the merged feed: a curated moment, or a video record. */
export type EraFeedEntry<V extends VideoNote = VideoNote> =
  | { kind: 'moment'; item: ContentItem }
  | { kind: 'video'; video: V };

/** The active filter state. `videosOnly` wins when both are set — the UI keeps
 * them mutually exclusive, and this stays defined rather than undefined if a
 * future caller sets both. */
export interface EraFeedFilter {
  tags: ReadonlySet<ContentTag>;
  videosOnly: boolean;
}

/**
 * The moments to render. Under the Videos filter that's only the moments that
 * carry footage of their own; otherwise it's the existing tag filter, with an
 * empty tag set meaning "everything" (filtering is off by default).
 *
 * Returns the input array itself when nothing is filtered out, so the common
 * case allocates nothing and referential equality holds for memo consumers.
 */
export function visibleMoments(items: ContentItem[], filter: EraFeedFilter): ContentItem[] {
  if (filter.videosOnly) {
    // Not `it.video` — a moment that defers its embed to an earlier card
    // (#2057) has nothing to play, and a card that can't play has no business
    // inside a filter called Videos. It keeps its place in the default feed.
    const owners = inlineVideoMomentIds(items);
    return items.filter((it) => owners.has(it.id));
  }
  if (filter.tags.size === 0) return items;
  return items.filter((it) => itemMatchesFilter(it.tags, filter.tags));
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
 * The video records to merge into the feed.
 *
 * - Videos filter ON  → everything watchable in the era (`videoFeed`), which is
 *   every kind including the appearance family.
 * - Videos filter OFF → the default #439 behaviour: the dated music videos
 *   only, and only while the feed isn't filtered to some other category. A
 *   music video is 'Music'; it has no business surviving a 'Fashion' filter.
 *
 * Both lists arrive pre-de-duped against the moments that already embed them
 * (see `eraVideoFeed`), so the caller can't accidentally show a video twice.
 */
export function visibleVideos<V extends VideoNote>(
  timelineVideos: V[],
  videoFeed: V[],
  filter: EraFeedFilter,
): V[] {
  if (filter.videosOnly) return videoFeed;
  if (filter.tags.size === 0 || filter.tags.has('Music')) return timelineVideos;
  return [];
}

/**
 * Merge moments and videos into one newest-first feed, so cross-type ordering
 * is correct instead of two concatenated lists.
 *
 * Undated video records sort to the end (they're only reachable under the
 * Videos filter, where there is no chronology to break) rather than being
 * dropped — hiding a tour film from the filter that exists to find things to
 * watch would be the wrong kind of tidy.
 */
export function mergeEraFeed<V extends VideoNote>(
  moments: ContentItem[],
  videos: V[],
): EraFeedEntry<V>[] {
  const entries: EraFeedEntry<V>[] = [
    ...moments.map((item): EraFeedEntry<V> => ({ kind: 'moment', item })),
    ...videos.map((video): EraFeedEntry<V> => ({ kind: 'video', video })),
  ];
  return entries.sort((a, b) => {
    const dateA = a.kind === 'moment' ? a.item.date : a.video.releasedOn;
    const dateB = b.kind === 'moment' ? b.item.date : b.video.releasedOn;
    if (dateA === null || dateB === null) {
      if (dateA === dateB) return 0;
      return dateA === null ? 1 : -1;
    }
    return dateB.localeCompare(dateA);
  });
}

/**
 * How many cards the Videos filter will actually show — i.e. what the chip's
 * badge must say.
 *
 * NOT the same as the era's video-record count, which is what the rail heading
 * and the hero jump button show (both point AT the rail, so the rail's own
 * count is right for them). The filtered view additionally includes the
 * moments that carry their own footage, so on tloas the rail holds 9 playable
 * records while the filter shows 10 cards. A chip that promises one number and
 * yields another is a small lie told on every era, so the badge is computed
 * from the same selection the filter uses — including the #2057 de-dupe, which
 * is why this counts CARDS via visibleMoments rather than moments with a video.
 */
export function watchableCount(items: ContentItem[], videoFeed: VideoNote[]): number {
  return visibleMoments(items, { tags: new Set(), videosOnly: true }).length + videoFeed.length;
}

/**
 * The scroll-anchor date to stamp on undated video cards (only reachable under
 * the Videos filter, where they sort to the end of the list).
 *
 * TimelineScrubber reads `data-ll-date` off rendered cards and interpolates
 * assuming they descend down the page. Two wrong answers here:
 *   - leave them unanchored — on debut that is 4 of 7 cards, so the scrubber
 *     interpolates across a tall region with no anchors at all;
 *   - stamp `era.start` — an era can contain a moment dated BEFORE its own
 *     start (debut starts 2006-10-24 and carries "Tim McGraw arrives",
 *     2006-06-19), so the tail would step back UP and break the ordering.
 *
 * So: the earliest date already present in this feed, floored by `eraStart`.
 * The tail is then always <= every dated card above it, and the sequence stays
 * non-increasing. Nothing renders this value — the card still reads "Date
 * unknown" — it exists only so the scrubber has a continuous anchor list.
 */
export function undatedAnchorDate(entries: EraFeedEntry[], eraStart: string): string {
  let earliest = eraStart;
  for (const e of entries) {
    const date = e.kind === 'moment' ? e.item.date : e.video.releasedOn;
    if (date && date < earliest) earliest = date;
  }
  return earliest;
}

/** The YouTube ids already embedded on curated moments in this era — the
 * de-dup key that keeps one video from appearing as both a moment card and a
 * video card in the same list. */
export function embeddedYoutubeIds(items: ContentItem[]): Set<string> {
  return new Set(
    items.map((it) => it.video?.youtubeId).filter((id): id is string => Boolean(id)),
  );
}
