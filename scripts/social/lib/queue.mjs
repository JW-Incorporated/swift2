// Pure selection logic for the social poster — kept separate from the
// network/filesystem code in post-queue.mjs so it's unit-testable. Note
// post-queue.mjs's own main() runs unconditionally on import (no `if
// (require.main)`-style guard), so ANY logic worth a unit test has to live
// here, not there — that's true for everything in this file including the
// functions below added in the 2026-08-11 Codex review round on PR #1900
// (bodyHash/findPostedDuplicate/missingCredsFor/needsMediaPreflight/
// mediaUrlsFor/countPostedToday/recentInstagramPosts), even though they read
// like post-queue.mjs's own helpers.

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/** The live site origin queued media paths are resolved against — the
 * single export both post-queue.mjs (publishing) and approval-prompt.mjs
 * (the Discord brief, RULINGS-SOCIAL A3) must use, so the two can never
 * drift onto different hosts. Deliberately the `www.` host, not the bare
 * apex: `longlivets.com` 308-redirects to `www.longlivets.com`, and while
 * fetchers generally follow redirects, Discord's embed fetcher is not
 * guaranteed to, so the brief and the poster both skip the redirect hop
 * entirely rather than rely on it. */
export const MEDIA_BASE_URL = 'https://www.longlivets.com';

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
 *
 * PAIR-AWARE selection (2026-09-10, kanban t_bac31b1a-followup — codex
 * review round 4): the per-platform daily budget is independent per
 * platform, so a naive earliest-due-first selection can pick campaign A's
 * `x` item (because it's the earliest due `x`) and campaign B's `instagram`
 * item (earliest due `instagram`) in the SAME run, leaving A's Instagram
 * sibling and B's X sibling both unpicked — the exact single-platform
 * publication checkSimultaneousPair's "schedule within 5 minutes" promise
 * exists to prevent, just moved from drafting time to selection time. Fixed
 * with two passes:
 *   1. COMPLETE PAIRS FIRST: find every `campaign` whose both `x` AND
 *      `instagram` siblings are due, in ascending order of the EARLIER
 *      sibling's `scheduledAt`. A pair is selected together — both siblings
 *      or neither — and only when each platform still has daily budget for
 *      it (so a pair never partially claims a budget slot and then stalls).
 *   2. REMAINING BUDGET, SOLO ITEMS: everything left (items with no
 *      `campaign`, or whose sibling isn't due yet) fills any still-open
 *      per-platform daily slots in the original earliest-due-first order —
 *      unchanged from before this fix.
 * A pair consumes exactly one slot of EACH platform's daily budget, same as
 * two independent solo items would — this does not raise
 * MAX_POSTS_PER_PLATFORM_PER_DAY, it only avoids splitting a pair across
 * two different campaigns' items competing for the same per-platform slot.
 */
export function selectDuePosts(items, now, postedToday, maxPerRun = MAX_POSTS_PER_RUN) {
  const remaining = new Map(postedToday);
  const due = items.filter((item) => isDue(item, now)).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const selected = [];
  const takenIndices = new Set();

  const hasBudget = (platform) => (remaining.get(platform) ?? 0) < MAX_POSTS_PER_PLATFORM_PER_DAY;
  const claim = (platform) => remaining.set(platform, (remaining.get(platform) ?? 0) + 1);

  // Pass 1: complete campaign pairs, earliest-sibling-first.
  const byCampaign = new Map();
  due.forEach((item, index) => {
    const campaign = typeof item.campaign === 'string' ? item.campaign.trim() : '';
    if (!campaign) return;
    if (!byCampaign.has(campaign)) byCampaign.set(campaign, []);
    byCampaign.get(campaign).push({ item, index });
  });
  const pairCandidates = [];
  for (const entries of byCampaign.values()) {
    const platforms = new Set(entries.map((e) => e.item.platform));
    if (platforms.size < 2) continue; // not a due pair — leave both for pass 2
    const earliest = Math.min(...entries.map((e) => new Date(e.item.scheduledAt).getTime()));
    pairCandidates.push({ entries, earliest });
  }
  pairCandidates.sort((a, b) => a.earliest - b.earliest);
  for (const { entries } of pairCandidates) {
    if (selected.length >= maxPerRun) break;
    // Take one representative entry per platform (the earliest-due one, in
    // case of a stale duplicate scheduling) so a pair never selects more
    // than one item per platform.
    const byPlatform = new Map();
    for (const e of entries) {
      const existing = byPlatform.get(e.item.platform);
      if (!existing || new Date(e.item.scheduledAt) < new Date(existing.item.scheduledAt)) byPlatform.set(e.item.platform, e);
    }
    const reps = [...byPlatform.values()];
    if (reps.length < 2) continue;
    if (!reps.every((e) => hasBudget(e.item.platform))) continue; // one side's platform is already at its daily cap — skip the pair, not a partial pick
    for (const e of reps) {
      selected.push(e.item);
      takenIndices.add(e.index);
      claim(e.item.platform);
    }
  }

  // Pass 2: fill any remaining budget/run slots with solo items, unchanged
  // earliest-due-first behavior — EXCEPT a campaign item whose sibling is
  // still QUEUED (anywhere in `items`, not just `due`) never ships solo
  // through this pass (codex review round 2, kanban t_bac31b1a-followup):
  // pass 1 already ships every campaign whose pair is genuinely complete
  // and affordable; if pass 1 skipped it (sibling not due yet, or one
  // platform's daily budget already spent), this pass must defer the whole
  // pair rather than let the one available sibling through alone. A
  // campaign item with NO queued sibling at all (the sibling already
  // posted in an earlier run; this is a retry of the remaining half) is
  // correctly still solo-eligible — checking the full `items` list, not
  // `due`, is what tells the two cases apart.
  const queuedPlatformsByCampaign = new Map();
  for (const item of items) {
    const campaign = typeof item.campaign === 'string' ? item.campaign.trim() : '';
    if (!campaign) continue;
    if (!queuedPlatformsByCampaign.has(campaign)) queuedPlatformsByCampaign.set(campaign, new Set());
    queuedPlatformsByCampaign.get(campaign).add(item.platform);
  }
  due.forEach((item, index) => {
    if (selected.length >= maxPerRun) return;
    if (takenIndices.has(index)) return;
    if (!hasBudget(item.platform)) return;
    const campaign = typeof item.campaign === 'string' ? item.campaign.trim() : '';
    if (campaign && (queuedPlatformsByCampaign.get(campaign)?.size ?? 0) >= 2) return;
    selected.push(item);
    claim(item.platform);
  });

  // Restore overall earliest-due-first ORDER in the returned list (pass 1
  // can otherwise put a later-scheduled pair ahead of an earlier solo item)
  // — callers (post-queue.mjs) process `due` in the order this returns.
  return selected.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
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

/**
 * The stamped-draft counterpart to isStaleDue above. A founder's own ✅
 * (RULINGS-SOCIAL-2.md B1) is the moment a human actually acted on the
 * item — measuring staleness from `scheduledAt`/queue time instead would
 * retire a freshly-approved-but-not-yet-posted item on the same 48h clock
 * as one nobody has ever looked at, which conflates "no human has acted"
 * with "a human acted and it still didn't ship." Callers must only pass an
 * item whose `approvalStatus(...).ok` is already true — post-queue.mjs's
 * due-item loop guarantees this (an unapproved item never reaches
 * selectDuePosts, so it never reaches this function either; it stays on
 * isStaleDue/`scheduledAt` above) — `item.approval.at` is trusted as-is
 * here, no re-verification.
 */
export function isStaleApproved(item, now, maxAgeHours = 48) {
  const approvedAt = new Date(item.approval?.at).getTime();
  return now.getTime() - approvedAt >= maxAgeHours * 60 * 60 * 1000;
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
export function summarizeQueueStatus(items, now = new Date(), { approvers } = {}) {
  const scheduled = items.filter((item) => new Date(item.scheduledAt).getTime() > now.getTime()).length;
  const awaitingApproval = Array.isArray(approvers) ? items.filter((item) => !approvalStatus(item, { approvers }).ok).length : 0;
  return { total: items.length, scheduled, due: items.length - scheduled, awaitingApproval };
}

/**
 * The exact content-bound payload an `approval.contentHash` covers
 * (docs/social/RULINGS-SOCIAL.md A2) — every field the AUDIENCE sees or that changes
 * WHEN a post ships. Deliberately excludes `why`, `attempts`, `lastError`,
 * `lastAttemptAt`, `mediaCredit`/`mediaSource`/`photoId` (bound separately,
 * byte-for-byte, by validatePhotoInventoryBinding) and `approval` itself —
 * a state PR's `attempts+1` bookkeeping, or an unrelated ledger field, must
 * never silently void a founder's stamp. Key order is fixed so the hash is
 * stable across callers; JSON.stringify on a plain object with these exact
 * keys, in this exact order, already preserves insertion order per the
 * spec, so no extra sorting is needed as long as every caller builds the
 * object the same way — which is exactly why this is one shared function
 * and not duplicated at each call site.
 */
export function contentHashPayload(item) {
  return {
    platform: item?.platform,
    body: item?.body,
    media: item?.media ?? [],
    altText: item?.altText ?? [],
    scheduledAt: item?.scheduledAt,
    campaign: item?.campaign ?? null,
  };
}

/** `sha256:<hex>` of `contentHashPayload(item)` — see that function's
 * docstring for exactly what is (and isn't) covered. */
export function contentHash(item) {
  const json = JSON.stringify(contentHashPayload(item));
  return `sha256:${createHash('sha256').update(json, 'utf8').digest('hex')}`;
}

/**
 * The exact byte string an approval's `sig` is computed over (B1). Fixed
 * field order and `|` delimiters — changing this invalidates every
 * previously-issued signature, so it is one named function, never inlined.
 */
export function approvalSigPayload(a) {
  return `${a.v}|${a.by}|${a.at}|${a.pr}|${a.contentHash}`;
}

/** `hmac-sha256:<hex>` of `approvalSigPayload(a)` under `key`. Only two
 * on-`main` workflows ever hold `key` — `social-approval-poll.yml` (via
 * `stampFiles`, which calls this) and `social-poster.yml`'s post step
 * (which only ever verifies, never signs). */
export function signApproval(a, key) {
  return 'hmac-sha256:' + createHmac('sha256', key).update(approvalSigPayload(a), 'utf8').digest('hex');
}

/**
 * Constant-time verification of `a.sig` against `key`. Returns false on any
 * shape error (missing prefix, non-hex, wrong length) rather than throwing
 * — a hand-written `approval` object must be inert here, never crash the
 * poster into an unhandled exception.
 */
export function verifyApprovalSig(a, key) {
  if (typeof a?.sig !== 'string' || !a.sig.startsWith('hmac-sha256:')) return false;
  const given = a.sig.slice('hmac-sha256:'.length);
  let givenBuf, expectedBuf;
  try {
    const expected = createHmac('sha256', key).update(approvalSigPayload(a), 'utf8').digest('hex');
    givenBuf = Buffer.from(given, 'hex');
    expectedBuf = Buffer.from(expected, 'hex');
  } catch {
    return false;
  }
  if (givenBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(givenBuf, expectedBuf);
}

/**
 * The B1 gate: is `item.approval` a valid, content-bound, SIGNED stamp
 * traceable to the owner's own Discord ✅ (schema v2, superseding A2's
 * merge-keyed v1 — docs/social/RULINGS-SOCIAL-2.md B1)? Returns `{ ok: true }` or
 * `{ ok: false, reason }`, checked in this fixed order so the first true
 * reason is always what's reported: absent → malformed → not-a-discord-
 * identity → not-in-approvers → content-hash mismatch → bad signature.
 *
 * A v1 (unsigned) stamp is malformed under v2 — nothing from before
 * 2026-09-11 grandfathers; there is no code path that inspects a draft's
 * age or schema version to exempt it.
 *
 * `key` is read via `hasOwnProperty`, not destructuring, so "the caller
 * didn't pass `key` at all" (CI's validate-queue, the schema validator —
 * neither ever holds SOCIAL_APPROVAL_KEY, by design; they get shape+id+hash
 * checking only) is distinguishable from "the caller passed `key: ''`"
 * (post-queue.mjs when the env var is genuinely unset — that DOES trigger
 * the signature-unverifiable refusal, loud, never a silent pass). Only
 * post-queue.mjs's own call is the real security boundary; every other
 * caller's `ok` only ever meant "shape/identity/hash line up," not
 * "safe to post." Never throws; never mutates `item`.
 */
export function approvalStatus(item, options = {}) {
  const { approvers } = options;
  const hasKey = Object.prototype.hasOwnProperty.call(options, 'key');
  const key = options.key;
  const approval = item?.approval;
  if (approval === undefined || approval === null) {
    return {
      ok: false,
      reason:
        'no approval on file — never reviewed by a founder (or reviewed before the 2026-09-11 approval schema; re-open a PR for it)',
    };
  }
  const shapeOk =
    typeof approval === 'object' &&
    !Array.isArray(approval) &&
    approval.v === 2 &&
    typeof approval.by === 'string' &&
    approval.by.trim() !== '' &&
    typeof approval.at === 'string' &&
    Number.isInteger(approval.pr) &&
    typeof approval.message === 'string' &&
    typeof approval.contentHash === 'string' &&
    approval.contentHash.startsWith('sha256:') &&
    typeof approval.sig === 'string' &&
    approval.sig.startsWith('hmac-sha256:');
  if (!shapeOk) {
    return { ok: false, reason: 'malformed approval record' };
  }
  if (!/^discord:\d{17,20}$/.test(approval.by)) {
    return {
      ok: false,
      reason: `approved by "${approval.by}", which is not a discord: identity — GitHub logins can never approve`,
    };
  }
  if (!Array.isArray(approvers) || !approvers.includes(approval.by)) {
    return { ok: false, reason: `approved by "${approval.by}", who is not in SOCIAL_APPROVERS` };
  }
  if (approval.contentHash !== contentHash(item)) {
    return {
      ok: false,
      reason: 'edited after approval — body/media/altText/scheduledAt/campaign no longer match what was approved',
    };
  }
  if (hasKey) {
    if (!key) {
      return { ok: false, reason: 'approval signature cannot be verified — SOCIAL_APPROVAL_KEY is not configured' };
    }
    if (!verifyApprovalSig(approval, key)) {
      return { ok: false, reason: 'approval signature invalid — this record was not written by the approval workflow' };
    }
  }
  return { ok: true };
}
