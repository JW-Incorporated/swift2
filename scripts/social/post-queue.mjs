#!/usr/bin/env node
// Posts due, founder-approved items from social/queue/**.json to their
// platform, moving each to social/posted/ (success) or social/failed/
// (after 3 failed attempts). Run as a scheduled GitHub Action
// (.github/workflows/social-poster.yml) — see docs/agents/growth.md for the
// approval flow this sits downstream of.
//
// Crisis stop: if the repo variable SOCIAL_FREEZE is set to anything
// truthy, this exits immediately without posting or touching the queue —
// per the Growth desk charter's hard rail. Any founder can set it.
//
// Failures are LOUD (2026-08-11). A permanently-failed item (all 3 attempts
// burned, moved to social/failed/) makes this process exit non-zero, emits a
// `::error::` Action annotation, and writes a markdown report that the
// workflow puts in the queue-state PR's title and body. Before this, twelve
// posts died into social/failed/ across 2026-07-21..08-04 — eleven X (403
// every time) and one Instagram (#1897) — and every one of those runs
// finished GREEN. See
// scripts/social/lib/run-report.mjs's header for the receipts. The workflow's
// state-commit step runs with `if: always()`, so a red run still records what
// happened; without that the failed/ move would never land and the item would
// retry against the same wall forever.
//
// Two states deliberately spend NO attempt, so an item can sit in either
// forever without ever reaching social/failed/:
//   - skipped  — the generic era-art repetition guard (an authoring gap).
//   - waiting  — media not yet live on the site (lib/preflight.mjs); the
//                item is fine, its image PR just hasn't merged/deployed.
// Both are the right behaviour and both were, until 2026-08-11, invisible:
// social/queue/2026-08-09-august-augustine-ig.json was skipped every 30
// minutes for two days inside runs that exited 0. run-report.mjs now
// escalates either state past STUCK_AFTER_HOURS into a red run, so a wait
// cannot quietly become a never.
//
// Environment overrides (both for tests only, never set in the workflow):
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
import { selectDuePosts, utcDateOnly, repeatsRecentEraArt, requiresLiveMedia, hoursOverdue } from './lib/queue.mjs';
import { postToX, postToInstagram, postToFacebookPage } from './lib/platforms.mjs';
import { mediaUrlsReachable } from './lib/preflight.mjs';
import { OUTCOME, hasBlockingFailure, summarizeRun, formatReportMarkdown, formatAnnotations } from './lib/run-report.mjs';

const MEDIA_BASE_URL = 'https://www.longlivets.com';
const MAX_ATTEMPTS = 3;

function resolveRoot() {
  return process.env.SOCIAL_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
}

async function readJsonDir(dir) {
  let files;
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  const out = [];
  for (const file of files) {
    const full = path.join(dir, file);
    out.push({ file, full, data: JSON.parse(await readFile(full, 'utf-8')) });
  }
  return out;
}

/** Last `n` Instagram items ever posted, oldest-to-newest by `postedAt`, for
 * the repeated-era-art guard below. Reads all of social/posted/ — cheap at
 * this account's post volume; revisit if that ever stops being true. */
async function recentInstagramPosts(postedDir, n = 10) {
  const posted = await readJsonDir(postedDir);
  return posted
    .map((p) => p.data)
    .filter((d) => d.platform === 'instagram')
    .sort((a, b) => new Date(a.postedAt) - new Date(b.postedAt))
    .slice(-n);
}

async function countPostedToday(postedDir, now) {
  const posted = await readJsonDir(postedDir);
  const today = utcDateOnly(now);
  const counts = new Map();
  for (const { data } of posted) {
    if (utcDateOnly(data.postedAt) !== today) continue;
    counts.set(data.platform, (counts.get(data.platform) ?? 0) + 1);
  }
  return counts;
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

  if (item.platform === 'x') return postToX(item, creds);
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
async function publishReport(outcomes) {
  const summary = summarizeRun(outcomes);
  const runUrl =
    process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : undefined;
  const markdown = formatReportMarkdown(outcomes, { runUrl });

  for (const annotation of formatAnnotations(outcomes)) console.log(annotation);
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
  return { summary, markdown };
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
  const postedToday = await countPostedToday(postedDir, now);
  const due = selectDuePosts(queued.map((q) => q.data), now, postedToday);

  const outcomes = [];

  if (due.length === 0) {
    console.log('social-poster: nothing due this run.');
    await publishReport(outcomes);
    return outcomes;
  }

  const recentIg = await recentInstagramPosts(postedDir);

  for (const item of due) {
    const entry = queued.find((q) => q.data === item);

    // Block, don't post-and-hope: a queue item whose only photo is generic
    // era-cover art that already appears among the recent posts (2026-08-06,
    // see docs/decisions.md) is an authoring gap, not a transient failure —
    // skip it this run (still due next run) rather than spend an `attempts`
    // retry or, worse, actually publish the repeat. Loud on purpose so it
    // surfaces in the Action log and the brief's Growth line notices a
    // stuck item.
    if (repeatsRecentEraArt(item, recentIg)) {
      const reason = `its media (${item.media[0]}) is generic era-cover art already used in a recent Instagram post. Needs a real dedicated photo (see docs/agents/runner-prompts/growth-draft.md's Media section) before it can ship. Left in the queue, not counted as a failed attempt.`;
      console.error(`social-poster: SKIPPING ${entry.file} — ${reason}`);
      outcomes.push({
        kind: OUTCOME.SKIPPED,
        file: entry.file,
        platform: item.platform,
        error: reason,
        overdueHours: hoursOverdue(item, now),
      });
      continue;
    }

    // Media-reachability gate (2026-08-11). Instagram/Facebook do not receive
    // an upload — Meta fetches the image from the live site — so an item
    // whose image PR is merged-but-not-deployed, or not merged at all, is not
    // postable no matter what its `scheduledAt` says. Before this, such an
    // item was "due", so it burned real attempts against a 404 and died in
    // social/failed/; the drafting agent's rational response was to stop
    // queueing real photos and reuse deployed era art (21 of 22 IG posts).
    // Now it WAITS instead: no publish, no attempt spent, visible in the run
    // report, and it ships itself on the first run after the deploy lands.
    // See lib/preflight.mjs. It only stops being benign if it goes on too
    // long — run-report.mjs escalates a wait past STUCK_AFTER_HOURS to a red
    // run, so "waiting" can't quietly become "never".
    if (requiresLiveMedia(item)) {
      const urls = item.media.map((p) => `${MEDIA_BASE_URL}${p}`);
      const preflight = await mediaUrlsReachable(urls);
      if (!preflight.ok) {
        const reason = `its media is not live at ${MEDIA_BASE_URL} yet — ${preflight.reason}. Instagram fetches media by URL, so publishing now would 404. Waiting for the image PR to merge and deploy; no attempt spent, still queued.`;
        console.error(`social-poster: WAITING ${entry.file} — ${reason}`);
        outcomes.push({
          kind: OUTCOME.WAITING,
          file: entry.file,
          platform: item.platform,
          error: reason,
          overdueHours: hoursOverdue(item, now),
        });
        continue;
      }
    }

    try {
      const result = await postOne(item);
      const { result: facebook, error: facebookError } = await crosspostToFacebook(item);
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
        ...(facebookError ? { facebookError } : {}),
      });
    } catch (err) {
      const attempts = (item.attempts ?? 0) + 1;
      const lastError = String(err.message ?? err);
      const failed = { ...item, attempts, lastError, lastAttemptAt: now.toISOString() };
      if (attempts >= MAX_ATTEMPTS) {
        await writeFile(path.join(failedDir, entry.file), JSON.stringify(failed, null, 2) + '\n');
        await rm(entry.full);
        console.error(`social-poster: ${entry.file} failed ${attempts} times, moved to social/failed/: ${lastError}`);
        outcomes.push({ kind: OUTCOME.FAILED, file: entry.file, platform: item.platform, attempts, error: lastError });
      } else {
        await writeFile(entry.full, JSON.stringify(failed, null, 2) + '\n');
        console.error(`social-poster: ${entry.file} attempt ${attempts} failed, will retry: ${lastError}`);
        outcomes.push({ kind: OUTCOME.RETRYING, file: entry.file, platform: item.platform, attempts, error: lastError });
      }
    }
  }

  await publishReport(outcomes);

  // The whole point: a post that never made it to the timeline must not leave
  // a green check behind. `if: always()` on the workflow's state-commit step
  // means the failed/ move is still recorded despite this.
  if (hasBlockingFailure(outcomes)) {
    process.exitCode = 1;
    console.error(
      'social-poster: exiting non-zero — at least one post permanently failed, or has been stuck past schedule long enough that it will never post on its own.',
    );
  }

  return outcomes;
}

// Only auto-run as a CLI; tests import `main` and drive it directly.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
