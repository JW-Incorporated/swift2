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
import { selectDuePosts, utcDateOnly } from './lib/queue.mjs';
import { postToX, postToInstagram } from './lib/platforms.mjs';

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

  for (const item of due) {
    const entry = queued.find((q) => q.data === item);
    try {
      const result = await postOne(item);
      const posted = { ...item, postedAt: now.toISOString(), platformPostId: result.id, url: result.url };
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
