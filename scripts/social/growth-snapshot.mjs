#!/usr/bin/env node
// Daily growth snapshot: follower counts per platform + posts published
// today, written to social/metrics/YYYY-MM-DD.json. Run as a scheduled
// GitHub Action (.github/workflows/growth-snapshot.yml), committed the same
// way social-poster.yml commits queue state (throwaway branch + auto-merge
// PR, main is branch-protected). Marjorie's brief-assembly script reads
// this file directly off its own checkout — see
// scripts/marjorie/assemble-brief.mjs's fetchGrowthSnapshot().
//
// Deliberately reads only follower counts (not per-post engagement): that's
// already the weekly growth-plan.md rollup's job. This is a daily pulse
// check, not the analysis. Each platform fetch is independent and never
// throws — a single platform's API hiccup yields `null` for that field
// rather than failing the whole snapshot.

import { readdir, readFile, mkdir, writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, URLSearchParams } from 'node:url';
import { oauth1Header } from './lib/oauth1.mjs';
import { GRAPH_VERSION } from './lib/platforms.mjs';
import { countPostsOn, countPostsByPlatformSince, buildSnapshot, findSeriesGaps, recentGaps } from './lib/growth.mjs';
import { utcDateOnly } from './lib/queue.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const POSTED_DIR = path.join(ROOT, 'social', 'posted');
const METRICS_DIR = path.join(ROOT, 'social', 'metrics');

async function readPostedItems() {
  let files;
  try {
    files = (await readdir(POSTED_DIR)).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  const out = [];
  for (const file of files) {
    out.push(JSON.parse(await readFile(path.join(POSTED_DIR, file), 'utf-8')));
  }
  return out;
}

async function fetchXFollowers() {
  const { X_API_KEY, X_API_KEY_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET } = process.env;
  if (!X_API_KEY || !X_API_KEY_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_TOKEN_SECRET) return null;
  try {
    // Base URL for signing must exclude the query string — oauth1Header
    // signs it separately via `params` (see that function's docstring for
    // why this matters for GET requests specifically).
    const baseUrl = 'https://api.twitter.com/2/users/me';
    const params = { 'user.fields': 'public_metrics' };
    const header = oauth1Header({
      method: 'GET',
      url: baseUrl,
      consumerKey: X_API_KEY,
      consumerSecret: X_API_KEY_SECRET,
      token: X_ACCESS_TOKEN,
      tokenSecret: X_ACCESS_TOKEN_SECRET,
      params,
    });
    const res = await fetch(`${baseUrl}?${new URLSearchParams(params)}`, { headers: { Authorization: header } });
    const body = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(body));
    return body.data.public_metrics.followers_count;
  } catch (err) {
    console.error(`growth-snapshot: X follower fetch failed: ${err.message ?? err}`);
    return null;
  }
}

async function fetchInstagramFollowers() {
  const { IG_ACCESS_TOKEN, IG_BUSINESS_ACCOUNT_ID } = process.env;
  if (!IG_ACCESS_TOKEN || !IG_BUSINESS_ACCOUNT_ID) return null;
  try {
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${IG_BUSINESS_ACCOUNT_ID}?fields=followers_count&access_token=${encodeURIComponent(IG_ACCESS_TOKEN)}`;
    const res = await fetch(url);
    const body = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(body));
    return body.followers_count;
  } catch (err) {
    console.error(`growth-snapshot: Instagram follower fetch failed: ${err.message ?? err}`);
    return null;
  }
}

async function fetchFacebookFollowers() {
  const { IG_ACCESS_TOKEN, FB_PAGE_ID } = process.env;
  if (!IG_ACCESS_TOKEN || !FB_PAGE_ID) return null;
  try {
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${FB_PAGE_ID}?fields=followers_count&access_token=${encodeURIComponent(IG_ACCESS_TOKEN)}`;
    const res = await fetch(url);
    const body = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(body));
    return body.followers_count;
  } catch (err) {
    console.error(`growth-snapshot: Facebook follower fetch failed: ${err.message ?? err}`);
    return null;
  }
}

async function main() {
  const now = new Date();
  const date = utcDateOnly(now);

  const [x, instagram, facebook] = await Promise.all([
    fetchXFollowers(),
    fetchInstagramFollowers(),
    fetchFacebookFollowers(),
  ]);
  const postedItems = await readPostedItems();
  const postsToday = countPostsOn(postedItems, date);
  // The number the brief actually reports. `postsToday` is kept for history
  // compatibility but is structurally near-always 0 at this workflow's 11:05
  // UTC slot — see countPostsByPlatformSince's docstring.
  const postsLast24h = countPostsByPlatformSince(postedItems, now);

  // Continuity check BEFORE today's file is written, so today isn't counted
  // as present by its own run. See findSeriesGaps for the two real causes
  // this went looking for and found.
  const gaps = findSeriesGaps(await existingSnapshotDates(), date).filter((d) => d !== date);

  const snapshot = buildSnapshot({
    date,
    followers: { x, instagram, facebook },
    postsToday,
    postsLast24h,
    seriesGaps: gaps,
  });

  await mkdir(METRICS_DIR, { recursive: true });
  await writeFile(path.join(METRICS_DIR, `${date}.json`), JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`growth-snapshot: wrote social/metrics/${date}.json`, snapshot);

  reportGaps(gaps, date);
}

/** YYYY-MM-DDs already present in social/metrics/. */
async function existingSnapshotDates() {
  try {
    return (await readdir(METRICS_DIR)).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -'.json'.length));
  } catch {
    return [];
  }
}

/**
 * Makes a hole in the daily series impossible to miss without ever failing
 * the run — a historical gap must not block today's snapshot from being
 * written and committed, which is the whole reason the gap is a gap.
 *
 * A gap inside the last week is an ::error:: annotation (the pipeline may be
 * broken right now); older ones are a ::warning:: (history, already
 * explained). Both also land in the job summary, and in the snapshot file
 * itself via buildSnapshot's `seriesGaps`.
 */
function reportGaps(gaps, date) {
  if (!gaps.length) {
    console.log(`growth-snapshot: metrics series is continuous through ${date}.`);
    return;
  }
  const recent = recentGaps(gaps, date);
  const level = recent.length ? 'error' : 'warning';
  const headline =
    `social/metrics/ is missing ${gaps.length} day(s): ${gaps.join(', ')}. ` +
    (recent.length
      ? `${recent.length} of those are in the last 7 days — check that this workflow is running AND that its auto-merge PR actually merged (a snapshot that runs green but never lands on main leaves exactly this hole).`
      : 'All are older than 7 days.');

  console.log(`::${level} title=growth-snapshot: gap in the daily metrics series::${headline}`);
  console.error(`growth-snapshot: ${headline}`);

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      `\n**growth-snapshot: ${gaps.length} missing day(s) in social/metrics/**\n\n${gaps.map((g) => `- \`${g}\``).join('\n')}\n`,
    ).catch((err) => console.error(`growth-snapshot: could not write job summary: ${err.message ?? err}`));
  }
}

main();
