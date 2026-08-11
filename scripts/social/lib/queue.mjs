// Pure selection logic for the social poster — kept separate from the
// network/filesystem code in post-queue.mjs so it's unit-testable.

/** Hard per-run and per-platform-per-day backstops (charter rail 3: caps are
 * code, never trust-based). Overridable only by editing this file — a PR,
 * same as any other rail change. */
export const MAX_POSTS_PER_RUN = 5;
export const MAX_POSTS_PER_PLATFORM_PER_DAY = 10;

/** True if the queue item is due to post.
 *
 * Per-item founder approval was REMOVED 2026-07-25 (Wyatt, CTO) — see
 * docs/decisions.md. The desk now queues and the poster ships on schedule.
 * `approvedBy`/`approvedAt` remain optional provenance fields (who/when, when
 * a human did weigh in) but are no longer a gate. What still constrains
 * posting: the SOCIAL_FREEZE crisis stop, and the caps above. */
export function isDue(item, now) {
  return new Date(item.scheduledAt).getTime() <= now.getTime();
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
 * True if `mediaPath` appears anywhere in the media of the last `lookback`
 * posted Instagram items. General-purpose (not era-art-specific) — used both
 * by the era-art repeat check below and by the draft-time checker's "don't
 * reuse a real dedicated photo either" rule, since a repeat is a repeat
 * whether or not it's a generic era tile.
 */
export function repeatsRecentIgMedia(mediaPath, recentIgPosted, lookback = 10) {
  if (!mediaPath) return false;
  const recentSet = new Set(recentIgPosted.slice(-lookback).flatMap((p) => p.media ?? []));
  return recentSet.has(mediaPath);
}

/**
 * Replaces the old repeatsRecentEraArt() (removed 2026-08-11 — see
 * social/README.md's `mediaKind` section and docs/decisions.md). That
 * function only ever caught the REPEAT half of the era-art problem; it had
 * no way to catch the more common failure the 2026-08-09
 * august-augustine-ig item exposed: a drafter defaulting to `/eras/<id>.png`
 * as a "safe" fallback with no signal that the choice was deliberate. Worse,
 * because the guard only advances when a NEW Instagram post actually lands,
 * a single blocked item can deadlock itself — silently skipped every run
 * forever, since nothing else ever pushes it out of the lookback window.
 *
 * This still returns null (not blocked) for anything that isn't era art at
 * all — a real dedicated photo never trips this guard, however often reused
 * (see repeatsRecentIgMedia for that separate, opt-in check used by the
 * draft-time checker instead).
 *
 * Two distinct block reasons, both surfaced as a human-readable string
 * (or null when the item is fine to post):
 *   - "undeclared": era-cover art with no `mediaKind: "era-art"` tag. This
 *     is authored wrong, not merely unlucky timing — it never becomes
 *     postable just by waiting, so callers should let the 48h staleness
 *     rule fail it out rather than leave it skipping forever.
 *   - "repeat": DECLARED era art (mediaKind is set) whose file is still
 *     inside the last `lookback` posted Instagram items — a genuinely
 *     transient block that clears on its own as the window advances.
 *
 * Deliberately platform-agnostic (the old function only checked
 * `item.platform === 'instagram'`): X can carry media now too, and the same
 * generic-art-grid problem applies to any platform that posts the image, so
 * this checks by media shape, not by platform.
 */
export function eraArtGuardReason(item, recentIgPosted, lookback = 10) {
  const media = item.media?.[0];
  if (!isGenericEraArt(media)) return null;

  if (item.mediaKind !== 'era-art') {
    return `undeclared era art: media "${media}" is generic era-cover art but the draft is missing "mediaKind": "era-art" — looks like a lazy fallback, not a deliberate choice, and needs a real dedicated photo or the explicit tag.`;
  }

  if (repeatsRecentIgMedia(media, recentIgPosted, lookback)) {
    return `repeated era art: "${media}" already appears among the last ${lookback} posted Instagram items — wait for the window to advance or swap in a different era's tile.`;
  }

  return null;
}

/**
 * True once `item` has sat due (past `scheduledAt`) for more than
 * `maxAgeHours` and is STILL unposted. Added 2026-08-11 after
 * 2026-08-09-august-augustine-ig.json sat silently re-skipped every 30 min
 * for 2 days with the guard window never advancing (nothing else pushed it
 * out) — a deadlock with no natural exit. This is the deterministic backstop:
 * regardless of WHY an item never posted (guard skip, deploy-lag skip,
 * repeated failure), once it's this overdue the poster stops retrying
 * quietly and moves it to social/failed/ instead, so it surfaces in a state
 * PR rather than rotting in the queue forever.
 */
export function isStaleDue(item, now, maxAgeHours = 48) {
  const scheduled = new Date(item.scheduledAt).getTime();
  return now.getTime() - scheduled >= maxAgeHours * 60 * 60 * 1000;
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
