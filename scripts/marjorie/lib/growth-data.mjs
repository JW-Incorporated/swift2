// Pure half of the weekly growth collector (docs/plans/bots-v2/PLAN.md, W5).
// Deterministic: every number traces to a file on disk or a GitHub row passed
// in — nothing here reads a clock, a network or an LLM, so the weekly Fable
// review (docs/agents/runner-prompts/marjorie-weekly-review.md) judges
// evidence it cannot have misremembered. I/O lives in ../growth-data.mjs.
import { computeDeltas, countPostsByPlatformSince } from '../../social/lib/growth.mjs';

export const DAY_MS = 86_400_000;
export const WEEK_MS = 7 * DAY_MS;
export const PLATFORMS = ['x', 'instagram', 'facebook'];

/** `weekEnding` is a UTC `YYYY-MM-DD` (inclusive) or omitted (= `nowMs`). */
export function weekWindow(weekEnding, nowMs) {
  const endMs = weekEnding ? Date.parse(`${weekEnding}T23:59:59.999Z`) : nowMs;
  if (!Number.isFinite(endMs)) throw new Error(`bad --week-ending: ${weekEnding}`);
  return { startMs: endMs - WEEK_MS, endMs, start: new Date(endMs - WEEK_MS).toISOString(), end: new Date(endMs).toISOString() };
}

const shift = (win, ms) => ({ ...win, startMs: win.startMs - ms, endMs: win.endMs - ms });

// A snapshot is taken ~11:00 UTC; anchor it at midday of its date.
const snapMs = (snap) => Date.parse(`${snap?.date}T12:00:00Z`);

/**
 * Follower counts at the window's two edges, per platform. The start edge is
 * the newest snapshot at or before `startMs`; with none (a young series) it
 * falls back to the oldest snapshot inside the window and says so
 * (`partial`). A platform missing either side yields `null`, never 0.
 */
export function followerDeltas(series, { startMs, endMs }) {
  const sorted = (series || []).filter((s) => Number.isFinite(snapMs(s))).sort((a, b) => snapMs(a) - snapMs(b));
  const end = [...sorted].reverse().find((s) => snapMs(s) <= endMs) ?? null;
  let start = [...sorted].reverse().find((s) => snapMs(s) <= startMs) ?? null;
  let partial = false;
  if (!start && end) {
    start = sorted.find((s) => snapMs(s) > startMs && snapMs(s) <= endMs) ?? null;
    partial = true;
  }
  const out = { startDate: start?.date ?? null, endDate: end?.date ?? null, partial: partial || !start, platforms: {} };
  const deltas = end && start && start !== end ? computeDeltas(end.followers || {}, start.followers || {}) : {};
  for (const p of PLATFORMS) {
    const e = end?.followers?.[p];
    const s = start?.followers?.[p];
    out.platforms[p] = { start: typeof s === 'number' ? s : null, end: typeof e === 'number' ? e : null, delta: deltas[p] ?? null };
  }
  return out;
}

const inWindow = (iso, { startMs, endMs }) => {
  const at = Date.parse(iso ?? '');
  return Number.isFinite(at) && at > startMs && at <= endMs;
};

/** Posts published this week (and the week before, for trend) plus engagement. */
export function postsSummary(posted, postMetrics, win) {
  const count = (w) => ({ ...countPostsByPlatformSince(posted || [], w.endMs, 168) });
  const items = (posted || [])
    .filter((p) => inWindow(p.postedAt, win))
    .sort((a, b) => Date.parse(a.postedAt) - Date.parse(b.postedAt))
    .map((p) => ({ platform: p.platform, postedAt: p.postedAt, campaign: p.campaign ?? null }));
  const measured = (postMetrics || []).filter((m) => inWindow(m.postedAt, win));
  const engagement = measured.reduce((a, m) => ({ likes: a.likes + (m.like_count || 0), comments: a.comments + (m.comments_count || 0) }), { likes: 0, comments: 0 });
  const top = [...measured].sort((a, b) => (b.like_count || 0) + (b.comments_count || 0) - (a.like_count || 0) - (a.comments_count || 0))[0];
  return {
    thisWeek: count(win),
    previousWeek: count(shift(win, WEEK_MS)),
    items: items.slice(-30),
    engagement: { measuredPosts: measured.length, ...engagement, top: top && (top.like_count || top.comments_count) ? { platform: top.platform, campaign: top.campaign ?? null, likes: top.like_count || 0, comments: top.comments_count || 0 } : null },
  };
}

/** Merged content PRs → the eras they touched (`withFiles` = fetchContentShipped output). */
export function contentSummary(withFiles, erasTouched) {
  const items = (withFiles || []).map(({ pr, files }) => ({
    number: pr.number,
    title: String(pr.title || '').slice(0, 100),
    mergedAt: pr.mergedAt ?? null,
    eras: erasTouched(files).eras,
    files: files.length,
  }));
  return { mergedContentPRs: items.length, items };
}

export const TRAFFIC_NOTE =
  'No read-only site-traffic source is wired. @vercel/analytics is client-only (apps/web/app/layout.tsx); ' +
  'no documented read API for Vercel Web Analytics data was found, and the repo secret VERCEL_TOKEN ' +
  '(names checked via gh secret list) is used only for deployment status. Human action: choose a read-only ' +
  'analytics source (see the W5 report) before traffic can be reported.';

/** Traffic is `null` until a real source exists — never an estimate. */
export function trafficSection() {
  return { traffic: null, trafficNote: TRAFFIC_NOTE };
}

export function buildGrowthData({ win, series, posted, postMetrics, content, coverage, treeAsks, eventStatus, warnings = [] }) {
  return {
    generatedFor: { start: win.start, end: win.end, days: 7 },
    followers: followerDeltas(series, win),
    followersPreviousWeek: followerDeltas(series, shift(win, WEEK_MS)),
    posts: postsSummary(posted, postMetrics, win),
    contentShipped: content,
    timeSensitive: coverage,
    treeAsks,
    eventStatus: eventStatus ?? null,
    ...trafficSection(),
    warnings,
  };
}
