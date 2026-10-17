#!/usr/bin/env node
// Anonymous, read-only home Reddit reader. Discovery is public RSS; detail is
// Reddit's public .json page. There is no login, OAuth, API key, or browser.
import path from 'node:path';
import { runMain } from '../../lib/cli.mjs';
import { serviceClient } from '../../lib/supabase.mjs';
import { loadConfig } from '../../community/awareness-config.mjs';
import { loadCatalog } from '../../community/awareness-image.mjs';
import { beginCircuitRun, CircuitTripError, closeCircuit } from './breaker.mjs';
import { createRequestPacer } from './pacing.mjs';
import { parseThreadJson } from './parsers.mjs';
import { buildReaderSources, detailUrl, parseDiscoveryFeed, selectTopThreads } from './sources.mjs';
import { createRedditTransport } from './transport.mjs';
import {
  awarenessRows,
  buildHomeCrawlBundle,
  fetchTheorySubreddits,
  knownThreadIds,
  selectAwarenessCandidates,
  todaysCandidateCounts,
  writeHeartbeat,
  writeHomeCrawlBundle,
  writeLeadMetrics,
  writeLeads,
} from './writers.mjs';

export const DEFAULT_MAX_THREADS = 20;
export const DEFAULT_OUTPUT = '.artifacts/home-reddit-crawl.json';
export const DEFAULT_CIRCUIT_STATE = '.artifacts/home-reddit-circuit.json';

function optionValue(argv, name) {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : null;
}

export function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const rawMax = optionValue(argv, '--max-threads');
  const maxThreads = rawMax == null ? DEFAULT_MAX_THREADS : Number(rawMax);
  if (!Number.isInteger(maxThreads) || maxThreads < 1 || maxThreads > DEFAULT_MAX_THREADS) {
    throw new Error('--max-threads must be an integer from 1 to 20');
  }
  const subreddit = optionValue(argv, '--subreddit');
  if (subreddit != null && !/^[A-Za-z0-9_]{2,32}$/.test(subreddit)) {
    throw new Error('--subreddit must be a Reddit community name');
  }
  if (subreddit && !dryRun) throw new Error('--subreddit is only available with --dry-run');
  return { dryRun, maxThreads, subreddit };
}

function fallbackTheorySubreddits(config) {
  return config.subs.filter((sub) => /theor/i.test(sub.name)).map((sub) => sub.name);
}

function statusLogger({ url, status }) {
  const parsed = new URL(url);
  console.log(`home-reddit-reader: GET ${parsed.pathname} HTTP ${status}`);
}

export async function runReader({
  dryRun = false,
  maxThreads = DEFAULT_MAX_THREADS,
  subreddit = null,
  supabase = dryRun ? null : serviceClient(),
  config = loadConfig(),
  catalog,
  outputPath = process.env.HOME_REDDIT_CRAWL_OUTPUT || DEFAULT_OUTPUT,
  circuitStatePath = process.env.HOME_REDDIT_CIRCUIT_STATE || DEFAULT_CIRCUIT_STATE,
  fetchImpl = fetch,
  pacer = createRequestPacer({
    onWait: (ms) => console.log(`home-reddit-reader: pacing ${ms}ms before next request`),
  }),
  now = new Date(),
  onStatus = statusLogger,
  warn = console.warn,
} = {}) {
  if (!dryRun && !supabase) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }
  const circuitFile = path.resolve(circuitStatePath);
  const gate = await beginCircuitRun(circuitFile);
  if (gate.skipped) {
    await writeHeartbeat(supabase, false, now);
    return {
      status: 'backoff',
      remainingSkips: gate.state.remainingSkips,
      backoffRuns: gate.state.backoffRuns,
    };
  }

  try {
    const theorySubreddits = supabase
      ? await fetchTheorySubreddits(supabase)
      : fallbackTheorySubreddits(config);
    const sources = buildReaderSources(config, theorySubreddits, { subreddit });
    const transport = createRedditTransport({
      circuitFile,
      pacer,
      fetchImpl,
      now: () => now,
      onStatus,
    });
    const discovered = [];
    for (const source of sources) {
      try {
        const posts = await parseDiscoveryFeed(await transport.rss(source.url), source);
        discovered.push(...posts);
      } catch (error) {
        if (error instanceof CircuitTripError) throw error;
        warn(`home-reddit-reader: skipping ${source.id} (${error.message})`);
      }
    }
    if (discovered.length === 0) throw new Error('no Reddit RSS threads parsed');
    const known = await knownThreadIds(supabase);
    const todayCounts = await todaysCandidateCounts(supabase, now);
    const resolvedCatalog = catalog ?? (await loadCatalog());
    const awarenessTargets = selectAwarenessCandidates(discovered, {
      config,
      catalog: resolvedCatalog,
      known: new Set(),
      todayCounts,
      now,
    });
    const targetPool = subreddit
      ? discovered
      : [
          ...discovered.filter((post) => post.theory),
          ...awarenessTargets.map((candidate) => candidate.post),
        ];
    if (targetPool.length === 0) throw new Error('no eligible Reddit threads found');
    const selected = selectTopThreads(targetPool, maxThreads);
    const threads = [];
    for (const listed of selected) {
      try {
        const parsed = parseThreadJson(await transport.json(detailUrl(listed)), { now });
        if (parsed.post.id !== listed.id) {
          throw new Error(`Reddit JSON thread id mismatch for ${listed.id}`);
        }
        threads.push({
          ...parsed,
          post: {
            ...parsed.post,
            title: parsed.post.title ?? listed.title,
            permalink: parsed.post.permalink ?? listed.permalink,
            subreddit: parsed.post.subreddit ?? listed.subreddit,
            rank: listed.rank,
            theory: listed.theory,
          },
        });
      } catch (error) {
        if (error instanceof CircuitTripError) throw error;
        warn(`home-reddit-reader: skipping thread ${listed.id} (${error.message})`);
      }
    }
    if (threads.length === 0) throw new Error('no Reddit JSON threads parsed');

    const posts = threads.map((thread) => thread.post);
    const details = new Map(posts.map((post) => [post.id, post]));
    const candidates = awarenessTargets
      .map((candidate) => {
        const post = details.get(candidate.post.id);
        return post ? { ...candidate, post } : null;
      })
      .filter(
        (candidate) =>
          candidate &&
          !known.has(candidate.post.id) &&
          !candidate.post.locked &&
          !candidate.post.archived,
      );
    const observedAt = now.toISOString();
    const rows = awarenessRows(candidates, observedAt);
    const bundle = buildHomeCrawlBundle(
      threads.filter((thread) => thread.post.theory),
      observedAt,
    );
    const leadResult = await writeLeads(supabase, rows, { dryRun });
    await writeLeadMetrics(supabase, posts, { dryRun, observedAt });
    await writeHomeCrawlBundle(path.resolve(outputPath), bundle, { dryRun });
    await closeCircuit(circuitFile);
    await writeHeartbeat(supabase, true, now);
    return {
      status: 'ok',
      rssFeeds: sources.length,
      discovered: discovered.length,
      detailed: threads.length,
      leads: rows.length,
      inserted: leadResult.inserted,
      scored: posts.filter((post) => post.score != null).length,
      commentCounts: posts.filter((post) => post.numComments != null).length,
      aged: posts.filter((post) => post.ageHours != null).length,
      crawlThreads: bundle.subreddits.reduce((sum, entry) => sum + entry.posts.length, 0),
      comments: threads.reduce((sum, thread) => sum + thread.comments.length, 0),
      threads,
      bundle,
    };
  } catch (error) {
    await writeHeartbeat(supabase, false, now);
    if (error instanceof CircuitTripError) {
      return { status: 'tripped', reason: error.reason, httpStatus: error.status };
    }
    throw error;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runReader(options);
  if (result.status === 'backoff') {
    console.log(
      `home-reddit-reader: breaker backoff; skipped run (${result.remainingSkips} skip(s) remain)`,
    );
    return 0;
  }
  if (result.status === 'tripped') {
    console.warn(
      `home-reddit-reader: breaker tripped${result.httpStatus ? ` on HTTP ${result.httpStatus}` : ''}; RSS fallback remains active (${result.reason})`,
    );
    return 0;
  }
  console.log(
    `home-reddit-reader: rss=${result.rssFeeds} discovered=${result.discovered} detailed=${result.detailed} leads=${result.leads} inserted=${result.inserted} score=${result.scored} num_comments=${result.commentCounts} age=${result.aged} crawl_threads=${result.crawlThreads} comments=${result.comments}${options.dryRun ? ' (dry-run: no DB or crawl-bundle writes)' : ''}`,
  );
  return 0;
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'reader.mjs') {
  runMain(main, { name: 'home-reddit-reader' });
}
