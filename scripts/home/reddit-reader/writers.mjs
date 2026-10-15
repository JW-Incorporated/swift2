import { buildAwarenessRow, fetchTodaysCandidateCounts } from '../../community/awareness-rows.mjs';
import { evaluateThread, scoreCandidate } from '../../community/awareness-filters.mjs';
import { pickImageRef } from '../../community/awareness-image.mjs';
import { acceptHomeBundle, writeCrawlBundle } from '../../community/crawl-bundle.mjs';
import { fetchKnownThreadIds, insertLeads } from '../../community/scan.mjs';
import { HOME_REDDIT_HEARTBEAT } from '../../community/awareness-heartbeat.mjs';

export async function fetchTheorySubreddits(supabase) {
  const { data, error } = await supabase
    .from('community_watchlist')
    .select('id, name')
    .eq('platform', 'reddit')
    .eq('crawl', true);
  if (error) throw error;
  return (data ?? [])
    .map((row) => row.name || String(row.id).replace(/^reddit:/, ''))
    .filter(Boolean);
}

export async function knownThreadIds(supabase) {
  return supabase ? fetchKnownThreadIds(supabase) : new Set();
}

export async function todaysCandidateCounts(supabase, now) {
  return supabase ? fetchTodaysCandidateCounts(supabase, now) : {};
}

export function selectAwarenessCandidates(
  posts,
  { config, catalog, known = new Set(), todayCounts = {}, now = new Date(), runCap = 6 } = {},
) {
  const bySub = new Map(config.subs.map((sub) => [sub.name.toLowerCase(), sub]));
  const excluded = new Set(config.excluded.map((sub) => sub.name.toLowerCase()));
  const blocked = new Set((config.search?.blockSubs ?? []).map((sub) => sub.toLowerCase()));
  const perSub = new Map();
  const candidates = [];
  for (const post of posts) {
    const subreddit = post.subreddit || 'unknown';
    const key = subreddit.toLowerCase();
    if (excluded.has(key) || blocked.has(key) || known.has(post.id)) continue;
    const configured = bySub.get(key);
    const sub = configured ?? { name: subreddit, tier: 1, requireTaylor: 'strict' };
    const verdict = evaluateThread(post, sub, { now, maxAgeHours: config.defaults.maxAgeHours });
    if (!verdict.ok) continue;
    const used = perSub.get(key) ?? 0;
    const dailyCap = configured?.dailyCap ?? config.defaults.perSubDailyDeliveryCap ?? 3;
    const dailyRoom = Math.max(0, dailyCap + 1 - (todayCounts[subreddit] ?? 0));
    if (used >= Math.min(config.defaults.perSubScanCapPerRun ?? 2, dailyRoom)) continue;
    perSub.set(key, used + 1);
    candidates.push({
      subreddit,
      post,
      types: verdict.types,
      ageHours: verdict.ageHours,
      imageRef: pickImageRef(post.title, catalog).ref,
      imageComments: configured?.imageComments ?? 'unknown',
      candidateScore: scoreCandidate(
        { types: verdict.types, rank: post.rank, ageHours: verdict.ageHours },
        sub,
      ),
    });
  }
  return candidates.sort((a, b) => b.candidateScore - a.candidateScore).slice(0, runCap);
}

export function awarenessRows(candidates, observedAt) {
  return candidates.map((candidate) =>
    buildAwarenessRow({ ...candidate, observedAt, replyUnverified: true }),
  );
}

export async function writeLeads(supabase, rows, { dryRun = false } = {}) {
  if (dryRun || rows.length === 0) return { inserted: 0, duplicates: 0 };
  return insertLeads(supabase, rows);
}

export function buildHomeCrawlBundle(threads, generatedAt = new Date().toISOString()) {
  const groups = new Map();
  for (const thread of threads) {
    const subreddit = `reddit:${thread.post.subreddit}`;
    if (!groups.has(subreddit)) groups.set(subreddit, []);
    groups.get(subreddit).push({
      subreddit,
      postId: thread.post.id,
      title: thread.post.title,
      permalink: thread.post.permalink,
      createdAt: thread.post.createdAt,
      rank: thread.post.rank,
      depth: thread.comments.length > 0 ? 'full' : 'partial',
      comments: thread.comments,
    });
  }
  return acceptHomeBundle({
    generatedAt,
    subreddits: [...groups].map(([subreddit, posts]) => ({ subreddit, posts })),
  });
}

export async function writeHomeCrawlBundle(file, bundle, { dryRun = false } = {}) {
  if (!dryRun) await writeCrawlBundle(file, bundle);
}

export async function writeHeartbeat(supabase, at = new Date()) {
  const { error } = await supabase
    .from('ops_switches')
    .upsert(
      { name: HOME_REDDIT_HEARTBEAT, enabled: true, updated_at: at.toISOString() },
      { onConflict: 'name' },
    );
  if (error) throw error;
}
