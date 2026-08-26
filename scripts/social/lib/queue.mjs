// Pure selection logic for the social poster — kept separate from the
// network/filesystem code in post-queue.mjs so it's unit-testable. Note
// post-queue.mjs's own main() runs unconditionally on import (no `if
// (require.main)`-style guard), so ANY logic worth a unit test has to live
// here, not there — that's true for everything in this file including the
// functions below added in the 2026-08-11 Codex review round on PR #1900
// (bodyHash/findPostedDuplicate/missingCredsFor/needsMediaPreflight/
// mediaUrlsFor/countPostedToday/recentInstagramPosts), even though they read
// like post-queue.mjs's own helpers.

import { createHash } from 'node:crypto';

/** Hard per-run and per-platform-per-day backstops (charter rail 3: caps are
 * code, never trust-based). Overridable only by editing this file — a PR,
 * same as any other rail change. */
/**
 * 5 -> 1 on 2026-08-26 (Joey: "the intended cadence is roughly once a day;
 * recently 4 posts went out at once"). On 2026-08-26T09:41Z four
 * appearance-discovery X drafts — all with a `scheduledAt` within 3.6
 * seconds of each other, all already ~11h overdue by the time their PR
 * merged — became due simultaneously and this cap let all four publish
 * inside the SAME run, 1.2 seconds apart on the live timeline. Nothing else
 * in this pipeline paces posting: `scheduledAt` is the only spacing signal,
 * and it stops meaning anything the moment a batch of items lands overdue.
 *
 * A cap of 1 makes the 30-minute run interval itself the floor on spacing,
 * so a backlog drains at one post per half hour instead of as a burst — the
 * pipeline never publishes two things at the same instant again regardless
 * of how items got scheduled. It is a pacing floor, NOT the daily volume
 * policy: MAX_POSTS_PER_PLATFORM_PER_DAY below is still what bounds
 * how much ships in a day.
 *
 * 10 -> 1 on 2026-08-26 (Joey, issue #3373: "roughly once a day" is the
 * real target, and 10/platform/day left the daily volume essentially
 * uncapped — nothing before this stopped a drained backlog from posting up
 * to 10 X items and 10 Instagram items in one calendar day). Combined with
 * mandatory X+Instagram pairing (checkCampaignPair, no exceptions as of
 * 2026-08-26) and MAX_POSTS_PER_RUN=1 above, the real ceiling is now one
 * campaign — one X post plus its mandatory Instagram sibling — per platform
 * per calendar day.
 *
 * "Day" here is a **UTC calendar day** (`utcDateOnly`, `YYYY-MM-DD` in UTC),
 * NOT a rolling 24h window — see `countPostedToday` below, which buckets
 * `social/posted/*.json` records by the UTC date of their `postedAt`. The
 * budget therefore resets at 00:00 UTC regardless of when the day's post(s)
 * actually went out, so two posts on the same platform can legally land as
 * close together as a few minutes (one at 23:58 UTC, the next at 00:02 UTC)
 * without violating the cap — this is a per-UTC-day ceiling, not a spacing
 * guarantee (that's MAX_POSTS_PER_RUN's job).
 */
export const MAX_POSTS_PER_RUN = 1;
export const MAX_POSTS_PER_PLATFORM_PER_DAY = 1;

/**
 * True if `item.scheduledAt` parses to an actual point in time. Added
 * 2026-08-11 (Codex review round 1 on PR #1900): `isDue`/`isStaleDue` both
 * feed `scheduledAt` straight into `new Date(...).getTime()`, which is `NaN`
 * for a missing/malformed value — every comparison against `NaN` is `false`,
 * so `isDue` never says yes AND `isStaleDue` never says yes either. That
 * combination makes a bad-timestamp item invisible to `selectDuePosts`
 * (never selected as due) and therefore never even reaches the loop where
 * the 48h rule would otherwise catch it — it just sits in social/queue/
 * forever, completely unprocessed, with no error and nothing to notice.
 * Callers (post-queue.mjs's selection step, check-drafts.mjs's schema rule)
 * must check this BEFORE relying on isDue/isStaleDue at all.
 */
export function isValidScheduledAt(item) {
  return Number.isFinite(new Date(item?.scheduledAt).getTime());
}

/** True if the queue item is due to post.
 *
 * Per-item founder approval was REMOVED 2026-07-25 (Wyatt, CTO) — see
 * docs/decisions.md. The desk now queues and the poster ships on schedule.
 * `approvedBy`/`approvedAt` remain optional provenance fields (who/when, when
 * a human did weigh in) but are no longer a gate. What still constrains
 * posting: the SOCIAL_FREEZE crisis stop, and the caps above.
 *
 * Assumes a valid `scheduledAt` — callers should route an item that fails
 * isValidScheduledAt() to social/failed/ before ever asking isDue() about
 * it (see isValidScheduledAt's docstring for why). */
export function isDue(item, now) {
  return new Date(item.scheduledAt).getTime() <= now.getTime();
}

/**
 * Selects which due queue items to post this run, respecting each
 * platform's remaining daily budget. `postedToday` is a Map<platform,
 * count> of items already posted today (from social/posted/).
 *
 * `maxPerRun` no longer defaults to a hard truncation applied blind to
 * whether a selected item is actually postable (Codex review round 1 on PR
 * #1900): the old default silently let guard-blocked/preflight-blocked/
 * stale items consume slots out of MAX_POSTS_PER_RUN, so a run could select
 * 5 due items, skip all 5 without posting any of them, and never even look
 * at a 6th item that WAS immediately postable. post-queue.mjs now calls this
 * with `maxPerRun: Infinity` to get every due-and-within-daily-budget
 * candidate, then enforces MAX_POSTS_PER_RUN itself in the loop, counted
 * only against items it actually attempts to post — not ones it skips.
 */
export function selectDuePosts(items, now, postedToday, maxPerRun = MAX_POSTS_PER_RUN) {
  const remaining = new Map(postedToday);
  const due = items.filter((item) => isDue(item, now)).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const selected = [];
  for (const item of due) {
    if (selected.length >= maxPerRun) break;
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
 * The post-time era-art backstop. History: replaced repeatsRecentEraArt()
 * on 2026-08-11 (undeclared-vs-repeat semantics), then simplified on
 * 2026-08-12 to an UNCONDITIONAL ban — see the inline note below and
 * social/README.md's `mediaKind` section. Returns a human-readable block
 * reason, or null when no media path is a generic era tile. Platform-
 * agnostic: the generic-art-grid problem applies to any platform that posts
 * the image.
 */
export function eraArtGuardReason(item, recentIgPosted, lookback = 10) {
  // 2026-08-12 (the Taylor-photo standard, PR #2043): era art is banned
  // OUTRIGHT, declared or not. The old declared-fallback path ("mediaKind:
  // era-art plus a justification") is how the account shipped 17/17 era-tile
  // IG posts — the drafter kept taking the documented last resort. The draft
  // gate (check-drafts.mjs) already hard-fails these; this post-time guard is
  // the backstop for items that reach the queue via a path the draft gate
  // never saw (a revert, a conflict resolution, a manual push). A blocked
  // item never becomes postable by waiting, so the 48h staleness rule retires
  // it to social/failed/ where a human sees it.
  //
  // `recentIgPosted`/`lookback` are kept in the signature for call-site
  // stability; era art no longer needs a repeat window to be blocked.
  void recentIgPosted;
  void lookback;
  const media = (item.media ?? []).find((m) => isGenericEraArt(m));
  if (!media) return null;
  return `era art: media "${media}" is a generic era-cover tile — banned outright since 2026-08-12 (issue #2031 / PR #2043), declared or not. Replace it with a real credited photograph of Taylor (mediaKind "photo") or a product screenshot (mediaKind "site-screen"); this item will never post as-is.`;
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
 *
 * Also assumes a valid `scheduledAt` (see isValidScheduledAt) — an invalid
 * one makes the subtraction NaN, which is neither >= nor < anything, so this
 * would silently return false forever. That's exactly the failure mode
 * isValidScheduledAt exists to catch upstream, before this function is ever
 * asked about the item.
 */
export function isStaleDue(item, now, maxAgeHours = 48) {
  const scheduled = new Date(item.scheduledAt).getTime();
  return now.getTime() - scheduled >= maxAgeHours * 60 * 60 * 1000;
}

/** Hours since `scheduledAt` passed (0 for a not-yet-due item). The number a
 * waiting/skipped item carries into the run report so "waiting" and "stuck"
 * are distinguishable without reading two days of Action logs — see
 * lib/run-report.mjs's isStuck, which reddens a no-attempt block past
 * STUCK_AFTER_HOURS (24h), a full day before isStaleDue (48h) retires it to
 * social/failed/. Escalation ladder, not two competing thresholds: 24h makes
 * it loud while it is still recoverable, 48h moves it. Assumes a valid
 * `scheduledAt` (see isValidScheduledAt). */
export function hoursOverdue(item, now) {
  const ms = now.getTime() - new Date(item.scheduledAt).getTime();
  return ms <= 0 ? 0 : ms / (60 * 60 * 1000);
}

/** Last `n` Instagram items from `allPostedData` (the parsed contents of
 * every social/posted/*.json file), oldest-to-newest by `postedAt`, for the
 * era-art guard. Takes already-loaded data rather than reading the
 * directory itself, so post-queue.mjs's single read of social/posted/ can
 * feed both this and countPostedToday/findPostedDuplicate below. */
export function recentInstagramPosts(allPostedData, n = 10) {
  return allPostedData
    .filter((d) => d.platform === 'instagram')
    .sort((a, b) => new Date(a.postedAt) - new Date(b.postedAt))
    .slice(-n);
}

/** Map<platform, count> of items posted on `now`'s UTC calendar day, from
 * `allPostedData` — feeds selectDuePosts's per-platform daily budget. */
export function countPostedToday(allPostedData, now) {
  const today = utcDateOnly(now);
  const counts = new Map();
  for (const data of allPostedData) {
    if (utcDateOnly(data.postedAt) !== today) continue;
    counts.set(data.platform, (counts.get(data.platform) ?? 0) + 1);
  }
  return counts;
}

/** SHA1 of a post body, for findPostedDuplicate below — cheap, not a
 * security boundary, just "is this the same text." */
export function bodyHash(body) {
  return createHash('sha1').update(String(body ?? '')).digest('hex');
}

/**
 * Finds a social/posted/ record that makes `item` look like a repost: same
 * platform AND (same `campaign`, when both have one, OR an identical body).
 *
 * Added 2026-08-11 (Codex review round 1 on PR #1900) as a pragmatic
 * idempotency guard — not a full outbox pattern, but enough to catch the
 * dominant real case: a post that genuinely succeeded, but whose queue ->
 * posted state transition never landed on main (the state-commit PR that
 * social-poster.yml opens after posting can itself fail to merge), so a
 * LATER run still finds the item sitting in social/queue/ and, without
 * this check, would try posting it again.
 */
export function findPostedDuplicate(item, allPostedData) {
  const itemHash = bodyHash(item.body);
  return allPostedData.find((p) => {
    if (p.platform !== item.platform) return false;
    if (item.campaign && p.campaign && p.campaign === item.campaign) return true;
    return bodyHash(p.body) === itemHash;
  });
}

/** Required env vars per platform — missing any of these for a platform
 * with due work means the whole run should abort before touching any item
 * (see post-queue.mjs's main()), rather than burning 3 attempts per item on
 * a problem no retry can fix. Returns the list of missing var names (empty
 * = nothing missing); unknown platforms return []. */
export function missingCredsFor(platform, env = process.env) {
  if (platform === 'x') {
    return ['X_API_KEY', 'X_API_KEY_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_TOKEN_SECRET'].filter((k) => !env[k]);
  }
  if (platform === 'instagram') {
    return ['IG_ACCESS_TOKEN', 'IG_BUSINESS_ACCOUNT_ID'].filter((k) => !env[k]);
  }
  return [];
}

/**
 * True when `item` needs the deploy-lag preflight before posting: any item
 * carrying media, on either platform that can actually publish it (IG always
 * requires media; X can carry it now too since the upload support this
 * change added).
 */
export function needsMediaPreflight(item) {
  return Boolean(item.media?.length) && (item.platform === 'instagram' || item.platform === 'x');
}

/** Full media URLs for `item`, for the deploy-lag preflight to HEAD-check. */
export function mediaUrlsFor(item, mediaBaseUrl) {
  return (item.media ?? []).map((p) => `${mediaBaseUrl}${p}`);
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
