// Pure logic for the daily growth snapshot — kept separate from the
// network/filesystem code in growth-snapshot.mjs so it's unit-testable.
// See docs/agents/growth.md and the 2026-07-17 growth-snapshot decision
// for what this feeds (the Founders' Brief's Growth bullet).

import { utcDateOnly } from './queue.mjs';

/** Counts social/posted/**.json entries whose postedAt falls on `date` (YYYY-MM-DD, UTC). */
export function countPostsOn(postedItems, date) {
  return postedItems.filter((item) => utcDateOnly(item.postedAt) === date).length;
}

/**
 * Posts published in the 24h ending at `now`, split per platform plus a
 * `total`.
 *
 * Replaces `countPostsOn` as what the brief reports, because "today so far"
 * was structurally wrong here (2026-08-11): growth-snapshot.yml runs at 11:05
 * UTC and the entire posting cadence is scheduled 23:00–23:20 UTC, so the
 * day's posts land ~12 hours AFTER the snapshot that's supposed to count
 * them. Every snapshot from 2026-08-08 on read `postsToday: 0` while the
 * poster was in fact shipping to X and Instagram nightly — which is what made
 * the 2026-08-11 brief say "0 posts" and read as a dead X poster. A rolling
 * 24h window is invariant to what time of day this runs.
 *
 * Per-platform because the old single number couldn't answer the question
 * anyone actually asks of it ("is X posting?") — it summed all platforms, so
 * a totally dark X was invisible behind Instagram's cadence.
 */
export function countPostsByPlatformSince(postedItems, now, windowHours = 24) {
  const cutoff = new Date(now).getTime() - windowHours * 60 * 60 * 1000;
  const end = new Date(now).getTime();
  const counts = { total: 0, x: 0, instagram: 0, facebook: 0 };
  for (const item of postedItems) {
    const at = new Date(item.postedAt).getTime();
    if (Number.isNaN(at) || at <= cutoff || at > end) continue;
    counts.total += 1;
    if (item.platform in counts) counts[item.platform] += 1;
    // An Instagram post that also cross-posted to the Facebook Page is one
    // approved item but two real published posts — count the Facebook one so
    // a Page that stopped accepting cross-posts is visible as FB going to 0.
    if (item.facebookPostId) {
      counts.facebook += 1;
      counts.total += 1;
    }
  }
  return counts;
}

/**
 * Per-platform delta between today's and the most recent prior snapshot's
 * follower counts. A platform missing from either snapshot (API hiccup, or
 * this is day one) yields `null` rather than a misleading 0 — the brief
 * distinguishes "flat" from "unknown".
 */
export function computeDeltas(todayFollowers, previousFollowers) {
  const deltas = {};
  for (const platform of Object.keys(todayFollowers)) {
    const today = todayFollowers[platform];
    const prev = previousFollowers?.[platform];
    deltas[platform] = typeof today === 'number' && typeof prev === 'number' ? today - prev : null;
  }
  return deltas;
}

/**
 * Missing days in the social/metrics/ daily series, from the earliest
 * snapshot present through `through` (a YYYY-MM-DD, normally today).
 *
 * Added 2026-08-11 after the series turned out to have a ~25% hole nobody
 * had noticed: 20 files from 07-18 to 08-11 with five days missing. The
 * causes were two entirely different things, which is the point — a daily
 * series needs a continuity check, not a per-cause alarm:
 *
 *   - 07-30, 07-31: a repo-wide GitHub Actions outage. Every scheduled
 *     workflow in the repo failed in under 5 seconds with no steps run
 *     (growth-snapshot, social-poster, watchdog, brief-mailer, news-worker,
 *     marjorie-inbox). Nothing here was broken and nothing here could have
 *     retried its way out.
 *   - 08-02, 08-03, 08-04: the snapshot ran and SUCCEEDED all three days.
 *     Its auto-merge PRs (#1729, #1754, #1775) then sat open for 7-9 days
 *     because their required `build` check never got triggered, so the data
 *     never reached main — which is the only place Marjorie's brief reads
 *     it from. They were finally merged 2026-08-11T15:44Z. A green workflow
 *     whose output never lands is the worst of the two failure modes: every
 *     signal said fine.
 *
 * Reported, never fatal: a historical hole must not stop today's snapshot
 * from being written and committed.
 */
export function findSeriesGaps(dates, through) {
  const present = new Set(dates);
  const sorted = [...present].sort();
  if (!sorted.length) return [];

  const gaps = [];
  const cursor = new Date(`${sorted[0]}T00:00:00Z`);
  const end = new Date(`${through}T00:00:00Z`);
  while (cursor.getTime() <= end.getTime()) {
    const day = cursor.toISOString().slice(0, 10);
    if (!present.has(day)) gaps.push(day);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return gaps;
}

/** Gaps within the last `days` ending at `through` — the actionable subset.
 * An old hole is history; a hole in the last week means the pipeline may be
 * broken right now. */
export function recentGaps(gaps, through, days = 7) {
  const cutoff = new Date(`${through}T00:00:00Z`).getTime() - (days - 1) * 24 * 60 * 60 * 1000;
  return gaps.filter((day) => new Date(`${day}T00:00:00Z`).getTime() >= cutoff);
}

/**
 * Assembles the snapshot object written to social/metrics/YYYY-MM-DD.json.
 * `postsToday` is retained (same meaning as before) so older readers and the
 * existing metrics history stay valid; `postsLast24h` is what the brief now
 * reports — see countPostsByPlatformSince for why.
 *
 * `seriesGaps` is written into the file itself, not only logged, so the hole
 * is visible to every reader of the metrics directory (the brief, a human
 * scrolling the folder, any later analysis) rather than only to whoever
 * happens to open one 25-minute-old Action log. Omitted entirely when the
 * series is whole, so a clean history stays clean on disk.
 */
export function buildSnapshot({ date, followers, postsToday, postsLast24h, seriesGaps }) {
  return {
    date,
    followers,
    postsToday,
    ...(postsLast24h ? { postsLast24h } : {}),
    ...(seriesGaps?.length ? { seriesGaps } : {}),
  };
}
