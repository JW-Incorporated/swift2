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
