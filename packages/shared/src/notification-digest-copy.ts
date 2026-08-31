// Notifications Phase 3 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §5) —
// digest copy generation. Portable, zero I/O (packages/shared, not core) so
// it's unit-testable without a database and — per this repo's
// architecture.md convention (packages/shared holds pure types/logic,
// packages/core holds data access) — the digest dispatch job in
// packages/core imports this rather than duplicating string-building logic
// server-side.
import type { AnyNotificationCategory } from './notifications-types';

/** One event queued into a device's digest — the minimal shape the copy
 * generator needs (a subset of the `events` row, category-labeled so the
 * copy can group/count without a second DB round-trip). */
export interface DigestQueueItem {
  category: AnyNotificationCategory;
  title: string;
}

/** Per-category display label used in digest summaries — short, plural-
 * agnostic nouns (spec §5's example: "new video, merch restock, 2
 * theories"). Falls back to the raw category id (with underscores turned to
 * spaces) for any category not explicitly listed, so a future category
 * addition never crashes copy generation. */
const CATEGORY_NOUN: Partial<Record<AnyNotificationCategory, string>> = {
  song_drop: 'new song',
  album_news: 'album update',
  tour_news: 'tour update',
  official_youtube: 'new video',
  official_merch: 'merch restock',
  relationship_news: 'relationship update',
  public_appearance: 'appearance',
  award_news: 'award update',
  fan_merch: 'fan merch pick',
  easter_egg: 'theory',
  lyric_of_day: 'lyric',
  on_this_day: 'on-this-day moment',
  swiftie_trivia: 'trivia question',
};

function nounFor(category: AnyNotificationCategory, count: number): string {
  const base = CATEGORY_NOUN[category] ?? category.replace(/_/g, ' ');
  if (count === 1) return base;
  // Cheap English pluralization — good enough for the handful of nouns
  // above (none end in a sibilant/consonant-y that would need special
  // handling: "songs", "updates", "videos", "restocks", "picks", "theories"
  // is the only one, handled explicitly).
  if (base.endsWith('y') && !/[aeiou]y$/.test(base)) return `${base.slice(0, -1)}ies`;
  return `${base}s`;
}

/**
 * Builds the standard daily/weekly digest body (spec §5: "Today in Taylor:
 * new video, merch restock, 2 theories →"), grouping items by category and
 * listing counts for anything with more than one. Every digest ends with
 * "Manage notifications" (spec §8's required footer) — appended by the
 * caller via `withManageFooter`, not baked in here, so the weekly Clown
 * Report (which has its own opening line, see `buildEasterEggDigestTitle`)
 * can still share this summarizer for its body if it ever wants to.
 */
export function buildDigestSummary(items: readonly DigestQueueItem[]): string {
  if (items.length === 0) return 'Nothing new right now.';

  const counts = new Map<AnyNotificationCategory, number>();
  const order: AnyNotificationCategory[] = [];
  for (const item of items) {
    if (!counts.has(item.category)) order.push(item.category);
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }

  const parts = order.map((category) => {
    const count = counts.get(category) ?? 0;
    const noun = nounFor(category, count);
    return count > 1 ? `${count} ${noun}` : noun;
  });

  return parts.join(', ');
}

/** spec §8: "Every digest ends with a 'Manage notifications' line." Applied
 * as a single trailing line so the push body always carries it regardless
 * of which summary function produced the main text. */
export function withManageFooter(body: string): string {
  return `${body}\nManage notifications`;
}

const DAILY_TITLE = 'Today in Taylor';
const WEEKLY_TITLE = 'This week in Taylor';

/** spec §5's daily digest title convention ("Today in Taylor: …"). Weekly
 * digests (non-easter_egg categories bundled together) use the same shape
 * with "This week" — the easter_egg weekly digest has its OWN dedicated
 * branding (`buildEasterEggDigestTitle`) and is never merged into this
 * generic weekly title.
 */
export function buildDigestTitle(cadence: 'daily' | 'weekly'): string {
  return cadence === 'daily' ? DAILY_TITLE : WEEKLY_TITLE;
}

export function buildDigestBody(cadence: 'daily' | 'weekly', items: readonly DigestQueueItem[]): string {
  const title = buildDigestTitle(cadence);
  const summary = buildDigestSummary(items);
  return withManageFooter(`${title}: ${summary} →`);
}

/** spec §4's `easter_egg` row: "Weekly digest branded **'The Weekly Clown
 * Report 🤡'** — top theories, Clownbot-curated." Verbatim branding,
 * required to be distinguishable from the generic weekly digest per the
 * NOTIFICATIONS_PROMPTS.md Phase 3 scope line. Never used for the daily
 * cadence — easter_egg's only cadences are weekly/off/instant per spec §4's
 * table (T3, Weekly default), so a daily easter_egg digest is out of spec
 * and this function is only ever called for the weekly path. */
export const WEEKLY_CLOWN_REPORT_TITLE = 'The Weekly Clown Report \u{1F921}';

export interface ClownTheory {
  /** e.g. a `live_theory.claim` or `live_theory.name` string from the
   * Clownbot curation query (see notification-clownbot-source.ts). */
  summary: string;
}

/**
 * Builds the Weekly Clown Report body from a set of curated top theories.
 * Falls back to a plain "no theories this week" line rather than fabricating
 * content when the curation source returns nothing — this task's scope note
 * (stub the query interface clearly rather than inventing fake curation
 * data) extends to the copy generator: an empty input must never render a
 * made-up theory.
 */
export function buildEasterEggDigestBody(theories: readonly ClownTheory[]): string {
  if (theories.length === 0) {
    return withManageFooter(`${WEEKLY_CLOWN_REPORT_TITLE}: no fresh theories to report this week →`);
  }
  const summary = theories
    .slice(0, 3)
    .map((t) => t.summary)
    .join(' • ');
  return withManageFooter(`${WEEKLY_CLOWN_REPORT_TITLE}: ${summary} →`);
}
