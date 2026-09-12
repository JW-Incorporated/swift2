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
import { isPlausibleCritiqueTotal } from './lib/queue-schema.mjs';
import { aggregateLatency, aggregateVerdicts } from './lib/feedback.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const POSTED_DIR = path.join(ROOT, 'social', 'posted');
const METRICS_DIR = path.join(ROOT, 'social', 'metrics');
const FEEDBACK_DIR = path.join(ROOT, 'social', 'feedback');
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

/** T4 (docs/specs/tree-overhaul/t4-weekly-brief.md §Data lines 4-5): every
 * `social/feedback/*.jsonl` row, from every week file on disk — the 7-day
 * window that actually matters is applied afterward by `ts`, not by which
 * ISO-week file a row happens to sit in (a rolling 7-day window ending
 * "now" can span two ISO weeks, same reason `countPostsByPlatformSince`
 * doesn't align to calendar weeks either). */
export function fetchLedgerRows(dir = FEEDBACK_DIR) {
  let files;
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.jsonl')).sort();
  } catch {
    return [];
  }
  return files.flatMap((f) => {
    let text;
    try {
      text = readFileSync(path.join(dir, f), 'utf-8');
    } catch {
      return [];
    }
    return text
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  });
}

function rowsInWindow(rows, now, windowHours) {
  const cutoff = new Date(now).getTime() - windowHours * 60 * 60 * 1000;
  const end = new Date(now).getTime();
  return rows.filter((row) => {
    const at = Date.parse(row?.ts ?? '');
    return !Number.isNaN(at) && at > cutoff && at <= end;
  });
}

/**
 * The full scorecard: posts per platform over 7 days, follower deltas over
 * 7 days, failures over 7 days (target zero — Tree's charter already treats
 * a non-zero failed/ count as an incident, not a style miss), founder
 * verdicts over 7 days, and brief-to-verdict latency over 7 days.
 */
export function buildScorecard({ now = Date.now(), postedDir, failedDir, metricsDir, feedbackDir } = {}) {
  const posted = fetchPosted(postedDir);
  const failed = fetchFailed(failedDir);
  const series = fetchMetricsSeries(metricsDir);
  const ledgerRows = rowsInWindow(fetchLedgerRows(feedbackDir), now, WEEK_HOURS);

  const posts = countPostsByPlatformSince(posted, now, WEEK_HOURS);
  const failedRecent = failed.filter((f) => {
    // Real shape (social/failed/*.json): lastAttemptAt is the field that
    // actually exists; scheduledAt as a fallback for a record that somehow
    // lacks it rather than dropping it from the count silently.
    const at = new Date(f.lastAttemptAt || f.scheduledAt).getTime();
    return !Number.isNaN(at) && now - at <= WEEK_HOURS * 60 * 60 * 1000;
  });
  const { deltas, weekAgoDate } = weeklyFollowerDeltas(series, now);
  const verdicts = aggregateVerdicts(ledgerRows);
  const latency = aggregateLatency(ledgerRows);

  return { posts, failedCount: failedRecent.length, deltas, weekAgoDate, verdicts, latency };
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
 * The critique total for one `social/feedback/<week>.jsonl` row (Codex
 * round 1, MEDIUM 3). PRIMARY source is the ledger row's own `critiqueTotal`
 * — written ONCE, immutably, at stamp/reject time (social-approval-poll.mjs's
 * stampRow/rejectRow) — not a fallback: the whole point of recording it
 * there was to have a snapshot nothing can mutate after the fact, and a
 * rejected item's queue file is gone anyway (the ❌ deletes it), so the
 * ledger is its ONLY possible source. The still-on-disk item's current
 * `critique.total` (joined by `file` against `items`) is the FALLBACK, for
 * an older ledger row that predates `critiqueTotal` being recorded at all
 * — using the live item as primary let a corrupted or hand-edited
 * `critique.total` (e.g. `{ critique: { total: 999 } }`, live and mutable)
 * silently overrule the immutable snapshot. Both sources are bounds-checked
 * via `isPlausibleCritiqueTotal` before being trusted; `undefined` when
 * neither has a plausible number, so the row is excluded rather than
 * silently treated as a zero (or as 999).
 */
function critiqueTotalFor(row, itemsByFile) {
  if (isPlausibleCritiqueTotal(row.critiqueTotal)) return row.critiqueTotal;
  const fromItem = itemsByFile.get(row.file)?.critique?.total;
  return isPlausibleCritiqueTotal(fromItem) ? fromItem : undefined;
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

  // Round 6 review: a null prototype, not a plain `{}` — `row.action` is an
  // untrusted ledger-row value used directly as a key, and the `in` check
  // below walks the prototype chain, so `action: "constructor"` (a
  // corrupted/hand-edited ledger line) passed `!(row.action in byAction)`
  // and then crashed on `byAction[row.action].push(...)`, since
  // `Object.prototype.constructor` isn't an array. The exact same shape as
  // this round's PLATFORM_RULES/ACCOUNT_BY_PLATFORM fix, just via `in`
  // instead of a bracket lookup with a falsy-check.
  const byAction = Object.assign(Object.create(null), { approve: [], edit: [], reject: [] });
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

  // Codex round 1, MEDIUM 4: both sides of the comparison need real data —
  // 3+ rejections alone used to be enough to reach 'calibrated' even with
  // ZERO scored approvals (null spread math fell through to the final
  // `else`), which is nonsense: there is nothing to compare the rejections
  // against.
  let verdict;
  if (n < CALIBRATION_MIN_REJECTIONS || approvedMean === null) verdict = 'insufficient';
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
    // Two distinct reasons can land here (MEDIUM 4) — say which one honestly
    // rather than always blaming the rejection count.
    return c.approvedMean === null
      ? `Self-scoring: ${c.n} rejection${c.n === 1 ? '' : 's'} this week, but nothing approved yet to compare them against — not enough data to calibrate.`
      : `Self-scoring: not enough rejections to calibrate against yet (${c.n} this week).`;
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

const NO_DRAFTS_SENTENCE = 'no drafts went to you this week';

/** "3h 10m" / "19h" (spec §Data line 5's own example) — minutes omitted
 * when they round to zero, never a false "3h 0m" precision. */
function formatDuration(ms) {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

/** The verbatim block Tree pastes into its weekly PR body — never
 * paraphrased. Lines 1-3 are byte-identical to the pre-T4 3-line render for
 * the same fixture (spec AC#9 — a hard regression test, not a suggestion);
 * lines 4-5 are new (T4). `card.verdicts`/`card.latency` are optional so a
 * caller on the old 3-field shape still renders the honest empty-window
 * sentence rather than throwing. */
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
  const verdicts = card.verdicts;
  lines.push(
    verdicts && verdicts.total > 0
      ? `**Your verdicts:** ${verdicts.approve} ✅ · ${verdicts.edit} ✏️ · ${verdicts.reject} ❌ — ${verdicts.needsChangePct}% needed a change from you`
      : `**Your verdicts:** ${NO_DRAFTS_SENTENCE}`
  );
  const latency = card.latency;
  lines.push(
    latency
      ? `**Time to your answer:** median ${formatDuration(latency.median)}, slowest ${formatDuration(latency.slowest)}`
      : `**Time to your answer:** ${NO_DRAFTS_SENTENCE}`
  );
  return lines.join('\n');
}
