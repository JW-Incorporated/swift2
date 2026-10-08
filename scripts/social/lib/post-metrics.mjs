// Per-post Instagram engagement (like_count/comments_count) — Tree Overhaul
// T3 (docs/plans/tree-overhaul/waves/wave-4-metrics.md). The write side
// (network + fs) lives in growth-snapshot.mjs, same split as lib/growth.mjs;
// this module is what's actually unit-tested: which social/posted/ items
// are due for a metrics fetch, the on-disk record shape, and the campaign/
// pillar aggregation weekly-scorecard.mjs renders into the Monday brief.
//
// Instagram-only, v1 (Step 0 research, spot-checked): `impressions` was
// killed by Meta for every IG media created after 2024-07-02 — dead, not
// gated. `reach`/`saved`/`shares`/`total_interactions`/`views` come from
// `GET /{ig-media-id}/insights` and need the `instagram_manage_insights`
// scope, granted 2026-09-30 (HUMAN-ACTIONS #63); fetchMediaInsights below
// reads them and degrades to `null` per metric when one is unavailable
// (older media, a scope regression, a metric Meta gates for that media type).
// X per-post reads are metered spend (~$0.005/read) with no free tier left
// at all — not this repo's call to make, so no X post ever reaches this
// module (HUMAN-ACTIONS.md). Never a per-post LLM call anywhere here.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pillarOf } from './feedback.mjs';
import { GRAPH_VERSION } from './platforms.mjs';

const WINDOW_DAYS_DEFAULT = 30;

/** Graph API `/{ig-media-id}/insights` metric names, verbatim. `views`
 * replaced the retired `impressions`/`plays`. Order is the record's order. */
export const INSIGHT_METRICS = ['reach', 'saved', 'shares', 'total_interactions', 'views'];

function emptyInsights() {
  return Object.fromEntries(INSIGHT_METRICS.map((m) => [m, null]));
}

/**
 * Reads `{ data: [{ name, values: [{ value }] }] }` (the Graph API's
 * insights envelope) into `{ reach, saved, shares, total_interactions,
 * views }`. A metric Meta didn't return, or returned as a non-number, is
 * `null` — never 0, so "no reach data" can't be mistaken for "zero reach".
 */
export function parseInsights(body) {
  const out = emptyInsights();
  for (const row of Array.isArray(body?.data) ? body.data : []) {
    if (!INSIGHT_METRICS.includes(row?.name)) continue;
    const value = row?.values?.[0]?.value ?? row?.total_value?.value;
    if (typeof value === 'number' && Number.isFinite(value)) out[row.name] = value;
  }
  return out;
}

const hasAnyInsight = (insights) => INSIGHT_METRICS.some((m) => insights[m] !== null);

async function insightsCall(mediaId, metrics, { token, version, fetchImpl }) {
  const url = `https://graph.facebook.com/${version}/${mediaId}/insights?metric=${metrics.join(',')}&access_token=${encodeURIComponent(token)}`;
  const res = await fetchImpl(url);
  if (!res.ok) return null;
  return parseInsights(await res.json());
}

/**
 * Per-post reach/saves/shares for one IG media id. Never throws and never
 * returns a rejected promise: one batched call first; if Meta rejects the
 * batch (a single unsupported metric fails the whole request) each metric is
 * retried alone so the supported ones still land. Anything still missing is
 * `null`. A missing token yields all-`null` without a network call. The
 * token is never logged or put in an error.
 */
export async function fetchMediaInsights(mediaId, { token, version = GRAPH_VERSION, fetchImpl = fetch } = {}) {
  const result = emptyInsights();
  if (!token || !mediaId) return result;
  const ctx = { token, version, fetchImpl };
  try {
    const batch = await insightsCall(mediaId, INSIGHT_METRICS, ctx);
    if (batch && hasAnyInsight(batch)) return batch;
  } catch {
    // fall through to per-metric retries
  }
  for (const metric of INSIGHT_METRICS) {
    try {
      const one = await insightsCall(mediaId, [metric], ctx);
      if (one) result[metric] = one[metric];
    } catch {
      // this metric stays null
    }
  }
  return result;
}

/**
 * `social/posted/` items due for a per-post metrics fetch: Instagram only
 * (see the file header for why X isn't here), with a recorded
 * `platformPostId` (post-queue.mjs already writes this back on a successful
 * publish — two legacy items from before that field existed have none and
 * are simply never selected), posted within the last `windowDays` days of
 * `now`. A post that ages out of the window just stops being refreshed —
 * its last-written file under social/metrics/posts/ is left alone, never
 * deleted.
 */
export function selectInstagramPostsForMetrics(postedItems, { now = Date.now(), windowDays = WINDOW_DAYS_DEFAULT } = {}) {
  const end = new Date(now).getTime();
  const cutoff = end - windowDays * 24 * 60 * 60 * 1000;
  return (postedItems ?? []).filter((item) => {
    if (item?.platform !== 'instagram' || !item?.platformPostId) return false;
    const at = new Date(item.postedAt).getTime();
    return !Number.isNaN(at) && at > cutoff && at <= end;
  });
}

/**
 * Where one item's metrics file lives under `social/metrics/posts/` —
 * `<YYYY-MM>/<platformPostId>.json`. `yearMonth` comes from `postedAt` (the
 * month the post actually went out), not today's date, so a post keeps
 * writing to the same month's folder for its whole 30-day window.
 */
export function postMetricsLocation(item) {
  return { yearMonth: new Date(item.postedAt).toISOString().slice(0, 7), postId: item.platformPostId };
}

/**
 * The record written to `social/metrics/posts/<YYYY-MM>/<postId>.json`.
 * `like_count`/`comments_count` keep the Graph API's own field names
 * verbatim — a direct passthrough of what `GET /{ig-media-id}` returned,
 * not a repo-authored shape; `reach`/`saved`/`shares`/`total_interactions`/
 * `views` are likewise the `/insights` metric names (`null` when
 * unavailable). `campaign` is carried here (not just in
 * social/posted/) so aggregateEngagement below never has to re-join the two
 * directories.
 */
export function buildPostMetricRecord(item, { like_count, comments_count, fetchedAt, insights = {} }) {
  return {
    postId: item.platformPostId,
    platform: item.platform,
    campaign: item.campaign ?? null,
    postedAt: item.postedAt,
    like_count: like_count ?? null,
    comments_count: comments_count ?? null,
    reach: insights.reach ?? null,
    saved: insights.saved ?? null,
    shares: insights.shares ?? null,
    total_interactions: insights.total_interactions ?? null,
    views: insights.views ?? null,
    fetchedAt,
  };
}

/**
 * Every `social/metrics/posts/<YYYY-MM>/*.json` record on disk, oldest
 * month first. Lenient like every other reader in this pipeline (growth-
 * snapshot.mjs's readPostedItems, weekly-scorecard.mjs's fetchPosted): a
 * missing `posts/` directory (nothing has run yet) yields `[]`, an
 * unreadable month or a malformed file is skipped rather than throwing.
 */
export function readPostMetrics(dir) {
  let months;
  try {
    months = readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
  const out = [];
  for (const month of months) {
    let files;
    try {
      files = readdirSync(path.join(dir, month)).filter((f) => f.endsWith('.json'));
    } catch {
      continue;
    }
    for (const file of files) {
      try {
        out.push(JSON.parse(readFileSync(path.join(dir, month, file), 'utf-8')));
      } catch {
        // a malformed metrics file is skipped, not fatal to the rest
      }
    }
  }
  return out;
}

function emptyBucket() {
  return { posts: 0, like_count: 0, comments_count: 0 };
}

function addTo(buckets, key, fallbackLabel, record) {
  const k = key ?? fallbackLabel;
  if (!buckets[k]) buckets[k] = emptyBucket();
  buckets[k].posts += 1;
  buckets[k].like_count += record.like_count ?? 0;
  buckets[k].comments_count += record.comments_count ?? 0;
  if (typeof record.reach === 'number') {
    // insight fields appear only once a post in the bucket has them, so a
    // bucket with no insights keeps the original three-field shape.
    const b = buckets[k];
    b.insightPosts = (b.insightPosts ?? 0) + 1;
    b.reach = (b.reach ?? 0) + record.reach;
    b.saved = (b.saved ?? 0) + (record.saved ?? 0);
    b.shares = (b.shares ?? 0) + (record.shares ?? 0);
  }
}

const NO_CAMPAIGN_LABEL = '(none)';
const NO_PILLAR_LABEL = '(unrecognized)';

/**
 * Groups already-loaded per-post metric records two ways: `byCampaign` (the
 * literal `campaign` field — one bucket per real campaign, the specific
 * "type" of post) and `byPillar` (`pillarOf(campaign)` — feedback.mjs's own
 * coarser family grouping, never reimplemented here). Most of
 * social/posted/'s history predates the `launch:`/`thread:`/`timeline:`/
 * `mood:`/`heartbeat:` campaign-naming convention pillarOf recognizes, so
 * those land in `byPillar['(unrecognized)']` (pillarOf itself already logs
 * a `::warning::` for each) rather than being dropped.
 *
 * `byCampaign`/`byPillar` are null-prototype objects (same fix as
 * growth.mjs's countPostsByPlatformSince/feedback.mjs's aggregateVerdicts):
 * `campaign` comes from social/posted/*.json content, not a closed enum, so
 * a value of e.g. `"__proto__"` must land as an own data property, never
 * reassign the bucket object's actual prototype.
 */
export function aggregateEngagement(records) {
  const byCampaign = Object.create(null);
  const byPillar = Object.create(null);
  for (const record of records ?? []) {
    addTo(byCampaign, record?.campaign, NO_CAMPAIGN_LABEL, record);
    addTo(byPillar, pillarOf(record?.campaign), NO_PILLAR_LABEL, record);
  }
  return { totalPosts: (records ?? []).length, byCampaign, byPillar };
}

/** `readPostMetrics` + `aggregateEngagement` in one call — the single line
 * weekly-scorecard.mjs's buildScorecard wires in. */
export function buildEngagementSummary(dir) {
  return aggregateEngagement(readPostMetrics(dir));
}

const NO_ENGAGEMENT_SENTENCE = 'no Instagram post metrics on file yet for this window';

/**
 * Renders `byPillar` as the scorecard's one new line — bounded (a handful
 * of pillars, never one line per campaign) and sorted by like_count
 * descending. `byCampaign` stays in the object buildEngagementSummary
 * returns for anything that wants the finer-grained cut; the rendered
 * brief line only needs the pillar rollup.
 */
export function renderEngagement(summary) {
  const entries = Object.entries(summary?.byPillar ?? {});
  if (entries.length === 0) return `**Engagement by pillar (30d):** ${NO_ENGAGEMENT_SENTENCE}`;
  const parts = entries
    .sort((a, b) => b[1].like_count - a[1].like_count)
    .map(([pillar, b]) => `${pillar} — ${b.like_count} likes/${b.comments_count} comments${b.insightPosts ? `/${b.reach} reach/${b.saved} saves/${b.shares} shares` : ''} (${b.posts} post${b.posts === 1 ? '' : 's'})`);
  return `**Engagement by pillar (30d):** ${parts.join(' · ')}`;
}
