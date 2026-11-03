import type { CurrentItem } from '@swift2/shared';
import { passesCurrentItemQualityGate } from '@swift2/shared';
import { collapseMergedDuplicates } from './current-feed';
import type { EraFeedEntry } from './era-feed';
import type { VideoNote } from './types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Whether a live item was observed within the last 7 days — the one window
 * both the pinned "This week's news" section and the stream's exclusion of
 * those same items read, so the two can never overlap or leave a gap. */
export function isThisWeekNews(item: CurrentItem, nowMs: number): boolean {
  const t = Date.parse(item.observedOn);
  return !Number.isNaN(t) && t >= nowMs - WEEK_MS;
}

/**
 * The pinned "This week's news" list: quality-gated, merged-duplicate-collapsed
 * live items observed in the last 7 days, newest first (ties by id).
 */
export function thisWeekNewsItems(items: readonly CurrentItem[], nowMs: number): CurrentItem[] {
  return collapseMergedDuplicates(items)
    .filter((item) => passesCurrentItemQualityGate(item) && isThisWeekNews(item, nowMs))
    .sort((a, b) => {
      const diff = Date.parse(b.observedOn) - Date.parse(a.observedOn);
      return diff !== 0 ? diff : a.id.localeCompare(b.id);
    });
}

/**
 * The doorway + live entries that still merge into the era stream: egg
 * doorways are dropped (they live in Threads' "Theories & eggs" lens) and live
 * items inside the "This week's news" window are dropped (pinned section).
 * Both merge sites (EraSection.tsx, era-stream.ts) call this so they stay in
 * lockstep.
 */
export function streamExtraEntries<V extends VideoNote>(
  doorwayEntries: readonly EraFeedEntry<V>[],
  liveEntries: readonly EraFeedEntry<V>[],
  nowMs: number,
): EraFeedEntry<V>[] {
  return [
    ...doorwayEntries.filter((e) => e.kind !== 'egg'),
    ...liveEntries.filter((e) => !(e.kind === 'current' && isThisWeekNews(e.item, nowMs))),
  ];
}
