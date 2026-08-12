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
export type EraFeedEntry =
  | { kind: 'moment'; item: ContentItem }
  | { kind: 'video'; video: VideoNote };

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
  if (filter.videosOnly) return items.filter((it) => it.video);
  if (filter.tags.size === 0) return items;
  return items.filter((it) => itemMatchesFilter(it.tags, filter.tags));
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
export function visibleVideos(
  timelineVideos: VideoNote[],
  videoFeed: VideoNote[],
  filter: EraFeedFilter,
): VideoNote[] {
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
export function mergeEraFeed(moments: ContentItem[], videos: VideoNote[]): EraFeedEntry[] {
  const entries: EraFeedEntry[] = [
    ...moments.map((item): EraFeedEntry => ({ kind: 'moment', item })),
    ...videos.map((video): EraFeedEntry => ({ kind: 'video', video })),
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

/** The YouTube ids already embedded on curated moments in this era — the
 * de-dup key that keeps one video from appearing as both a moment card and a
 * video card in the same list. */
export function embeddedYoutubeIds(items: ContentItem[]): Set<string> {
  return new Set(
    items.map((it) => it.video?.youtubeId).filter((id): id is string => Boolean(id)),
  );
}
