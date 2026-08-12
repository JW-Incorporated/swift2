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
//   4. Deploy-lag preflight (network, so checked after the free checks).
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

import { readdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  selectDuePosts,
  eraArtGuardReason,
  isStaleDue,
  isValidScheduledAt,
  MAX_POSTS_PER_RUN,
  recentInstagramPosts,
  countPostedToday,
  findPostedDuplicate,
  missingCredsFor,
  needsMediaPreflight,
  mediaUrlsFor,
} from './lib/queue.mjs';
import { postToX, postToInstagram, postToFacebookPage } from './lib/platforms.mjs';
import { mediaUrlsReachable } from './lib/preflight.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const QUEUE_DIR = path.join(ROOT, 'social', 'queue');
const POSTED_DIR = path.join(ROOT, 'social', 'posted');
const FAILED_DIR = path.join(ROOT, 'social', 'failed');
const MEDIA_BASE_URL = 'https://www.longlivets.com';
const MAX_ATTEMPTS = 3;

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

async function moveToFailed(entry, failed) {
  await writeFile(path.join(FAILED_DIR, entry.file), JSON.stringify(failed, null, 2) + '\n');
  await rm(entry.full);
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
  if (item.platform === 'instagram') return postToInstagram(item, { ...creds, accessToken: igAccessToken }, MEDIA_BASE_URL);
  throw new Error(`Unknown platform "${item.platform}"`);
}

/**
 * Best-effort Facebook Page cross-post, run only after an Instagram post
 * already succeeded. Deliberately never affects the item's own success/
 * retry state — the Instagram post is the thing the founder approved and
 * it already landed; a Facebook failure is logged loudly but doesn't undo
 * that or trigger a retry of the whole item (which would re-post to
 * Instagram too). Only runs when FB_PAGE_ID is configured.
 */
async function crosspostToFacebook(item) {
  const facebookPageId = process.env.FB_PAGE_ID;
  if (!facebookPageId || item.platform !== 'instagram') return null;
  try {
    const result = await postToFacebookPage(item, { accessToken: process.env.IG_ACCESS_TOKEN, facebookPageId }, MEDIA_BASE_URL);
    console.log(`social-poster: cross-posted to Facebook Page -> ${result.url}`);
    return result;
  } catch (err) {
    console.error(`social-poster: Facebook Page cross-post failed (Instagram post itself still succeeded): ${err.message ?? err}`);
    return null;
  }
}

async function main() {
  if (process.env.SOCIAL_FREEZE && process.env.SOCIAL_FREEZE !== 'false' && process.env.SOCIAL_FREEZE !== '0') {
    console.log(`social-poster: SOCIAL_FREEZE is set ("${process.env.SOCIAL_FREEZE}") — skipping this run entirely.`);
    return;
  }

  const now = new Date();
  const queued = await readJsonDir(QUEUE_DIR);

  // Invalid/missing scheduledAt is quarantined immediately, before due-ness
  // is even asked about: isDue()/isStaleDue() both feed it into
  // `new Date(...).getTime()`, which is NaN for a bad value, and every
  // comparison against NaN is false — meaning such an item would otherwise
  // never be "due" AND never be "stale," making it permanently invisible to
  // everything below (see isValidScheduledAt's docstring in lib/queue.mjs).
  const validQueued = [];
  for (const entry of queued) {
    if (isValidScheduledAt(entry.data)) {
      validQueued.push(entry);
      continue;
    }
    await moveToFailed(entry, {
      ...entry.data,
      failureReason: `Invalid or missing "scheduledAt" (${JSON.stringify(entry.data.scheduledAt)}) — this item could never become due or stale, so it would have sat unprocessed forever.`,
      lastAttemptAt: now.toISOString(),
    });
    console.error(`social-poster: ${entry.file} has an invalid/missing scheduledAt — moved to social/failed/.`);
  }

  const allPosted = await readJsonDir(POSTED_DIR);
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
    return;
  }

  // Abort the WHOLE run, before touching any item, if a platform with due
  // work this run is missing required credentials — a per-item failure here
  // would just burn 3 attempts (1.5h) on every single due item for a
  // problem no retry can fix.
  const neededPlatforms = [...new Set(due.map((item) => item.platform))];
  const credIssues = neededPlatforms.flatMap((platform) => {
    const missing = missingCredsFor(platform);
    return missing.length ? [`${platform}: missing ${missing.join(', ')}`] : [];
  });
  if (credIssues.length) {
    console.error(
      `social-poster: ABORTING this run — required credentials are missing for a platform with due items:\n${credIssues.map((c) => `  - ${c}`).join('\n')}\nNo items were touched; nothing was attempted or retried.`,
    );
    return;
  }

  const recentIg = recentInstagramPosts(allPostedData);
  const mediaUsedThisRun = new Set();
  let attemptsThisRun = 0;

  for (const item of due) {
    const entry = validQueued.find((q) => q.data === item);

    // 1. Stale check FIRST — unconditional, regardless of what else is true
    // about this item. A 3-day-stale item must not quietly post just
    // because it happens to be unblocked on the run that finally checks it.
    if (isStaleDue(item, now)) {
      await moveToFailed(entry, {
        ...item,
        failureReason: 'Still unposted more than 48h after scheduledAt — moved to social/failed/ regardless of current guard/preflight state (see social/README.md\'s 48h rule).',
        lastAttemptAt: now.toISOString(),
      });
      console.error(`social-poster: ${entry.file} moved to social/failed/ — stuck >48h past scheduledAt.`);
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
    // media the FIRST item in this same run just posted).
    if (!blockReason) blockReason = eraArtGuardReason(item, recentIg);
    if (!blockReason) {
      const repeatedThisRun = item.media?.find((m) => mediaUsedThisRun.has(m));
      if (repeatedThisRun) blockReason = `media "${repeatedThisRun}" was already posted earlier in this same run — not reposting it again this run.`;
    }

    // 4. Deploy-lag preflight (network — checked last among the free/cheap
    // checks above, and only reached if none of them already blocked it).
    if (!blockReason && needsMediaPreflight(item)) {
      const preflight = await mediaUrlsReachable(mediaUrlsFor(item, MEDIA_BASE_URL));
      if (!preflight.ok) {
        blockReason = `media not deployed yet — ${preflight.reason} (merged but not live at ${MEDIA_BASE_URL} yet?)`;
      }
    }

    if (blockReason) {
      console.error(`social-poster: SKIPPING ${entry.file} — ${blockReason} Left in the queue, not counted as a failed attempt.`);
      continue;
    }

    // 5. Only an item that survived every check above consumes one of the
    // per-run slots — a blocked item never got this far, so it can't
    // monopolize the cap that's meant to bound REAL posting volume.
    if (attemptsThisRun >= MAX_POSTS_PER_RUN) {
      console.log(`social-poster: per-run cap (${MAX_POSTS_PER_RUN}) reached — deferring ${entry.file} to the next run.`);
      continue;
    }
    attemptsThisRun++;

    try {
      const result = await postOne(item);
      const facebook = await crosspostToFacebook(item);
      const posted = {
        ...item,
        postedAt: now.toISOString(),
        platformPostId: result.id,
        url: result.url,
        ...(facebook ? { facebookPostId: facebook.id, facebookUrl: facebook.url } : {}),
      };
      await writeFile(path.join(POSTED_DIR, entry.file), JSON.stringify(posted, null, 2) + '\n');
      await rm(entry.full);
      console.log(`social-poster: posted ${entry.file} -> ${result.url}`);

      // Keep every in-run dedupe/idempotency signal current for the REST of
      // this run's remaining items, not just for the next scheduled run.
      for (const m of item.media ?? []) mediaUsedThisRun.add(m);
      if (item.platform === 'instagram') recentIg.push(posted);
      allPostedData.push(posted);
    } catch (err) {
      const lastError = String(err.message ?? err);

      // Ambiguous (transport-level, response never received) failures are
      // never auto-retried — see lib/platforms.mjs's publishFetch and this
      // file's header. Fails immediately, same MAX_ATTEMPTS-exhausted shape
      // (so downstream tooling doesn't need a third state to handle) but
      // with attempts left at 1 and a distinct, explicit lastError so a
      // human doesn't mistake it for an ordinary rejected-by-the-platform
      // failure that's safe to just re-queue.
      if (err.ambiguous) {
        await moveToFailed(entry, {
          ...item,
          attempts: (item.attempts ?? 0) + 1,
          lastError: 'ambiguous',
          lastAttemptAt: now.toISOString(),
          failureReason: `Transport-level failure while publishing — request may have already succeeded server-side, so this was NOT auto-retried (retrying an ambiguous publish is exactly the mechanism behind the 2026-07-17 triple-post incident). A human should check social/posted/ and the live account before deciding what to do next. Raw error: ${lastError}`,
        });
        console.error(`social-poster: ${entry.file} hit an AMBIGUOUS transport failure — moved to social/failed/ WITHOUT retrying: ${lastError}`);
        continue;
      }

      const attempts = (item.attempts ?? 0) + 1;
      const failed = { ...item, attempts, lastError, lastAttemptAt: now.toISOString() };
      if (attempts >= MAX_ATTEMPTS) {
        failed.failureReason = `Failed ${attempts} time(s): ${lastError}`;
        await moveToFailed(entry, failed);
        console.error(`social-poster: ${entry.file} failed ${attempts} time(s), moved to social/failed/: ${lastError}`);
      } else {
        await writeFile(entry.full, JSON.stringify(failed, null, 2) + '\n');
        console.error(`social-poster: ${entry.file} attempt ${attempts} failed, will retry: ${lastError}`);
      }
    }
  }
}

main();
