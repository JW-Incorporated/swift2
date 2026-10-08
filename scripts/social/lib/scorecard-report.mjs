// Per-format / per-campaign performance report behind
// `node scripts/social/weekly-scorecard.mjs [--week YYYY-Www] [--json]` (S3,
// issue #4297). Pure: callers pass already-loaded posted items, per-post
// metric records (lib/post-metrics.mjs) and feedback-ledger rows, so every
// number traces to a file on disk. "Format" is the campaign family (the
// first `:` segment — thread/timeline/mood/heartbeat/launch, which is also
// the `utm_campaign` value on Tree's links); "campaign" is the pillar
// (feedback.mjs pillarOf). A metric Meta didn't return stays `null` and
// renders as "n/a", never 0.
import { pillarOf } from './feedback.mjs';

const DAY_MS = 86_400_000;
const NONE_GIVEN = 'none given';
const TOP_REASONS = 5;
const REASON_MAX = 120;
const KNOWN_FAMILIES = ['launch', 'thread', 'timeline', 'mood', 'heartbeat'];
const NO_FORMAT = '(unrecognized)';

/** Monday 00:00 UTC of ISO week `YYYY-Www`, plus the next Monday; throws on a malformed label. */
export function isoWeekWindow(label) {
  const m = /^(\d{4})-W(\d{2})$/.exec(String(label ?? ''));
  if (!m) throw new Error(`bad --week: ${label} (expected YYYY-Www, e.g. 2026-W40)`);
  const year = Number(m[1]);
  const week = Number(m[2]);
  if (week < 1 || week > 53) throw new Error(`bad --week: ${label} (week must be 01-53)`);
  const jan4 = Date.UTC(year, 0, 4);
  const jan4Day = new Date(jan4).getUTCDay() || 7;
  const startMs = jan4 - (jan4Day - 1) * DAY_MS + (week - 1) * 7 * DAY_MS;
  return { startMs, endMs: startMs + 7 * DAY_MS, label };
}

export function familyOf(campaign) {
  if (typeof campaign !== 'string') return NO_FORMAT;
  const head = campaign.split(':')[0];
  return KNOWN_FAMILIES.includes(head) ? head : NO_FORMAT;
}

function campaignOf(campaign) {
  return (typeof campaign === 'string' ? pillarOf(campaign) : null) ?? NO_FORMAT;
}

const inWindow = (iso, { startMs, endMs }) => {
  const at = Date.parse(iso ?? '');
  return Number.isFinite(at) && at >= startMs && at < endMs;
};

function bucket() {
  return { posts: 0, measuredPosts: 0, reach: null, saved: null, shares: null, likes: 0, comments: 0, approve: 0, edit: 0, reject: 0, reasons: [] };
}

function addNum(b, key, v) {
  if (typeof v === 'number') b[key] = (b[key] ?? 0) + v;
}

function finish(b) {
  const total = b.approve + b.edit + b.reject;
  const { reasons, ...rest } = b;
  return { ...rest, verdicts: total, approvalRate: total === 0 ? null : Math.round((b.approve / total) * 100), rejectionReasons: summarizeReasons(reasons) };
}

/** Groups reason text case-insensitively; `none given` is counted but never listed as a reason. */
export function summarizeReasons(reasons) {
  const counts = new Map();
  let noneGiven = 0;
  for (const raw of reasons) {
    const text = String(raw ?? '').replace(/\s+/g, ' ').trim();
    if (!text || text.toLowerCase() === NONE_GIVEN) { noneGiven += 1; continue; }
    const key = text.toLowerCase();
    const cur = counts.get(key) ?? { reason: text.slice(0, REASON_MAX), count: 0 };
    cur.count += 1;
    counts.set(key, cur);
  }
  const top = [...counts.values()].sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason)).slice(0, TOP_REASONS);
  return { top, noneGiven };
}

function collect(keyOf, { posted, postMetrics, ledgerRows }, window) {
  const map = Object.create(null);
  const at = (key) => (map[key] ??= bucket());
  for (const p of posted ?? []) if (inWindow(p?.postedAt, window)) at(keyOf(p.campaign, p)).posts += 1;
  for (const m of postMetrics ?? []) {
    if (!inWindow(m?.postedAt, window)) continue;
    const b = at(keyOf(m.campaign, m));
    b.measuredPosts += 1;
    b.likes += m.like_count ?? 0;
    b.comments += m.comments_count ?? 0;
    addNum(b, 'reach', m.reach);
    addNum(b, 'saved', m.saved);
    addNum(b, 'shares', m.shares);
  }
  for (const row of ledgerRows ?? []) {
    if (typeof row?.file !== 'string' || !row.file.startsWith('social/queue/') || !inWindow(row.ts, window)) continue;
    if (!['approve', 'edit', 'reject'].includes(row.action)) continue;
    const b = at(keyOf(row.campaign, row));
    b[row.action] += 1;
    if (row.action !== 'approve') b.reasons.push(row.reason);
  }
  return Object.fromEntries(Object.entries(map).map(([k, b]) => [k, finish(b)]));
}

/**
 * `calibration` is the already-computed `calibration()` result (it lives in
 * weekly-scorecard.mjs, which imports this module). Returns
 * `{ window, byFormat, byCampaign, overall, calibration }`.
 */
export function buildPerformanceReport({ posted, postMetrics, ledgerRows, calibration = null, window }) {
  const data = { posted, postMetrics, ledgerRows };
  const byFormat = collect((campaign) => familyOf(campaign), data, window);
  const byCampaign = collect((campaign, src) => (typeof src?.pillar === 'string' && src.pillar ? src.pillar : campaignOf(campaign)), data, window);
  const overall = Object.values(byFormat).reduce((acc, f) => {
    for (const k of ['posts', 'measuredPosts', 'likes', 'comments', 'approve', 'edit', 'reject']) acc[k] += f[k];
    for (const k of ['reach', 'saved', 'shares']) addNum(acc, k, f[k]);
    return acc;
  }, bucket());
  const allReasons = [];
  for (const row of ledgerRows ?? []) {
    if (typeof row?.file === 'string' && row.file.startsWith('social/queue/') && inWindow(row.ts, window) && ['edit', 'reject'].includes(row.action)) allReasons.push(row.reason);
  }
  const rest = { ...overall };
  delete rest.reasons;
  const verdicts = rest.approve + rest.edit + rest.reject;
  return {
    window: { label: window.label ?? null, start: new Date(window.startMs).toISOString(), end: new Date(window.endMs).toISOString() },
    byFormat,
    byCampaign,
    overall: { ...rest, verdicts, approvalRate: verdicts === 0 ? null : Math.round((rest.approve / verdicts) * 100), rejectionReasons: summarizeReasons(allReasons) },
    calibration,
  };
}

const n = (v) => (v === null || v === undefined ? 'n/a' : String(v));
const rate = (b) => (b.approvalRate === null ? 'n/a' : `${b.approvalRate}% (${b.approve}/${b.verdicts})`);

function row(name, b) {
  return `${name} | ${b.posts} | ${n(b.reach)} | ${n(b.saved)} | ${n(b.shares)} | ${b.likes}/${b.comments} | ${rate(b)}`;
}

/** Plain-text table block for the Monday brief / chat; paste verbatim. */
export function renderPerformanceReport(report) {
  const { window, byFormat, byCampaign, overall, calibration } = report;
  const head = 'name | posts | reach | saves | shares | likes/comments | founder approval';
  const sorted = (o) => Object.entries(o).sort((a, b) => b[1].posts - a[1].posts || a[0].localeCompare(b[0]));
  const lines = [`**Performance, ${window.label ?? 'trailing 7 days'} (${window.start.slice(0, 10)} to ${window.end.slice(0, 10)}):**`, '', 'By format', head];
  const formats = sorted(byFormat);
  lines.push(...(formats.length ? formats.map(([k, b]) => row(k, b)) : ['(no activity this window)']));
  lines.push('', 'By campaign', head);
  const camps = sorted(byCampaign);
  lines.push(...(camps.length ? camps.map(([k, b]) => row(k, b)) : ['(no activity this window)']));
  lines.push('', `Total: ${row('all', overall)}`);
  lines.push('(reach/saves/shares are n/a for a post with no Instagram insights on file; X posts never have them)');
  const r = overall.rejectionReasons;
  lines.push('', r.top.length || r.noneGiven ? `Rejection/edit reasons: ${[...r.top.map((x) => `"${x.reason}" x${x.count}`), ...(r.noneGiven ? [`no reason given x${r.noneGiven}`] : [])].join('; ')}` : 'Rejection/edit reasons: none this window');
  if (calibration && calibration.verdict !== 'insufficient') {
    lines.push(`Self-score calibration: ${calibration.verdict} (approved mean ${n(calibration.approvedMean?.toFixed?.(1) ?? null)}, rejected mean ${n(calibration.rejectedMean?.toFixed?.(1) ?? null)}, ${calibration.n} rejections)`);
  } else if (calibration) {
    lines.push(`Self-score calibration: insufficient data (${calibration.n} rejections)`);
  }
  return lines.join('\n');
}
