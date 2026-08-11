// Pure selection logic for the social poster — kept separate from the
// network/filesystem code in post-queue.mjs so it's unit-testable.

/** Hard per-run and per-platform-per-day backstops (charter rail 3: caps are
 * code, never trust-based). Overridable only by editing this file — a PR,
 * same as any other rail change. */
export const MAX_POSTS_PER_RUN = 5;
export const MAX_POSTS_PER_PLATFORM_PER_DAY = 10;

/** How long an item may sit due-but-unpostable before the poster stops
 * treating it as a normal wait and makes the run red. Two days of quiet
 * skipping is what 2026-08-09-august-augustine-ig.json got. */
export const STUCK_AFTER_HOURS = 24;

/** True if the queue item's scheduled time has arrived.
 *
 * Per-item founder approval was REMOVED 2026-07-25 (Wyatt, CTO) — see
 * docs/decisions.md. The desk now queues and the poster ships on schedule.
 * `approvedBy`/`approvedAt` remain optional provenance fields (who/when, when
 * a human did weigh in) but are no longer a gate. What still constrains
 * posting: the SOCIAL_FREEZE crisis stop, and the caps above.
 *
 * NOTE — this is a "not before" test, not the whole readiness question.
 * `scheduledAt` passing is necessary but not sufficient: an item whose media
 * is not yet reachable on the live site is NOT postable, and post-queue.mjs
 * enforces that separately (lib/preflight.mjs) because it needs the network
 * and this module is deliberately pure. See requiresLiveMedia below. */
export function isDue(item, now) {
  return new Date(item.scheduledAt).getTime() <= now.getTime();
}

/** True when the platform will go and FETCH this item's media from the live
 * site, so the media must be deployed before the post can succeed. Instagram
 * always (Meta fetches by URL, and a Facebook cross-post rides the same
 * path); X only if/when X media posting lands. */
export function requiresLiveMedia(item) {
  return Boolean(item.media?.length) && (item.platform === 'instagram' || item.platform === 'x');
}

/** Hours since `scheduledAt` passed (0 for a not-yet-due item). The number a
 * waiting/skipped item carries into the run report so "waiting" and "stuck"
 * are distinguishable without reading two days of Action logs. */
export function hoursOverdue(item, now) {
  const ms = now.getTime() - new Date(item.scheduledAt).getTime();
  return ms <= 0 ? 0 : ms / (60 * 60 * 1000);
}

/**
 * Selects which due queue items to post this run, respecting the per-run cap
 * and each platform's remaining daily budget. `postedToday` is a
 * Map<platform, count> of items already posted today (from social/posted/).
 */
export function selectDuePosts(items, now, postedToday) {
  const remaining = new Map(postedToday);
  const due = items.filter((item) => isDue(item, now)).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const selected = [];
  for (const item of due) {
    if (selected.length >= MAX_POSTS_PER_RUN) break;
    const usedToday = remaining.get(item.platform) ?? 0;
    if (usedToday >= MAX_POSTS_PER_PLATFORM_PER_DAY) continue;
    selected.push(item);
    remaining.set(item.platform, usedToday + 1);
  }
  return selected;
}

/** YYYY-MM-DD in UTC, used to bucket social/posted/ files by day. */
export function utcDateOnly(isoOrDate) {
  return new Date(isoOrDate).toISOString().slice(0, 10);
}

/**
 * Generic era-cover art (`/eras/<id>.png`) posing as a post's real photo,
 * rather than a dedicated image of the actual thing the post is about.
 *
 * Added 2026-08-06 after the drafting run defaulted to this "safe" fallback
 * on literally every Instagram post it ever made (17/17) — with only 12
 * distinct era-cover files in rotation and the current/recent eras getting
 * picked disproportionately, the live profile grid looked like the same 2-3
 * generic images repeating over and over, which is exactly what it was (see
 * docs/decisions.md, same date). growth-draft.md now requires sourcing a
 * real dedicated photo per post; this is the code-level backstop, since a
 * doc instruction alone didn't hold — a real check does.
 */
export function isGenericEraArt(mediaPath) {
  return typeof mediaPath === 'string' && /^\/eras\/[a-z0-9-]+\.png$/.test(mediaPath);
}

/**
 * True if posting `item` right now would repeat a generic era-cover image
 * that already appears among the last `lookback` real Instagram posts.
 * Non-Instagram items and items with a real (non-era-art) photo always pass.
 * `recentPosted` is the already-posted-today-or-recently item list, newest
 * first is NOT required — this only checks membership, not order.
 */
export function repeatsRecentEraArt(item, recentPosted, lookback = 10) {
  if (item.platform !== 'instagram') return false;
  const media = item.media?.[0];
  if (!isGenericEraArt(media)) return false;

  const recentEraArt = new Set(
    recentPosted
      .slice(-lookback)
      .map((p) => p.media?.[0])
      .filter(isGenericEraArt),
  );
  return recentEraArt.has(media);
}

/**
 * Ground-truth counts of what's actually sitting in social/queue/, for the
 * brief's Growth line — added 2026-07-18 after a brief asserted "drafts
 * wait on your OK in Slack #social" while the queue was empty. No LLM
 * curation pass should ever describe queue contents from what the charter
 * says *should* happen; this is the deterministic fact to copy instead.
 *
 * Since approval stopped gating posting (2026-07-25), the useful split is
 * scheduled-vs-pending, not approved-vs-not. `awaitingApproval` is retained
 * as an always-0 alias so an un-updated brief prompt can't crash.
 */
export function summarizeQueueStatus(items, now = new Date()) {
  const scheduled = items.filter((item) => new Date(item.scheduledAt).getTime() > now.getTime()).length;
  return { total: items.length, scheduled, due: items.length - scheduled, awaitingApproval: 0 };
}
