// Tree's weekly scorecard — Joey, 2026-08-23: "I want to know how much
// progress we've made, how many posts we've made on each social platform."
// Deterministic, reuses the exact same counting/delta logic Marjorie's daily
// brief already trusts (scripts/social/lib/growth.mjs) — no new claim
// mechanism, just a 7-day window instead of 24h. Same 2026-07-18 standing
// rule: every number here traces to a file on disk, never to Tree's own
// recall of what it posted.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { countPostsByPlatformSince, computeDeltas } from './lib/growth.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const POSTED_DIR = path.join(ROOT, 'social', 'posted');
const METRICS_DIR = path.join(ROOT, 'social', 'metrics');
const WEEK_HOURS = 7 * 24;

function readJsonDir(dir) {
  let files;
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  } catch {
    return [];
  }
  return files.map((f) => {
    try {
      return JSON.parse(readFileSync(path.join(dir, f), 'utf-8'));
    } catch {
      return null;
    }
  }).filter(Boolean);
}

export function fetchPosted(dir = POSTED_DIR) {
  return readJsonDir(dir);
}

export function fetchFailed(dir = path.join(ROOT, 'social', 'failed')) {
  return readJsonDir(dir);
}

/** Every daily metrics snapshot, oldest first — the full series, not just latest+previous. */
export function fetchMetricsSeries(dir = METRICS_DIR) {
  let files;
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  } catch {
    return [];
  }
  return files.map((f) => {
    try {
      return JSON.parse(readFileSync(path.join(dir, f), 'utf-8'));
    } catch {
      return null;
    }
  }).filter(Boolean);
}

/**
 * Follower deltas over the last 7 days — same `computeDeltas` shape as the
 * daily brief, but anchored to the snapshot ~7 days back (nearest one at or
 * before that point) rather than yesterday's. A series shorter than 7 days
 * returns `null` deltas rather than comparing against a snapshot that isn't
 * really a week old — labelled honestly, never silently wrong.
 */
export function weeklyFollowerDeltas(series, now = Date.now()) {
  if (series.length === 0) return { latest: null, deltas: null, weekAgoDate: null };
  const latest = series.at(-1);
  const cutoff = now - WEEK_HOURS * 60 * 60 * 1000;
  const weekAgo = [...series].reverse().find((s) => new Date(s.date).getTime() <= cutoff);
  if (!weekAgo) return { latest, deltas: null, weekAgoDate: null };
  return { latest, deltas: computeDeltas(latest.followers, weekAgo.followers), weekAgoDate: weekAgo.date };
}

/**
 * The full scorecard: posts per platform over 7 days, follower deltas over
 * 7 days, and failures over 7 days (target zero — Tree's charter already
 * treats a non-zero failed/ count as an incident, not a style miss).
 */
export function buildScorecard({ now = Date.now(), postedDir, failedDir, metricsDir } = {}) {
  const posted = fetchPosted(postedDir);
  const failed = fetchFailed(failedDir);
  const series = fetchMetricsSeries(metricsDir);

  const posts = countPostsByPlatformSince(posted, now, WEEK_HOURS);
  const failedRecent = failed.filter((f) => {
    // Real shape (social/failed/*.json): lastAttemptAt is the field that
    // actually exists; scheduledAt as a fallback for a record that somehow
    // lacks it rather than dropping it from the count silently.
    const at = new Date(f.lastAttemptAt || f.scheduledAt).getTime();
    return !Number.isNaN(at) && now - at <= WEEK_HOURS * 60 * 60 * 1000;
  });
  const { deltas, weekAgoDate } = weeklyFollowerDeltas(series, now);

  return { posts, failedCount: failedRecent.length, deltas, weekAgoDate };
}

// Tree Overhaul T2 (docs/specs/tree-overhaul/t2-self-critique.md §Data "The
// Monday calibration") — thresholds for judging whether Tree's own
// pre-hoc rubric scores actually predict the founder's post-hoc verdict.
const CALIBRATION_MIN_REJECTIONS = 3;
const CALIBRATION_SPREAD_THRESHOLD = 3.0;

function mean(values) {
  return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
}

/**
 * The critique total for one `social/feedback/<week>.jsonl` row: prefers
 * the still-on-disk item's own `critique.total` (joined by `file` against
 * `items`), falling back to the row's own `critiqueTotal` (written at
 * stamp/reject time — see social-approval-poll.mjs's stampRow/rejectRow) —
 * the fallback this exists for is a REJECTED item, whose queue file the ❌
 * deletes, leaving the ledger row as the only surviving record. `undefined`
 * when neither source has a number, so the row is excluded rather than
 * silently treated as a zero.
 */
function critiqueTotalFor(row, itemsByFile) {
  const fromItem = itemsByFile.get(row.file)?.critique?.total;
  return typeof fromItem === 'number' ? fromItem : row.critiqueTotal;
}

/**
 * Tree's self-score calibration: do the pre-hoc rubric scores in
 * `critique.total` actually predict the founder's ✅/✏️/❌ verdict?
 * Deterministic and read-only, like everything else in this file.
 *
 * `ledgerRows`: parsed `social/feedback/<week>.jsonl` rows (the caller
 * decides which week(s) to include) — only rows whose `file` starts with
 * `social/queue/` are drafts (a `reddit:<postId>` or `proposal:<n>` `file`
 * is a non-draft row per spec and is excluded here).
 * `items`: `{ file, critique }[]` — the still-on-disk queue/posted items to
 * join against by `file` (see critiqueTotalFor above).
 *
 * Returns `null` for any mean with zero rows in its bucket — never a
 * computed number over n<1 (spec: "never a computed number over n=1").
 * `n` is the rejection count, since that is what gates `verdict`.
 */
export function calibration({ ledgerRows = [], items = [] } = {}) {
  const itemsByFile = new Map(items.map((it) => [it.file, it]));
  const draftRows = ledgerRows.filter((row) => typeof row?.file === 'string' && row.file.startsWith('social/queue/'));

  const byAction = { approve: [], edit: [], reject: [] };
  for (const row of draftRows) {
    if (!(row.action in byAction)) continue;
    const total = critiqueTotalFor(row, itemsByFile);
    if (typeof total === 'number') byAction[row.action].push(total);
  }

  const approvedMean = mean(byAction.approve);
  const editedMean = mean(byAction.edit);
  const rejectedMean = mean(byAction.reject);
  const n = byAction.reject.length;

  const spread = approvedMean !== null && rejectedMean !== null ? approvedMean - rejectedMean : null;
  const aRejectionOutscoredApproved = approvedMean !== null && byAction.reject.some((total) => total > approvedMean);

  let verdict;
  if (n < CALIBRATION_MIN_REJECTIONS) verdict = 'insufficient';
  else if ((spread !== null && spread < CALIBRATION_SPREAD_THRESHOLD) || aRejectionOutscoredApproved) verdict = 'uncalibrated';
  else verdict = 'calibrated';

  return { approvedMean, editedMean, rejectedMean, spread, n, verdict };
}

function fmtMean(value, suffix) {
  return value === null ? null : `${value.toFixed(1)} ${suffix}`;
}

/** The verbatim block Tree pastes into its weekly PR body — never
 * paraphrased (same convention as renderScorecard above). The narrative
 * follow-up the spec calls for on an 'uncalibrated' verdict (naming the
 * specific item Tree got wrong and which dimension it over-scored) is
 * Tree's own judgment call in the plan PR, not something this deterministic
 * function can derive from numbers alone. */
export function renderCalibration(c) {
  if (c.verdict === 'insufficient') {
    return `Self-scoring: not enough rejections to calibrate against yet (${c.n} this week).`;
  }
  const parts = [
    fmtMean(c.approvedMean, 'on what you approved'),
    fmtMean(c.editedMean, 'on what you edited'),
    fmtMean(c.rejectedMean, `on the ${c.n} you rejected`),
  ].filter((p) => p !== null);
  const summary = parts.length > 0 ? `Self-scoring: mean ${parts.join(', ')}.` : 'Self-scoring: no scored items this week.';
  const spreadText = c.spread === null ? '' : ` Spread ${c.spread.toFixed(1)}`;
  if (c.verdict === 'calibrated') {
    return `${summary}${spreadText} — calibrated.`;
  }
  return `${summary}${spreadText} — thin. I am not yet distinguishing what you'll reject from what you'll approve.`;
}

function fmtDelta(n) {
  return typeof n === 'number' ? `${n >= 0 ? '+' : ''}${n}` : 'unknown';
}

/** The verbatim block Tree pastes into its weekly PR body — never paraphrased. */
export function renderScorecard(card) {
  const lines = [];
  lines.push(
    `**Posts this week:** X ${card.posts.x} · IG ${card.posts.instagram} · FB ${card.posts.facebook} (${card.posts.total} total)`
  );
  lines.push(
    card.deltas
      ? `**Follower change (7d, vs ${card.weekAgoDate}):** IG ${fmtDelta(card.deltas.instagram)} · X ${fmtDelta(card.deltas.x)} · FB ${fmtDelta(card.deltas.facebook)}`
      : '**Follower change (7d):** not enough metrics history yet to compare a week back'
  );
  lines.push(
    card.failedCount === 0
      ? '**Failed posts this week:** 0'
      : `**Failed posts this week:** ${card.failedCount} — target is zero, see \`social/failed/\` for what and why`
  );
  return lines.join('\n');
}
