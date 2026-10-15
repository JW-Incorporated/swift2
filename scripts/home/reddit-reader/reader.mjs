#!/usr/bin/env node
// Anonymous, read-only Reddit reader for the home PC. Chromium loads only GET
// documents: no login, API key, OAuth, posting, voting, messaging, or follows.
import path from 'node:path';
import { runMain } from '../../lib/cli.mjs';
import { serviceClient } from '../../lib/supabase.mjs';
import { loadConfig } from '../../community/awareness-scan.mjs';
import { loadCatalog } from '../../community/awareness-image.mjs';
import {
  PageBudgetExceeded,
  createPagePacer,
  loadPage,
  loadPacingHistory,
  savePacingHistory,
} from './pacing.mjs';
import { parseListingHtml, parseThreadHtml } from './parsers.mjs';
import {
  awarenessRows,
  buildHomeCrawlBundle,
  fetchTheorySubreddits,
  knownThreadIds,
  selectAwarenessCandidates,
  todaysCandidateCounts,
  writeHeartbeat,
  writeHomeCrawlBundle,
  writeLeads,
} from './writers.mjs';

export const DEFAULT_MAX_PAGES = 80;
export const DEFAULT_OUTPUT = '.artifacts/home-reddit-crawl.json';
export const DEFAULT_PACING_STATE = '.artifacts/home-reddit-pacing.json';

export function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const index = argv.indexOf('--max-pages');
  const maxPages = index >= 0 ? Number(argv[index + 1]) : DEFAULT_MAX_PAGES;
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 300) {
    throw new Error('--max-pages must be an integer from 1 to 300');
  }
  return { dryRun, maxPages };
}

function listingUrl(subreddit, sort) {
  return `https://old.reddit.com/r/${encodeURIComponent(subreddit)}/${sort}/`;
}

function classicUrl(permalink) {
  const url = new URL(permalink);
  url.hostname = 'old.reddit.com';
  return url.toString();
}

export function buildSources(config, theorySubreddits) {
  const sources = [];
  for (const subreddit of theorySubreddits) {
    sources.push({
      id: `theory:${subreddit}:new`,
      subreddit,
      theory: true,
      url: listingUrl(subreddit, 'new'),
    });
  }
  for (const sub of config.subs) {
    for (const sort of ['hot', 'new']) {
      sources.push({
        id: `sub:${sub.name}:${sort}`,
        subreddit: sub.name,
        theory: theorySubreddits.includes(sub.name),
        url: listingUrl(sub.name, sort),
      });
    }
  }
  for (const query of config.search?.queries ?? []) {
    const url = new URL('https://old.reddit.com/search/');
    url.searchParams.set('q', query);
    url.searchParams.set('sort', 'new');
    url.searchParams.set('t', 'day');
    sources.push({ id: `search:${query}`, subreddit: null, theory: false, url: url.toString() });
  }
  const seen = new Set();
  return sources.filter((source) => {
    if (seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
}

async function readDocument(page, source, pacer, warn) {
  const response = await loadPage(page, source.url, pacer);
  const status = response?.status() ?? 0;
  if (status >= 400) {
    warn(`home-reddit-reader: ${source.id} returned HTTP ${status}; skipping`);
    return [];
  }
  return parseListingHtml(await page.content());
}

async function readThread(page, post, pacer, warn) {
  const response = await loadPage(page, classicUrl(post.permalink), pacer);
  const status = response?.status() ?? 0;
  if (status >= 400) {
    warn(`home-reddit-reader: thread ${post.id} returned HTTP ${status}; skipping`);
    return null;
  }
  const parsed = parseThreadHtml(await page.content());
  return { ...parsed, post: { ...post, ...(parsed.post ?? {}), rank: post.rank } };
}

export async function runReader({
  dryRun = false,
  maxPages = DEFAULT_MAX_PAGES,
  supabase = dryRun ? null : serviceClient(),
  config = loadConfig(),
  catalog,
  outputPath = process.env.HOME_REDDIT_CRAWL_OUTPUT || DEFAULT_OUTPUT,
  pacingStatePath = process.env.HOME_REDDIT_PACING_STATE || DEFAULT_PACING_STATE,
  launch,
  now = new Date(),
  warn = console.warn,
} = {}) {
  if (!dryRun && !supabase)
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  const fallbackTheory = config.subs
    .filter((sub) => /theor/i.test(sub.name))
    .map((sub) => sub.name);
  const theorySubreddits = supabase ? await fetchTheorySubreddits(supabase) : fallbackTheory;
  const sources = buildSources(config, theorySubreddits);
  const known = await knownThreadIds(supabase);
  const todayCounts = await todaysCandidateCounts(supabase, now);
  const resolvedCatalog = catalog ?? (await loadCatalog());
  const pacingFile = path.resolve(pacingStatePath);
  const pacer = createPagePacer({
    runLimit: maxPages,
    initialLoads: dryRun ? [] : await loadPacingHistory(pacingFile),
    onLoad: dryRun ? undefined : (loads) => savePacingHistory(pacingFile, loads),
  });
  const playwright = launch ? null : await import('playwright');
  const browserLaunch = launch ?? ((options) => playwright.chromium.launch(options));
  const browser = await browserLaunch({ headless: true });
  const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.route('**/*', async (route) => {
    const request = route.request();
    if (request.resourceType() === 'document' && request.method() === 'GET') await route.continue();
    else await route.abort();
  });

  const listed = new Map();
  const theoryIds = new Set();
  const listingLimit = Math.min(sources.length, Math.max(1, maxPages - 1));
  try {
    for (const source of sources.slice(0, listingLimit)) {
      const posts = await readDocument(page, source, pacer, warn);
      for (const post of posts) {
        if (!post.subreddit && source.subreddit) post.subreddit = source.subreddit;
        if (!listed.has(post.id)) listed.set(post.id, post);
        if (source.theory) theoryIds.add(post.id);
      }
    }

    const candidates = selectAwarenessCandidates([...listed.values()], {
      config,
      catalog: resolvedCatalog,
      known,
      todayCounts,
      now,
    });
    const targetIds = [
      ...[...theoryIds].slice(0, 6),
      ...candidates.map((candidate) => candidate.post.id),
    ];
    const threads = [];
    for (const id of [...new Set(targetIds)]) {
      try {
        const thread = await readThread(page, listed.get(id), pacer, warn);
        if (thread) threads.push(thread);
      } catch (error) {
        if (error instanceof PageBudgetExceeded) break;
        throw error;
      }
    }

    const details = new Map(threads.map((thread) => [thread.post.id, thread.post]));
    const replyableCandidates = candidates.filter((candidate) => {
      const detail = details.get(candidate.post.id);
      return !detail?.locked && !detail?.archived;
    });
    if (!dryRun && listed.size === 0) {
      throw new Error('no Reddit listings parsed; refusing to write a healthy heartbeat');
    }
    const observedAt = now.toISOString();
    const rows = awarenessRows(replyableCandidates, observedAt);
    const crawlThreads = threads.filter((thread) => theoryIds.has(thread.post.id));
    const bundle = buildHomeCrawlBundle(crawlThreads, observedAt);
    const leadResult = await writeLeads(supabase, rows, { dryRun });
    await writeHomeCrawlBundle(path.resolve(outputPath), bundle, { dryRun });
    if (!dryRun) await writeHeartbeat(supabase, now);
    return {
      pages: pacer.stats().totalLoads,
      listed: listed.size,
      leads: rows.length,
      inserted: leadResult.inserted,
      scored: rows.filter((row) => row.score != null).length,
      commentCounts: rows.filter((row) => row.num_comments != null).length,
      aged: rows.filter((row) => row.thread_created_at != null).length,
      crawlThreads: crawlThreads.length,
      commentTreeThreads: crawlThreads.filter((thread) =>
        thread.comments.some((comment) => comment.depth != null),
      ).length,
      comments: crawlThreads.reduce((sum, thread) => sum + thread.comments.length, 0),
      bundle,
    };
  } finally {
    await browser.close();
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runReader(options);
  console.log(
    `home-reddit-reader: pages=${result.pages} listings=${result.listed} leads=${result.leads} inserted=${result.inserted} score=${result.scored} num_comments=${result.commentCounts} age=${result.aged} crawl_threads=${result.crawlThreads} comment_trees=${result.commentTreeThreads} comments=${result.comments}${options.dryRun ? ' (dry-run: no writes)' : ''}`,
  );
  return 0;
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'reader.mjs') {
  runMain(main, { name: 'home-reddit-reader' });
}
