import type { CurrentItem, CurrentItemStatus } from '@swift2/shared';
import { resolveAnchor } from './anchor-date';
import { formatRelativeTime } from './format';
import type { EraFeedEntry } from './era-feed';
import type { VideoNote } from '@swift2/experience';

/**
 * Builds the fifth `EraFeedEntry` kind ('current') from the current era's
 * live `current_item` rows — see era-feed.ts's header doc for the union.
 * `observedOn` is always a real, authored date, so every current-item entry
 * anchors `via: 'exact'`, never era-scattered (PLAN.md Stage 5: "Sort by
 * observed_on"). Rows with `promoted_to` set never reach here — the
 * knowledge client's query already excludes them (packages/core/src/
 * knowledge/client.ts).
 */
export function currentFeedEntries<V extends VideoNote>(
  items: readonly CurrentItem[],
  eraStart: string,
  eraEnd: string,
): EraFeedEntry<V>[] {
  return items.map((item) => ({
    kind: 'current' as const,
    item,
    anchor: resolveAnchor({ exactDate: item.observedOn, eraStart, eraEnd, id: item.id }),
  }));
}

/** First reported source's outlet name, for the "Live · reported by X" chip
 * (PLAN.md Stage 5 — outlet from `sources` jsonb, first entry's `name`). */
export function outletFor(item: CurrentItem): string | undefined {
  return item.sources[0]?.name || undefined;
}

/**
 * Honest status language for `CurrentItemDetail`'s mandatory rumor banner —
 * a distinct vocabulary from `RumorStatus` (MomentDetail.tsx) and
 * `TheoryOutcome` (vault-types.ts); PLAN.md Stage 5 ground truth warns
 * against conflating the three. Phrasing echoes MomentDetail's
 * RUMOR_STATUS_BADGE for voice consistency, not because the vocabularies
 * are the same set.
 */
export const CURRENT_ITEM_STATUS_COPY: Record<CurrentItemStatus, { label: string; blurb: string }> = {
  rumor: {
    label: 'Rumor — unconfirmed',
    blurb: 'Circulating among fans, not yet reported by a news outlet.',
  },
  reported: {
    label: 'Reported — not confirmed',
    blurb: 'Press reporting. Not confirmed by Taylor, her team, or an official source.',
  },
  confirmed: {
    label: 'Confirmed',
    blurb: 'Confirmed — still shown here as live until it moves into the Vault.',
  },
  debunked: {
    label: 'Debunked',
    blurb: 'This claim has been disproven.',
  },
  faded: {
    label: 'Never confirmed or denied',
    blurb: 'Reported, never confirmed, never denied, and gone quiet.',
  },
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The masthead's "Updated Nh ago · N new this week" line (PLAN.md Stage 5) —
 * null when there's no live data yet, so the masthead keeps its static copy
 * rather than claiming freshness it can't back up.
 */
export function summarizeCurrentActivity(
  items: readonly CurrentItem[],
  nowMs: number,
): { updatedLabel: string; newThisWeek: number } | null {
  if (items.length === 0) return null;
  const mostRecentMs = items.reduce((latest, it) => {
    const t = Date.parse(it.updatedAt);
    return Number.isNaN(t) ? latest : Math.max(latest, t);
  }, 0);
  const updatedLabel =
    mostRecentMs > 0 ? (formatRelativeTime(new Date(mostRecentMs).toISOString(), nowMs) ?? 'recently') : 'recently';
  const weekAgo = nowMs - WEEK_MS;
  const newThisWeek = items.filter((it) => {
    const t = Date.parse(it.observedOn);
    return !Number.isNaN(t) && t >= weekAgo;
  }).length;
  return { updatedLabel, newThisWeek };
}
