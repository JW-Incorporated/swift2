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

import { readdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectDuePosts, utcDateOnly, repeatsRecentEraArt } from './lib/queue.mjs';
import { postToX, postToInstagram, postToFacebookPage } from './lib/platforms.mjs';

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

/** Last `n` Instagram items ever posted, oldest-to-newest by `postedAt`, for
 * the repeated-era-art guard below. Reads all of social/posted/ — cheap at
 * this account's post volume; revisit if that ever stops being true. */
async function recentInstagramPosts(n = 10) {
  const posted = await readJsonDir(POSTED_DIR);
  return posted
    .map((p) => p.data)
    .filter((d) => d.platform === 'instagram')
    .sort((a, b) => new Date(a.postedAt) - new Date(b.postedAt))
    .slice(-n);
}

async function countPostedToday(now) {
  const posted = await readJsonDir(POSTED_DIR);
  const today = utcDateOnly(now);
  const counts = new Map();
  for (const { data } of posted) {
    if (utcDateOnly(data.postedAt) !== today) continue;
    counts.set(data.platform, (counts.get(data.platform) ?? 0) + 1);
  }
  return counts;
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
  const postedToday = await countPostedToday(now);
  const due = selectDuePosts(queued.map((q) => q.data), now, postedToday);

  if (due.length === 0) {
    console.log('social-poster: nothing due this run.');
    return;
  }

  const recentIg = await recentInstagramPosts();

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
      console.error(
        `social-poster: SKIPPING ${entry.file} — its media (${item.media[0]}) is generic era-cover art already used in a recent Instagram post. Needs a real dedicated photo (see docs/agents/runner-prompts/growth-draft.md's Media section) before it can ship. Left in the queue, not counted as a failed attempt.`,
      );
      continue;
    }

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
    } catch (err) {
      const attempts = (item.attempts ?? 0) + 1;
      const failed = { ...item, attempts, lastError: String(err.message ?? err), lastAttemptAt: now.toISOString() };
      if (attempts >= MAX_ATTEMPTS) {
        await writeFile(path.join(FAILED_DIR, entry.file), JSON.stringify(failed, null, 2) + '\n');
        await rm(entry.full);
        console.error(`social-poster: ${entry.file} failed ${attempts} times, moved to social/failed/: ${failed.lastError}`);
      } else {
        await writeFile(entry.full, JSON.stringify(failed, null, 2) + '\n');
        console.error(`social-poster: ${entry.file} attempt ${attempts} failed, will retry: ${failed.lastError}`);
      }
    }
  }
}

main();
