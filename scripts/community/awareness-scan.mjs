#!/usr/bin/env node
// Awareness image-reply lane — discovery (owner direction 2026-10-01,
// docs/strategy/growth-strategy.md bet 2). Zero-LLM. Runs every 3 hours with
// a small Reddit request budget (awareness-fetch.mjs): the two big fan subs
// every run plus a rotating window of the other subs and of Reddit-wide
// search RSS (awareness-sources.mjs), which finds Taylor threads outside the
// fan subs. Titles go through the discovery filters (awareness-filters.mjs),
// each sub's image-comment support comes from a cached about.json reading
// (awareness-eligibility.mjs), a site card is picked (awareness-image.mjs),
// and `engagement_lead(kind='awareness_reply', status='new')` rows are
// inserted. The awareness answerer routine then writes the reply text;
// awareness-deliver.mjs sends it to Discord. The OWNER posts — nothing here
// (or anywhere in this lane) calls a Reddit/Facebook write API.
//
// Facebook: the weekly export ingest (fb-export-ingest.mjs) lands
// `hot_thread` leads with platform='facebook'; this script adopts the fitting
// ones as awareness rows (awareness-facebook.mjs) without touching the exporter.
//
// Reddit access: with secrets REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET the scan
// uses app-only OAuth (awareness-reddit-api.mjs: every sub hot+new, every search
// query, /about for image eligibility); without them, or if the token request
// fails, it falls back to the anonymous RSS path above. Log line `auth: oauth`.
//
// Kill switch: repo VARIABLE `AWARENESS_LANE_ENABLED=false` stops the lane
// (workflow checks it first; re-checked here). Unset means ON.
//
//   npx tsx scripts/community/awareness-scan.mjs [--dry-run]   # dry-run: no DB writes
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serviceClient } from '../lib/supabase.mjs';
import { runMain } from '../lib/cli.mjs';
import { fetchKnownThreadIds, insertLeads } from './scan.mjs';
import { applyCandidateCaps, evaluateThread, scoreCandidate } from './awareness-filters.mjs';
import {
  aboutBlockedRecently,
  cachedAbout,
  fetchSubAbout,
  loadAboutCache,
  resolveImageComments,
  saveAbout,
} from './awareness-eligibility.mjs';
import { buildAwarenessRow, fetchTodaysCandidateCounts } from './awareness-rows.mjs';
import { adoptFacebookLeads } from './awareness-facebook.mjs';
import { createFeedFetcher } from './awareness-fetch.mjs';
import { connectRedditApi, oauthRequests, redditAuthFromEnv } from './awareness-reddit-api.mjs';
import { loadCatalog, pickImageRef } from './awareness-image.mjs';
import {
  buildSources,
  communityFromPermalink,
  dayIndexOf,
  isBlockedSub,
  pickSources,
  searchFeedUrl,
  slotOf,
  sortFor,
  subFeedUrl,
} from './awareness-sources.mjs';

const CONFIG_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'awareness-subs.json');
export {
  buildAwarenessRow,
  contextFor,
  fetchTodaysCandidateCounts,
  utcDayStart,
} from './awareness-rows.mjs';
export const RUN_CAP = 6;
export const DEFAULT_DAILY_CAP = 3;

export function awarenessEnabled(env = process.env) {
  return env.AWARENESS_LANE_ENABLED !== 'false' && env.AWARENESS_LANE_ENABLED !== '0';
}

export function loadConfig(file = CONFIG_PATH) {
  const config = JSON.parse(readFileSync(file, 'utf8'));
  return {
    defaults: config.defaults ?? {},
    subs: config.subs ?? [],
    excluded: config.excluded ?? [],
    search: config.search ?? {},
  };
}

/** A sub's own daily delivery cap (4 for the two big fan subs), else the default. */
export function dailyCapFor(sub, defaults) {
  return sub?.dailyCap ?? defaults?.perSubDailyDeliveryCap ?? DEFAULT_DAILY_CAP;
}

/** Groups fetched posts by the community they belong to, dropping blocked/NSFW subs; best feed rank wins per id. */
export function groupByCommunity(fetched, config) {
  const groups = new Map();
  for (const { source, posts } of fetched) {
    for (const post of posts) {
      const name = source.kind === 'sub' ? source.sub.name : communityFromPermalink(post.permalink);
      if (!name || isBlockedSub(name, config)) continue;
      const group = groups.get(name) ?? new Map();
      const prior = group.get(post.id);
      if (!prior || post.rank < prior.rank) group.set(post.id, post);
      groups.set(name, group);
    }
  }
  return groups;
}

/**
 * Resolves a community's image-comment state: cache first. Anonymous: at most
 * one live about.json read per run, configured subs only. OAuth: every
 * uncached community, bounded by the API request budget.
 */
async function aboutFor(name, configured, ctx) {
  const cached = cachedAbout(ctx.cache, name, ctx.now);
  if (cached) return cached;
  if (ctx.oauth) {
    const live = await ctx.fetchAbout(name);
    if (ctx.supabase && !ctx.dryRun && !live.error)
      await saveAbout(ctx.supabase, name, live, ctx.now);
    return live;
  }
  if (!configured || ctx.aboutSpent || aboutBlockedRecently(ctx.cache, ctx.now))
    return { imageComments: 'unknown', over18: false };
  ctx.aboutSpent = true;
  await ctx.sleep(ctx.pacingMs);
  const live = await ctx.fetchAbout(name, { fetchImpl: ctx.fetchImpl });
  if (ctx.supabase && !ctx.dryRun) await saveAbout(ctx.supabase, name, live, ctx.now);
  return live;
}

export async function runAwarenessScan({
  supabase = null,
  config = loadConfig(),
  catalog,
  fetchImpl,
  fetchAbout = fetchSubAbout,
  now = new Date(),
  sleep = (ms) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    }),
  random = Math.random,
  relayUrl = null,
  redditAuth = null,
  dryRun = false,
} = {}) {
  const { defaults } = config;
  const limit = defaults.feedLimit ?? 25;
  const slot = slotOf(now);
  const { api, auth, authError } = await connectRedditApi(redditAuth, {
    defaults,
    fetchImpl,
    sleep,
  });
  const pacingMs = defaults.pacingMs ?? 6000;
  const fetcher =
    api ??
    createFeedFetcher({
      budget: defaults.feedRequestsPerRun ?? 6,
      pacingMs,
      relayUrl,
      fetchImpl,
      sleep,
      random,
    });
  const requests = api
    ? oauthRequests(config, limit)
    : pickSources(buildSources(config), {
        slot,
        dayIndex: dayIndexOf(now),
        budget: defaults.feedRequestsPerRun ?? 6,
      }).map((source, index) => ({
        source,
        label: source.id,
        url:
          source.kind === 'sub'
            ? subFeedUrl(source.sub.name, sortFor(slot, index), limit)
            : searchFeedUrl(source.query, limit),
      }));
  const fetched = [];
  const perSource = [];
  for (const request of requests) {
    const res = await fetcher.get(request.url, request.label, { rankOffset: request.rankOffset });
    fetched.push({ source: request.source, posts: res.posts });
    perSource.push({
      source: request.label,
      status: res.status,
      posts: res.posts.length,
      via: res.via ?? null,
      skipped: res.skipped === true,
    });
  }

  const known = supabase ? await fetchKnownThreadIds(supabase) : new Set();
  const today = supabase ? await fetchTodaysCandidateCounts(supabase, now) : {};
  const ctx = {
    cache: supabase ? await loadAboutCache(supabase) : new Map(),
    now,
    sleep,
    pacingMs,
    fetchAbout: api ? (name) => api.about(name) : fetchAbout,
    fetchImpl,
    supabase,
    dryRun,
    aboutSpent: false,
    oauth: api !== null,
  };
  const byName = new Map(config.subs.map((sub) => [sub.name, sub]));
  const all = [];
  const remainingToday = {};
  const perSub = [];
  for (const [name, group] of groupByCommunity(fetched, config)) {
    const configured = byName.get(name);
    const sub = configured ?? { name, tier: 1, requireTaylor: 'strict' };
    const about = await aboutFor(name, Boolean(configured), ctx);
    if (about.over18) {
      perSub.push({ subreddit: name, skipped: 'over18' });
      continue;
    }
    const imageComments = resolveImageComments(sub, about);
    const rejected = {};
    let passed = 0;
    for (const post of group.values()) {
      const verdict = evaluateThread(post, sub, { now, maxAgeHours: defaults.maxAgeHours });
      if (!verdict.ok) {
        rejected[verdict.reason] = (rejected[verdict.reason] ?? 0) + 1;
        continue;
      }
      passed += 1;
      if (known.has(post.id)) continue;
      all.push({
        subreddit: name,
        post,
        types: verdict.types,
        ageHours: verdict.ageHours,
        imageRef: pickImageRef(post.title, catalog).ref,
        imageComments,
        score: scoreCandidate(
          { types: verdict.types, rank: post.rank, ageHours: verdict.ageHours },
          sub,
        ),
      });
    }
    remainingToday[name] = Math.max(0, dailyCapFor(configured, defaults) + 1 - (today[name] ?? 0));
    perSub.push({ subreddit: name, imageComments, fetched: group.size, passed, rejected });
  }

  const kept = applyCandidateCaps(all, {
    perSubScanCap: defaults.perSubScanCapPerRun ?? 2,
    remainingToday,
    runCap: RUN_CAP,
  });
  const rows = kept.map((c) =>
    buildAwarenessRow({
      subreddit: c.subreddit,
      post: c.post,
      types: c.types,
      ageHours: c.ageHours,
      imageRef: c.imageRef,
      imageComments: c.imageComments,
    }),
  );
  const facebookRows = supabase ? await adoptFacebookLeads(supabase, { catalog, now }) : [];
  let inserted = 0;
  if (!dryRun && supabase) {
    inserted =
      (await insertLeads(supabase, rows)).inserted +
      (await insertLeads(supabase, facebookRows)).inserted;
  }
  return {
    auth,
    authError,
    perSource,
    perSub,
    requests: fetcher.stats(),
    candidates: all.length,
    kept: rows.length,
    facebook: facebookRows.length,
    inserted,
    rows,
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (!awarenessEnabled()) {
    console.log(
      'awareness-scan: AWARENESS_LANE_ENABLED=false — skipping. Kill switch, not a fault.',
    );
    return 0;
  }
  const supabase = serviceClient();
  if (!supabase && !dryRun) {
    console.log(
      'awareness-scan: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY unset — skipping (degraded, not a crash).',
    );
    return 0;
  }
  const result = await runAwarenessScan({
    supabase,
    catalog: await loadCatalog(),
    relayUrl: process.env.HOME_RELAY_URL || null,
    redditAuth: redditAuthFromEnv(),
    dryRun,
  });
  console.log(
    `awareness-scan: auth: ${result.auth}${result.authError ? ` (${result.authError}; fell back to anonymous RSS)` : ''}`,
  );
  console.log(
    `awareness-scan: ${result.candidates} candidate(s) passed filters, ${result.kept} kept under caps, ${result.facebook} Facebook adopted, ${result.inserted} inserted${dryRun ? ' (dry-run: nothing written)' : ''}. Requests: ${JSON.stringify(result.requests)}`,
  );
  for (const s of result.perSource) console.log(`  source ${JSON.stringify(s)}`);
  for (const s of result.perSub) console.log(`  r/${s.subreddit}: ${JSON.stringify(s)}`);
  return 0;
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'awareness-scan.mjs') {
  runMain(main, { name: 'awareness-scan' });
}
