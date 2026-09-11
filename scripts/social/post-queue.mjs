#!/usr/bin/env node
// Posts due items from social/queue/**.json to their platform, moving each
// to social/posted/ (success) or social/failed/ (after 3 failed attempts,
// after sitting due >48h for any reason, or after an ambiguous transport
// failure — see isStaleDue/failureReason notes below). Run as a scheduled
// GitHub Action (.github/workflows/social-poster.yml) — see
// docs/agents/growth.md for the approval flow this sits downstream of.
//
// Per-item processing order (Codex review round 1 on PR #1900 fixed the
// original order, which let a stale item post once "unblocked" and let
// blocked items eat into the per-run cap):
//   1. Stale check FIRST, before anything else — any due item sitting
//      unposted >48h moves straight to social/failed/, whether or not it
//      would otherwise be postable right now. Never touches the per-run cap.
//   2. Idempotency check — is there already a social/posted/ record with
//      the same campaign+platform or the same body? Skip loudly, don't
//      repost (see the 2026-07-17 triple-post note below).
//   3. Era-art guard + same-run media dedupe (no network).
//   4. Deploy-lag preflight (network, so checked after the free checks) —
//      an item whose media isn't live yet WAITS: no publish, no attempt
//      spent, ships itself on the first run after the deploy lands.
//   5. ONLY items that pass 2-4 consume one of the MAX_POSTS_PER_RUN slots
//      and actually get posted — a run that selects 5 due items but 3 are
//      blocked no longer wastes its whole cap on items that never post.
//
// The 2026-07-17 triple-post incident: the state-commit step (queue/posted/
// failed changes -> a throwaway branch -> auto-merging PR, see
// social-poster.yml's header) can itself fail to land even after a real
// post genuinely succeeded, so a later run can see the item still sitting
// in social/queue/ and try again. Two mitigations here: the idempotency
// check above catches the common case (the state commit failed AFTER a
// clean success), and ambiguous transport failures (request sent, response
// never received — see lib/platforms.mjs's publishFetch) are never
// auto-retried at all, since retrying one is indistinguishable from
// manufacturing a duplicate.
//
// Crisis stop: if the repo variable SOCIAL_FREEZE is set to anything
// truthy, this exits immediately without posting or touching the queue —
// per the Growth desk charter's hard rail. Any founder can set it.
//
// Failures are LOUD (2026-08-11). Any item that leaves the schedule without
// reaching a timeline — attempts exhausted, stale >48h, invalid scheduledAt,
// or an ambiguous transport failure, i.e. every path into social/failed/ —
// makes this process exit non-zero, emits a `::error::` Action annotation,
// and writes a markdown report that the workflow puts in the queue-state
// PR's title and body. A run that has due work but must abort (missing
// credentials) is loud the same way. Before this, twelve posts died into
// social/failed/ across 2026-07-21..08-04 — eleven X (403 every time) and
// one Instagram (#1897) — and every one of those runs finished GREEN. See
// scripts/social/lib/run-report.mjs's header for the receipts. The workflow's
// state-commit step runs with `if: always()`, so a red run still records what
// happened; without that the failed/ move would never land and the item would
// retry against the same wall forever.
//
// Two states deliberately spend NO attempt, so an item in either can never
// reach social/failed/ through the attempts counter:
//   - skipped  — idempotency/era-art/same-run-dedupe blocks (authoring or
//                state problems, not transient failures).
//   - waiting  — media not yet live on the site (lib/preflight.mjs); the
//                item is fine, its image PR just hasn't merged/deployed.
// Both are right, and both were invisible until 2026-08-11:
// social/queue/2026-08-09-august-augustine-ig.json was skipped every 30
// minutes for two days inside runs that exited 0. The escalation ladder now:
// run-report.mjs reddens either state past STUCK_AFTER_HOURS (24h — loud
// while the item is still recoverable), and isStaleDue (48h, step 1 above)
// retires it to social/failed/ a day later if nothing changed.
//
// Environment overrides (all for tests only, never set in the workflow):
//   SOCIAL_ROOT             — repo root to read social/** from.
//   SOCIAL_POSTER_REPORT    — file to write the markdown report to.
//   SOCIAL_IG_POLL_TIMEOUT_MS / SOCIAL_IG_POLL_INTERVAL_MS
//                           — bounds for the Instagram container-readiness
//                             poll (lib/ig-container.mjs), so a test can
//                             exercise the timeout path in milliseconds
//                             instead of the real 90 seconds.

import { readdir, readFile, writeFile, appendFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  selectDuePosts,
  eraArtGuardReason,
  isStaleDue,
  isStaleApproved,
  isValidScheduledAt,
  hoursOverdue,
  MAX_POSTS_PER_RUN,
  recentInstagramPosts,
  countPostedToday,
  findPostedDuplicate,
  missingCredsFor,
  needsMediaPreflight,
  mediaUrlsFor,
  approvalStatus,
  MEDIA_BASE_URL,
} from './lib/queue.mjs';
import { SOCIAL_APPROVERS } from './lib/approvers.mjs';
import { postToX, postToInstagram, postToFacebookPage } from './lib/platforms.mjs';
import { mediaUrlsReachable } from './lib/preflight.mjs';
import {
  OUTCOME,
  hasBlockingFailure,
  summarizeRun,
  formatReportMarkdown,
  formatAnnotations,
  formatPostedNotification,
} from './lib/run-report.mjs';
import { runMain } from '../lib/cli.mjs';

const MAX_ATTEMPTS = 3;

function resolveRoot() {
  return process.env.SOCIAL_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
}

/**
 * Reads every *.json in `dir`.
 *
 * `required` (2026-08-12, issue #2031) is the fail-closed switch for the
 * posted ledger. This helper used to swallow EVERY readdir error and return
 * `[]` — for social/queue/ that is harmless (nothing to post), but for
 * social/posted/ it is the same class of bug as the strand that caused the
 * Instagram triple-post: an unreadable ledger became "nothing was ever
 * posted", the idempotency check found no duplicate, and the item shipped
 * AGAIN. A ledger we cannot read is not an empty ledger. With `required`,
 * an unreadable/absent directory throws, which (main() is invoked bare, so
 * the rejection is unhandled) exits the run non-zero and RED — the loud
 * failure #1888 asks for, and nothing posts.
 *
 * Note what is deliberately NOT an error: a directory that exists and holds
 * zero records. That is a legitimate cold-start state (and every unit test's
 * fixture root). The staleness case it cannot see — records that exist only
 * on an unmerged state PR — is covered upstream by social-poster.yml's
 * "refuse while a queue-state PR is open" step, not here.
 */
async function readJsonDir(dir, { required = false } = {}) {
  let files;
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  } catch (err) {
    if (required) {
      throw new Error(
        `social-poster: REFUSING TO POST — the posted ledger at ${dir} could not be read (${err.code ?? err.message}). ` +
          'Every idempotency/dedupe check reads that directory, so an unreadable ledger would look identical to "nothing has ever been posted" and this run would repost live items (issue #2031). ' +
          'Failing closed instead. Fix the checkout/permissions and re-run.',
        { cause: err },
      );
    }
    return [];
  }
  const out = [];
  for (const file of files) {
    const full = path.join(dir, file);
    out.push({ file, full, data: JSON.parse(await readFile(full, 'utf-8')) });
  }
  return out;
}

async function moveToFailed(failedDir, entry, failed) {
  await writeFile(path.join(failedDir, entry.file), JSON.stringify(failed, null, 2) + '\n');
  await rm(entry.full);
}

/** Container-poll bounds, defaulted in lib/ig-container.mjs and overridable
 * only so tests don't have to burn the real 90-second ceiling. */
function igPollOptions() {
  const options = {};
  const timeoutMs = Number(process.env.SOCIAL_IG_POLL_TIMEOUT_MS);
  const intervalMs = Number(process.env.SOCIAL_IG_POLL_INTERVAL_MS);
  if (Number.isFinite(timeoutMs) && timeoutMs > 0) options.timeoutMs = timeoutMs;
  if (Number.isFinite(intervalMs) && intervalMs >= 0) options.intervalMs = intervalMs;
  return options;
}

async function postOne(item) {
  const creds = {
    apiKey: process.env.X_API_KEY,
    apiKeySecret: process.env.X_API_KEY_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET,
    igUserId: process.env.IG_BUSINESS_ACCOUNT_ID,
  };
  const igAccessToken = process.env.IG_ACCESS_TOKEN;

  if (item.platform === 'x') return postToX(item, creds, MEDIA_BASE_URL);
  if (item.platform === 'instagram') {
    return postToInstagram(item, { ...creds, accessToken: igAccessToken }, MEDIA_BASE_URL, igPollOptions());
  }
  throw new Error(`Unknown platform "${item.platform}"`);
}

/**
 * Best-effort Facebook Page cross-post, run only after an Instagram post
 * already succeeded. Deliberately never affects the item's own success/
 * retry state — the Instagram post is the thing the founder approved and
 * it already landed; a Facebook failure is logged loudly but doesn't undo
 * that or trigger a retry of the whole item (which would re-post to
 * Instagram too). Only runs when FB_PAGE_ID is configured.
 *
 * It IS reported, though: the caller records a `facebookError` on the
 * outcome so a Page that silently stopped accepting posts (an expired token,
 * a dropped `pages_manage_posts` scope) shows up in the run report instead of
 * living only in a log line. It still doesn't redden the run.
 */
async function crosspostToFacebook(item) {
  const facebookPageId = process.env.FB_PAGE_ID;
  if (!facebookPageId || item.platform !== 'instagram') return { result: null, error: null };
  try {
    const result = await postToFacebookPage(item, { accessToken: process.env.IG_ACCESS_TOKEN, facebookPageId }, MEDIA_BASE_URL);
    console.log(`social-poster: cross-posted to Facebook Page -> ${result.url}`);
    return { result, error: null };
  } catch (err) {
    const error = String(err.message ?? err);
    console.error(`social-poster: Facebook Page cross-post failed (Instagram post itself still succeeded): ${error}`);
    return { result: null, error };
  }
}

/** Writes the run report everywhere a human might actually look at it. */
async function publishReport(outcomes, { abortReason } = {}) {
  const summary = abortReason ? `RUN ABORTED — ${abortReason}` : summarizeRun(outcomes);
  const runUrl =
    process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : undefined;
  const markdown = formatReportMarkdown(outcomes, { runUrl, abortReason });

  for (const annotation of formatAnnotations(outcomes, { abortReason })) console.log(annotation);
  console.log(`social-poster: run summary — ${summary}`);

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown + '\n').catch((err) =>
      console.error(`social-poster: could not write job summary: ${err.message ?? err}`),
    );
  }
  if (process.env.SOCIAL_POSTER_REPORT) {
    await writeFile(process.env.SOCIAL_POSTER_REPORT, markdown).catch((err) =>
      console.error(`social-poster: could not write report file: ${err.message ?? err}`),
    );
  }

  // Founder success-email payload (2026-08-25, docs/decisions.md same date):
  // an email on every post that actually went out, separate from the
  // failure-surfacing this file already does. Written only when the
  // workflow asks for it (SOCIAL_POSTER_NOTIFY set) and only when something
  // actually posted — formatPostedNotification returns null on a run with
  // zero posted items, and no file means the workflow step sends no mail.
  if (process.env.SOCIAL_POSTER_NOTIFY) {
    const notification = formatPostedNotification(outcomes, { runUrl });
    if (notification) {
      await writeFile(
        process.env.SOCIAL_POSTER_NOTIFY,
        JSON.stringify({ ...notification, url: runUrl ?? '' }, null, 2),
      ).catch((err) => console.error(`social-poster: could not write notify payload: ${err.message ?? err}`));
    }
  }
  return { summary, markdown };
}

/**
 * The whole point (2026-08-11): a post that never made it to the timeline
 * must not leave a green check behind. Every return path of main() funnels
 * through here so no early exit can skip the report or the exit code.
 * `if: always()` on the workflow's state-commit step means the failed/ move
 * is still recorded despite the non-zero exit.
 */
async function finish(outcomes, { abortReason } = {}) {
  await publishReport(outcomes, { abortReason });
  if (abortReason || hasBlockingFailure(outcomes)) {
    process.exitCode = 1;
    console.error(
      abortReason
        ? 'social-poster: exiting non-zero — the run aborted with due work it could not attempt.'
        : 'social-poster: exiting non-zero — at least one post permanently failed and was NOT published, or has been stuck past schedule long enough that it will never post on its own.',
    );
  }
  return outcomes;
}

export async function main() {
  if (process.env.SOCIAL_FREEZE && process.env.SOCIAL_FREEZE !== 'false' && process.env.SOCIAL_FREEZE !== '0') {
    console.log(`social-poster: SOCIAL_FREEZE is set ("${process.env.SOCIAL_FREEZE}") — skipping this run entirely.`);
    return [];
  }

  const root = resolveRoot();
  const queueDir = path.join(root, 'social', 'queue');
  const postedDir = path.join(root, 'social', 'posted');
  const failedDir = path.join(root, 'social', 'failed');

  const now = new Date();
  const queued = await readJsonDir(queueDir);
  const outcomes = [];

  // Invalid/missing scheduledAt is quarantined immediately, before due-ness
  // is even asked about: isDue()/isStaleDue() both feed it into
  // `new Date(...).getTime()`, which is NaN for a bad value, and every
  // comparison against NaN is false — meaning such an item would otherwise
  // never be "due" AND never be "stale," making it permanently invisible to
  // everything below (see isValidScheduledAt's docstring in lib/queue.mjs).
  const validQueued = [];
  for (const entry of queued) {
    if (!isValidScheduledAt(entry.data)) {
      const failureReason = `Invalid or missing "scheduledAt" (${JSON.stringify(entry.data.scheduledAt)}) — this item could never become due or stale, so it would have sat unprocessed forever.`;
      await moveToFailed(failedDir, entry, {
        ...entry.data,
        failureReason,
        lastAttemptAt: now.toISOString(),
      });
      console.error(`social-poster: ${entry.file} has an invalid/missing scheduledAt — moved to social/failed/.`);
      outcomes.push({ kind: OUTCOME.FAILED, file: entry.file, platform: entry.data.platform ?? 'unknown', error: failureReason });
      continue;
    }

    // A2 (docs/social/RULINGS-SOCIAL.md): the poster is the SOLE enforcement point for
    // approval, reading only `approval` on the item itself — no GitHub API
    // call, no network dependence, fail-closed regardless of how a file
    // reached `main`. A pre-2026-09-11 draft has no `approval` key at all,
    // so grandfathering is impossible by construction: every item that
    // reaches this branch without a CURRENTLY-VALID stamp is unapproved,
    // full stop, whether it never had a key or its content changed since.
    const approval = approvalStatus(entry.data, { approvers: SOCIAL_APPROVERS, key: process.env.SOCIAL_APPROVAL_KEY ?? '' });
    if (!approval.ok) {
      if (isStaleDue(entry.data, now)) {
        const failureReason = `Unapproved for >48h past scheduledAt — ${approval.reason}`;
        await moveToFailed(failedDir, entry, {
          ...entry.data,
          failureReason,
          lastAttemptAt: now.toISOString(),
        });
        console.error(`social-poster: ${entry.file} moved to social/failed/ — unapproved and stale: ${approval.reason}`);
        outcomes.push({ kind: OUTCOME.FAILED, file: entry.file, platform: entry.data.platform ?? 'unknown', error: failureReason });
      } else {
        console.error(`social-poster: UNAPPROVED ${entry.file} — ${approval.reason}. Nothing posted; no attempt spent; it cannot claim a daily-budget slot.`);
        outcomes.push({
          kind: OUTCOME.UNAPPROVED,
          file: entry.file,
          platform: entry.data.platform ?? 'unknown',
          error: approval.reason,
          overdueHours: hoursOverdue(entry.data, now),
        });
      }
      // Deliberately NOT pushed to validQueued — selectDuePosts only ever
      // sees items this loop has already let through, so an unapproved
      // item can never be selected, never claim a per-platform daily
      // budget slot (MAX_POSTS_PER_PLATFORM_PER_DAY is claimed at
      // selection time, lib/queue.mjs's selectDuePosts), and never reach
      // postOne() — there is no path to publish from here.
      continue;
    }

    validQueued.push(entry);
  }

  // `required` — fail closed. See readJsonDir's docstring and issue #2031:
  // this read IS the dedupe source of truth, so it must never degrade to [].
  const allPosted = await readJsonDir(postedDir, { required: true });
  const allPostedData = allPosted.map((p) => p.data);
  const postedToday = countPostedToday(allPostedData, now);

  // maxPerRun: Infinity — get every due-and-within-daily-budget candidate,
  // not just the first MAX_POSTS_PER_RUN. The per-run cap is enforced below,
  // in the loop, counted only against items actually attempted — see the
  // header comment for why.
  const due = selectDuePosts(
    validQueued.map((q) => q.data),
    now,
    postedToday,
    Infinity,
  );

  if (due.length === 0) {
    console.log('social-poster: nothing due this run.');
    return finish(outcomes);
  }

  // Abort the WHOLE run, before touching any item, if a platform with due
  // work this run is missing required credentials — a per-item failure here
  // would just burn 3 attempts (1.5h) on every single due item for a
  // problem no retry can fix. Aborting is still LOUD (non-zero exit, an
  // ::error:: annotation, the report): nothing will ever post until a human
  // fixes the configuration, so a green "nothing happened" run would be the
  // exact silent-failure mode this file exists to prevent.
  const neededPlatforms = [...new Set(due.map((item) => item.platform))];
  const credIssues = neededPlatforms.flatMap((platform) => {
    const missing = missingCredsFor(platform);
    return missing.length ? [`${platform}: missing ${missing.join(', ')}`] : [];
  });
  if (credIssues.length) {
    const abortReason = `required credentials are missing for a platform with due items (${credIssues.join('; ')}). No items were touched; nothing was attempted or retried — and nothing will post until the credentials are fixed.`;
    console.error(
      `social-poster: ABORTING this run — required credentials are missing for a platform with due items:\n${credIssues.map((c) => `  - ${c}`).join('\n')}\nNo items were touched; nothing was attempted or retried.`,
    );
    return finish(outcomes, { abortReason });
  }

  const recentIg = recentInstagramPosts(allPostedData);
  const mediaUsedThisRun = new Set();
  // A campaign whose BOTH siblings are due together in THIS run is one
  // posting unit (2026-09-10, kanban t_bac31b1a — codex review round 1/2):
  // checkSimultaneousPair's "schedule both siblings within 5 minutes" is
  // meaningless if the poster still can't actually PUBLISH both within one
  // run. Computed UPFRONT from `due` (order-independent — the original
  // "exempt only after the first sibling has already posted" version broke
  // the moment two siblings interleaved with an item from a DIFFERENT
  // campaign between them, since `due` is a single list sorted by
  // scheduledAt, not grouped by campaign). Each sibling is exempt from the
  // per-run cap (a pair scheduled together must not have one half deferred
  // to the next run, 30 minutes later) and the same-run media-reuse guard
  // (intentionally shares the same credited photo — that's not a
  // duplicate-content problem, it's the whole point of pairing).
  //
  // This is safe from ever letting an unbounded number of pairs bypass the
  // pacing floor in one run: MAX_POSTS_PER_PLATFORM_PER_DAY is 1, so
  // `selectDuePosts` (called with maxPerRun: Infinity below but still
  // respecting the per-platform daily budget) can never return more than
  // one due `x` item and one due `instagram` item in the first place —
  // there is at most ONE pair-ready campaign per run under current caps.
  const duePlatformsByCampaign = new Map();
  for (const item of due) {
    const campaign = typeof item.campaign === 'string' ? item.campaign.trim() : '';
    if (!campaign) continue;
    if (!duePlatformsByCampaign.has(campaign)) duePlatformsByCampaign.set(campaign, new Set());
    duePlatformsByCampaign.get(campaign).add(item.platform);
  }
  // Campaigns whose FIRST sibling this run did not reach `posted` (codex
  // review round 2, kanban t_bac31b1a-followup): `isPairReady` alone is a
  // static, upfront flag — if the first sibling's actual publish attempt
  // fails, retries, gets skipped, or waits, the second sibling must NOT
  // still post alone through the pair exemption (that is exactly the
  // single-platform outcome this whole mechanism exists to prevent). Every
  // non-POSTED exit below for a pair sibling adds its campaign here BEFORE
  // moving on to the next item, so `isPairReady` sees the break immediately
  // — except a same-platform IDEMPOTENCY duplicate (`dup`, step 2 below):
  // that means the sibling is already live from a PRIOR run, so the
  // remaining sibling posting now is what COMPLETES the pair, not what
  // breaks it, and marking it broken would strand the remaining sibling
  // until the 48h stale rule kills it.
  const brokenPairs = new Set();
  const isPairReady = (campaign) => campaign !== '' && !brokenPairs.has(campaign) && (duePlatformsByCampaign.get(campaign)?.size ?? 0) >= 2;
  let attemptsThisRun = 0;

  for (const item of due) {
    const entry = validQueued.find((q) => q.data === item);
    const campaign = typeof item.campaign === 'string' ? item.campaign.trim() : '';
    const pairReady = isPairReady(campaign);

    // A sibling of an already-broken pair is deferred whole this run —
    // its partner already failed to post, so this half must not ship
    // alone. No attempt spent, no outcome recorded; it's still due and
    // will be reconsidered (as a fresh pair, if its sibling is retried
    // successfully) on the next run.
    if (campaign && brokenPairs.has(campaign)) {
      console.log(`social-poster: deferring ${entry.file} — its campaign "${campaign}" sibling did not post this run, so this half is held rather than shipping alone.`);
      continue;
    }

    // 1. Stale check FIRST — unconditional, regardless of what else is true
    // about this item. A 3-day-stale item must not quietly post just
    // because it happens to be unblocked on the run that finally checks it.
    // `due` only ever contains items that already passed the approval gate
    // above (validQueued), so every item reaching this point has a valid
    // stamp — staleness is measured from the founder's own approval
    // (`approval.at`), not `scheduledAt`/queue time (lib/queue.mjs's
    // isStaleApproved).
    if (isStaleApproved(item, now)) {
      const failureReason = 'Still unposted more than 48h after founder approval — moved to social/failed/ regardless of current guard/preflight state (see social/README.md\'s 48h rule).';
      await moveToFailed(failedDir, entry, {
        ...item,
        failureReason,
        lastAttemptAt: now.toISOString(),
      });
      console.error(`social-poster: ${entry.file} moved to social/failed/ — stuck >48h past founder approval.`);
      outcomes.push({ kind: OUTCOME.FAILED, file: entry.file, platform: item.platform, error: failureReason });
      if (pairReady) brokenPairs.add(campaign);
      continue;
    }

    // 2. Idempotency: does social/posted/ already have this exact post?
    const dup = findPostedDuplicate(item, allPostedData);
    let blockReason = dup
      ? `already posted: a social/posted/ record with the same platform and ${item.campaign && dup.campaign === item.campaign ? `campaign "${item.campaign}"` : 'an identical body'} already exists (${dup.url ?? 'no url recorded'}) — this looks like a duplicate, not a new post.`
      : null;

    // 3. Era-art guard (undeclared/repeated-vs-social/posted/) + same-run
    // media dedupe (repeated-vs-earlier-in-THIS-run — the era-art guard's
    // `recentIg` list only reflects social/posted/ as of the start of this
    // run, so without this a second IG item in the same run could reuse
    // media the FIRST item in this same run just posted). A campaign PAIR
    // sharing the same credited photo is deliberate (see
    // buildSocialDraftPair) — exempt only that specific case, not an
    // unrelated item that happens to reuse the same image.
    if (!blockReason) blockReason = eraArtGuardReason(item, recentIg);
    if (!blockReason && !pairReady) {
      const repeatedThisRun = item.media?.find((m) => mediaUsedThisRun.has(m));
      if (repeatedThisRun) blockReason = `media "${repeatedThisRun}" was already posted earlier in this same run — not reposting it again this run.`;
    }

    if (blockReason) {
      console.error(`social-poster: SKIPPING ${entry.file} — ${blockReason} Left in the queue, not counted as a failed attempt.`);
      outcomes.push({
        kind: OUTCOME.SKIPPED,
        file: entry.file,
        platform: item.platform,
        error: `${blockReason} Left in the queue, not counted as a failed attempt.`,
        overdueHours: hoursOverdue(item, now),
      });
      // Only a genuine block breaks the pair — a duplicate-idempotency skip
      // (dup !== null) means the sibling is ALREADY live from a prior run,
      // so it does not count as a failure here; every other block reason
      // (era-art, same-run media repeat) is a real reason this sibling
      // will not ship this run, and the partner must not ship alone.
      if (pairReady && !dup) brokenPairs.add(campaign);
      continue;
    }

    // 4. Deploy-lag preflight (network — checked last among the free/cheap
    // checks above, and only reached if none of them already blocked it).
    // A not-yet-deployed image is a WAITING outcome, not a skip: nothing is
    // wrong with the item, its image PR just hasn't merged/deployed, and it
    // ships itself on the first run after the deploy lands. No publish, no
    // Graph write, no attempt spent. See lib/preflight.mjs — and
    // lib/run-report.mjs's isStuck for the 24h bound that stops this state
    // from hiding forever.
    if (needsMediaPreflight(item)) {
      const preflight = await mediaUrlsReachable(mediaUrlsFor(item, MEDIA_BASE_URL));
      if (!preflight.ok) {
        const reason = `its media is not live at ${MEDIA_BASE_URL} yet — ${preflight.reason}. The platform fetches media by URL, so publishing now would fail. Waiting for the image PR to merge and deploy; no attempt spent, still queued.`;
        console.error(`social-poster: WAITING ${entry.file} — ${reason}`);
        outcomes.push({
          kind: OUTCOME.WAITING,
          file: entry.file,
          platform: item.platform,
          error: reason,
          overdueHours: hoursOverdue(item, now),
        });
        if (pairReady) brokenPairs.add(campaign);
        continue;
      }
    }

    // 5. Only an item that survived every check above consumes one of the
    // per-run slots — a blocked item never got this far, so it can't
    // monopolize the cap that's meant to bound REAL posting volume. A
    // deferral is routine scheduling (it happens whenever more than
    // MAX_POSTS_PER_RUN items are postable), so it's logged but NOT an
    // outcome — annotating every deferral would train readers to skim past
    // the warnings that matter.
    //
    // A due campaign PAIR is exempt from the per-item cap for its second
    // sibling (2026-09-10, kanban t_bac31b1a — codex review): checkSimul-
    // taneousPair requires both siblings' scheduledAt to land within 5
    // minutes of each other, but MAX_POSTS_PER_RUN=1 would otherwise always
    // defer one sibling to the next run (30 minutes later), silently
    // defeating "all at once" the moment a real due pair reached the
    // poster. Treating a due pair as ONE posting unit (both siblings post
    // in the same run, deliberately over the nominal per-run count) is what
    // makes the pairing promise the schema enforces actually true at
    // publish time — see MAX_POSTS_PER_PLATFORM_PER_DAY in lib/queue.mjs,
    // which still bounds each PLATFORM's daily volume regardless.
    if (attemptsThisRun >= MAX_POSTS_PER_RUN && !pairReady) {
      console.log(`social-poster: per-run cap (${MAX_POSTS_PER_RUN}) reached — deferring ${entry.file} to the next run.`);
      continue;
    }
    attemptsThisRun++;

    try {
      const result = await postOne(item);
      const { result: facebook, error: facebookError } = await crosspostToFacebook(item);
      // Approval provenance is now the `approval` object already on
      // `item` (docs/social/RULINGS-SOCIAL-2.md B1) — it rode in via the `...item`
      // spread below, written once by social-approval-poll.yml reacting to
      // the owner's own Discord ✅, never re-derived here. The old
      // git-provenance.mjs lookup (dead code — queried commits/{sha}/pulls,
      // whose response never carries merged_by) is deleted; nothing in
      // this file talks to GitHub's API any more, so posting has no
      // network dependency beyond the platforms themselves.
      const posted = {
        ...item,
        postedAt: now.toISOString(),
        platformPostId: result.id,
        url: result.url,
        ...(facebook ? { facebookPostId: facebook.id, facebookUrl: facebook.url } : {}),
      };
      await writeFile(path.join(postedDir, entry.file), JSON.stringify(posted, null, 2) + '\n');
      await rm(entry.full);
      console.log(`social-poster: posted ${entry.file} -> ${result.url}`);
      outcomes.push({
        kind: OUTCOME.POSTED,
        file: entry.file,
        platform: item.platform,
        url: result.url,
        ...(facebook ? { facebookUrl: facebook.url } : {}),
        ...(facebookError ? { facebookError } : {}),
      });

      // Keep every in-run dedupe/idempotency signal current for the REST of
      // this run's remaining items, not just for the next scheduled run.
      for (const m of item.media ?? []) mediaUsedThisRun.add(m);
      if (item.platform === 'instagram') recentIg.push(posted);
      allPostedData.push(posted);
    } catch (err) {
      const lastError = String(err.message ?? err);
      if (pairReady) brokenPairs.add(campaign); // every catch branch below is a non-POSTED outcome for a pair sibling

      // Ambiguous (transport-level, response never received) failures are
      // never auto-retried — see lib/platforms.mjs's publishFetch and this
      // file's header. Fails immediately, same MAX_ATTEMPTS-exhausted shape
      // (so downstream tooling doesn't need a third state to handle) but
      // with attempts left at 1 and a distinct, explicit lastError so a
      // human doesn't mistake it for an ordinary rejected-by-the-platform
      // failure that's safe to just re-queue.
      if (err.ambiguous) {
        const failureReason = `Transport-level failure while publishing — request may have already succeeded server-side, so this was NOT auto-retried (retrying an ambiguous publish is exactly the mechanism behind the 2026-07-17 triple-post incident). A human should check social/posted/ and the live account before deciding what to do next. Raw error: ${lastError}`;
        await moveToFailed(failedDir, entry, {
          ...item,
          attempts: (item.attempts ?? 0) + 1,
          lastError: 'ambiguous',
          lastAttemptAt: now.toISOString(),
          failureReason,
        });
        console.error(`social-poster: ${entry.file} hit an AMBIGUOUS transport failure — moved to social/failed/ WITHOUT retrying: ${lastError}`);
        outcomes.push({ kind: OUTCOME.FAILED, file: entry.file, platform: item.platform, attempts: (item.attempts ?? 0) + 1, error: failureReason });
        continue;
      }

      const attempts = (item.attempts ?? 0) + 1;
      const failed = { ...item, attempts, lastError, lastAttemptAt: now.toISOString() };
      if (attempts >= MAX_ATTEMPTS) {
        failed.failureReason = `Failed ${attempts} time(s): ${lastError}`;
        await moveToFailed(failedDir, entry, failed);
        console.error(`social-poster: ${entry.file} failed ${attempts} time(s), moved to social/failed/: ${lastError}`);
        outcomes.push({ kind: OUTCOME.FAILED, file: entry.file, platform: item.platform, attempts, error: lastError });
      } else {
        await writeFile(entry.full, JSON.stringify(failed, null, 2) + '\n');
        console.error(`social-poster: ${entry.file} attempt ${attempts} failed, will retry: ${lastError}`);
        outcomes.push({ kind: OUTCOME.RETRYING, file: entry.file, platform: item.platform, attempts, error: lastError });
      }
    }
  }

  return finish(outcomes);
}

// Only auto-run as a CLI; tests import `main` and drive it directly.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(main, { name: 'post-queue' });
}
