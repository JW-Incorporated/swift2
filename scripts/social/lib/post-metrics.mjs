// Per-post Instagram engagement (like_count/comments_count) — Tree Overhaul
// T3 (docs/plans/tree-overhaul/waves/wave-4-metrics.md). The write side
// (network + fs) lives in growth-snapshot.mjs, same split as lib/growth.mjs;
// this module is what's actually unit-tested: which social/posted/ items
// are due for a metrics fetch, the on-disk record shape, and the campaign/
// pillar aggregation weekly-scorecard.mjs renders into the Monday brief.
//
// Instagram-only, v1 (Step 0 research, spot-checked): `impressions` was
// killed by Meta for every IG media created after 2024-07-02 — dead, not
// gated. `reach`/`saved`/`shares` need the `instagram_manage_insights`
// scope, which the current IG_ACCESS_TOKEN doesn't carry (HUMAN-ACTIONS.md).
// X per-post reads are metered spend (~$0.005/read) with no free tier left
// at all — not this repo's call to make, so no X post ever reaches this
// module (HUMAN-ACTIONS.md). Never a per-post LLM call anywhere here.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pillarOf } from './feedback.mjs';

const WINDOW_DAYS_DEFAULT = 30;

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
 * not a repo-authored shape. `campaign` is carried here (not just in
 * social/posted/) so aggregateEngagement below never has to re-join the two
 * directories.
 */
export function buildPostMetricRecord(item, { like_count, comments_count, fetchedAt }) {
  return {
    postId: item.platformPostId,
    platform: item.platform,
    campaign: item.campaign ?? null,
    postedAt: item.postedAt,
    like_count: like_count ?? null,
    comments_count: comments_count ?? null,
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
    .map(([pillar, b]) => `${pillar} — ${b.like_count} likes/${b.comments_count} comments (${b.posts} post${b.posts === 1 ? '' : 's'})`);
  return `**Engagement by pillar (30d):** ${parts.join(' · ')}`;
}
