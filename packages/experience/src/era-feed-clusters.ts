import type { ContentItem, VideoNote } from '@swift2/experience';
import type { Anchored } from '@swift2/experience';
import type { EraFeedEntry } from './era-feed';

/**
 * Release-day pileups (#696): 8 of 12 eras pin 8-17 track stories to one
 * album-release `date`, so the chronological feed collapses to a wall of
 * same-day cards followed by silence. The issue's preferred fix is
 * content-side re-dating (893e6435 tried it for folklore and found only one
 * item — "exile" — with a stated alternate hook date in its own body text;
 * the rest have none, and inventing one is against the issue's hard rule).
 * This is the issue's UI-side fallback: group a same-day run at or above
 * `CLUSTER_MIN_SIZE` into one collapsible "release day, track by track"
 * card (`ClusterCard`) instead of splitting the era into category
 * sub-sections — the run stays exactly where it sorts, it just renders as
 * one card until expanded.
 *
 * Applied AFTER `visibleFeed` (era-feed.ts), never before: `filtersForEntry`
 * only knows the five real `EraFeedEntry` kinds, and teaching it a sixth,
 * synthetic one so a tag filter could look inside a not-yet-formed cluster
 * would be solving a problem clustering doesn't have — grouping is a
 * render-only transform of whatever already survived filtering.
 */
export type ClusterEntry = {
  kind: 'cluster';
  items: ContentItem[];
  anchor: Anchored;
};

export type RenderFeedEntry<V extends VideoNote = VideoNote> = EraFeedEntry<V> | ClusterEntry;

/**
 * Same-day pileup size at or above which a run of consecutive `moment`
 * entries collapses into one `ClusterEntry`. Set to 8 — the issue's own
 * cutoff for "pileup" (its title: "8 of 12 eras stack 8-17 same-day cards");
 * every era below that line (reputation's 5, the rest lower) keeps rendering
 * as plain cards. Exported so it is assertable and tunable.
 */
export const CLUSTER_MIN_SIZE = 8;

/**
 * Collapses consecutive same-day `moment` runs of `minSize` or more into one
 * `ClusterEntry`, in place in the feed order — everything else (videos,
 * doorways, current items, and any moment run under `minSize`) passes
 * through unchanged. `entries` MUST already be newest-first and filtered
 * (see the header note); this only regroups, never re-sorts.
 */
export function clusterSameDayMoments<V extends VideoNote>(
  entries: EraFeedEntry<V>[],
  minSize: number = CLUSTER_MIN_SIZE,
): RenderFeedEntry<V>[] {
  const out: RenderFeedEntry<V>[] = [];
  let run: Extract<EraFeedEntry<V>, { kind: 'moment' }>[] = [];

  const flush = () => {
    if (run.length >= minSize) {
      out.push({ kind: 'cluster', items: run.map((e) => e.item), anchor: run[0].anchor });
    } else {
      out.push(...run);
    }
    run = [];
  };

  for (const entry of entries) {
    if (entry.kind === 'moment') {
      if (run.length > 0 && entry.anchor.sortDate === run[0].anchor.sortDate) {
        run.push(entry);
      } else {
        flush();
        run.push(entry);
      }
    } else {
      flush();
      out.push(entry);
    }
  }
  flush();
  return out;
}
