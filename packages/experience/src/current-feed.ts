import type { CurrentItem, CurrentItemStatus, LiveTheory } from '@swift2/shared';
import { resolveAnchor } from './anchor-date';
import { formatRelativeTime } from './format';
import type { EraFeedEntry } from './era-feed';
import type { VideoNote } from './types';

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
 * Whether `item` is a currently-live, still-open countdown — the plain
 * computed predicate t_09dc269f's approved design specifies instead of a
 * separately stored "is pinned" flag: `countdownTargetAt` set, in the
 * future (within `graceMs` grace past the deadline, so the banner doesn't
 * flicker off the instant the clock ticks past zero and before the
 * resolution sweep catches up), and `countdownResolvedAt` still unset.
 */
const DEFAULT_COUNTDOWN_GRACE_MS = 15 * 60 * 1000; // 15 minutes

export function isLiveCountdown(
  item: CurrentItem,
  nowMs: number,
  graceMs: number = DEFAULT_COUNTDOWN_GRACE_MS,
): boolean {
  if (!item.countdownTargetAt || item.countdownResolvedAt) return false;
  const targetMs = Date.parse(item.countdownTargetAt);
  if (Number.isNaN(targetMs)) return false;
  return targetMs > nowMs - graceMs;
}

/**
 * The single banner-slot winner among every live countdown in `items`, or
 * undefined when none qualify. Same tie-break philosophy as
 * `era-feed.ts`'s `entryTiebreakId` (t_09dc269f's approved design §4):
 * soonest `countdownTargetAt` wins (most time-sensitive first), ties broken
 * by the stable `id` so the pick is deterministic across renders/refetches.
 * Never returns more than one item — the banner slot is never stacked and
 * never deadlocked.
 */
export function pickCountdownBannerItem(
  items: readonly CurrentItem[],
  nowMs: number,
  graceMs?: number,
): CurrentItem | undefined {
  const live = items.filter((item) => isLiveCountdown(item, nowMs, graceMs));
  if (live.length === 0) return undefined;
  return live.reduce((soonest, candidate) => {
    const soonestMs = Date.parse(soonest.countdownTargetAt!);
    const candidateMs = Date.parse(candidate.countdownTargetAt!);
    if (candidateMs !== soonestMs) return candidateMs < soonestMs ? candidate : soonest;
    return candidate.id.localeCompare(soonest.id) < 0 ? candidate : soonest;
  });
}

/** Mirrors `HEAT_PROMOTION_THRESHOLD` in `apps/worker/src/extract/
 * theory-promote.ts` (currently `PROMOTION_MENTION_THRESHOLD === 3`) — the
 * same bar a merged fan-theory cluster must clear to be promoted into
 * `live_theory` at all. Duplicated here (not imported) because `apps/worker`
 * is a server-side extraction app, never a dependency of the client-bundled
 * `@swift2/experience` package; if the worker's threshold ever changes,
 * update this constant to match (both are small, reviewed numbers, not a
 * runtime-shared config). */
const BIG_THEORY_HEAT_THRESHOLD = 3;

/** A `live_theory.status` this component must never treat as "big" — the
 * fandom (or the corpus) has already closed the book on it, so it competes
 * for a live pin slot only while genuinely live: `rumor` or better (any
 * status other than these two), same "not debunked/faded" vocabulary
 * `CURRENT_ITEM_STATUSES` uses. */
const THEORY_BANNER_DISQUALIFIED_STATUSES = new Set(['debunked', 'faded']);

/**
 * Whether `theory` is a "big" fan theory that qualifies for the pin-banner
 * slot: `heat` over the promotion threshold (Community Engine P2-3/P2-4 —
 * `theory-promote.ts` already gates `live_theory` promotion at this same
 * bar, so a promoted row already crossed it once; heat keeps moving after
 * promotion as more mentions/signals land, so this re-checks live, not just
 * "was ever promoted") and a status that isn't `debunked`/`faded`.
 */
export function isBigTheory(theory: LiveTheory, heatThreshold: number = BIG_THEORY_HEAT_THRESHOLD): boolean {
  return theory.heat >= heatThreshold && !THEORY_BANNER_DISQUALIFIED_STATUSES.has(theory.status);
}

/** The single banner-slot winner among every qualifying big theory in
 * `theories`, or undefined when none qualify. Same tie-break shape as
 * `pickCountdownBannerItem`: highest `heat` wins (most attention-worthy
 * first — a theory has no hard deadline, so heat is its time-sensitivity
 * proxy), ties broken by the stable `id`. Never returns more than one. */
function pickBigTheoryBannerItem(
  theories: readonly LiveTheory[],
  heatThreshold: number = BIG_THEORY_HEAT_THRESHOLD,
): LiveTheory | undefined {
  const big = theories.filter((theory) => isBigTheory(theory, heatThreshold));
  if (big.length === 0) return undefined;
  return big.reduce((hottest, candidate) => {
    if (candidate.heat !== hottest.heat) return candidate.heat > hottest.heat ? candidate : hottest;
    return candidate.id.localeCompare(hottest.id) < 0 ? candidate : hottest;
  });
}

/** Discriminated union of the two candidate types the pin-banner slot can
 * render — a live countdown (`current_item`) or a big fan theory
 * (`live_theory`). Exactly one of these, or neither, ever wins the slot. */
export type BannerCandidate =
  | { kind: 'countdown'; item: CurrentItem }
  | { kind: 'theory'; theory: LiveTheory };

/**
 * The single pin-banner-slot winner across BOTH candidate types (fast-follow
 * to t_ddc17685's countdown-only primitive, per t_edbd5380/t_828262c5's
 * approved design). Same single-slot/tie-break philosophy as
 * `pickCountdownBannerItem`, extended across types instead of within one:
 * "whichever is more time-sensitive/deadline-driven wins" — a live countdown
 * always has a hard deadline, a big theory never does, so a qualifying
 * countdown always wins the slot over a big theory when both are live.
 * A big theory only ever takes the slot when there's no live countdown to
 * beat it. Never stacks, never deadlocks: this delegates to
 * `pickCountdownBannerItem`/`pickBigTheoryBannerItem`, each of which already
 * resolves to at most one item with a stable-id tiebreak.
 */
export function pickBannerCandidate(
  items: readonly CurrentItem[],
  theories: readonly LiveTheory[],
  nowMs: number,
  graceMs?: number,
  heatThreshold?: number,
): BannerCandidate | undefined {
  const countdownItem = pickCountdownBannerItem(items, nowMs, graceMs);
  if (countdownItem) return { kind: 'countdown', item: countdownItem };
  const theory = pickBigTheoryBannerItem(theories, heatThreshold);
  return theory ? { kind: 'theory', theory } : undefined;
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
