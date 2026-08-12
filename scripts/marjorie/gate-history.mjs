// The launch-gate time series — the raw material the "days to done" estimator
// runs on.
//
// `docs/launch-readiness.md` is the goalpost, and git already stores every
// version of it. So the org's real progress history costs nothing to
// reconstruct: walk the file's commits, parse the status column out of each
// version, and you have a dated series of gate states. No LLM, no API, no
// ledger file to drift out of sync with reality.
//
// WHY A SERIES AND NOT JUST "N GREEN": three gates have ever gone green in a
// month. Three events is not enough to estimate anything. Statuses move
// 🔴 → 🟡 → 🟢, though, and *those* transitions are frequent enough to
// measure. So progress is scored in GATE-POINTS: 🔴 = 0, 🟡 = 0.5, 🟢 = 1.0,
// and "done" is 12.0 points. Partial credit is not a fudge — it is the
// difference between an estimator with 3 data points and one with ~20.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const READINESS_PATH = 'docs/launch-readiness.md';

/** Canonical gate names, in the file's order. */
export const GATES = [
  'DEPTH', 'VOICE', 'WORTHY', 'SONGS', 'SCAN', 'ERRORS',
  'ALARMS', 'LEGAL', 'BACKUPS', 'PLUMBING', 'CAMPAIGN', 'MOBILE',
];

// Gates were renamed from letter codes on 2026-07-15 (Joey: "G" literally just
// meant "gate"). History before that commit uses the old codes; without this
// map the series would show all 12 gates vanishing and 12 new ones appearing.
export const LEGACY_GATE_NAMES = {
  'G-A': 'DEPTH', 'G-B': 'VOICE', 'G-C': 'WORTHY', 'G-D': 'SONGS',
  'G-E': 'SCAN', 'G-F': 'ERRORS', 'G-G': 'ALARMS', 'G-H': 'LEGAL',
  'G-I': 'BACKUPS', 'G-J': 'PLUMBING', 'G-K': 'CAMPAIGN', 'G-L': 'MOBILE',
};

export const STATUS_POINTS = { green: 1, yellow: 0.5, red: 0 };
export const TOTAL_POINTS = GATES.length; // 12.0 == launched

const GATE_ROW = new RegExp(`^\\|\\s*(G-[A-L]|${GATES.join('|')})\\s*\\|`);

function statusOf(cell) {
  if (/🟢/.test(cell)) return 'green';
  if (/🟡/.test(cell)) return 'yellow';
  if (/🔴/.test(cell)) return 'red';
  return null;
}

/**
 * Parse the gate status table out of a launch-readiness.md body.
 *
 * Returns `{ GATE: { status, nextAction } }`.
 *
 * Three traps this deliberately avoids, the first two of which produced wrong
 * numbers in a first cut of this parser:
 *
 *  1. The file contains a SECOND table ("What each gate means") keyed by the
 *     same gate names but with only 3 columns and no status emoji. Rows with
 *     fewer than 5 pipe-delimited fields are skipped.
 *  2. Prose inside the *description* column routinely contains an emoji —
 *     CAMPAIGN's cell literally reads "Remaining to 🟢: footer icons". Taking
 *     "the first emoji in the row" scored CAMPAIGN as done while the file said
 *     🟡. The status is read from a known column index, never by search.
 *  3. The table's columns are not fixed forever: #1928 (merged 2026-08-12)
 *     rebuilt it as | Gate | Status | Blocked on | What is left | Next-action
 *     issues |, moving Status from column 3 to column 2. The status column is
 *     therefore located from the nearest preceding HEADER row naming "Status",
 *     falling back to the legacy indexes (3 = status, 4 = next action) for the
 *     older bodies this walks through in git history, which had a misaligned
 *     header. All non-Status/Blocked-on columns to the right of Status are
 *     folded into `nextAction`, so ticket extraction keeps working wherever
 *     the ticket references live.
 */
export function parseGateTable(markdown) {
  const out = {};
  let statusCol = 3; // legacy layout: | GATE | description | status | next action |
  let actionCols = [4];
  for (const line of String(markdown || '').split('\n')) {
    if (!GATE_ROW.test(line)) {
      // A header row for a table that carries a Status column re-anchors the
      // column indexes for the data rows that follow it.
      if (/^\s*\|/.test(line)) {
        const heads = line.split('|').map((c) => c.trim().toLowerCase());
        const s = heads.findIndex((h) => /^status\b/.test(h));
        if (s > 1) {
          statusCol = s;
          actionCols = heads
            .map((_, i) => i)
            .filter((i) => i > s && i < heads.length - 1 && heads[i] && !/^blocked/.test(heads[i]));
          if (actionCols.length === 0) actionCols = [s + 1];
        }
      }
      continue;
    }
    const cells = line.split('|');
    if (cells.length < 5) continue; // the plain-meaning table, not the status table
    const raw = cells[1].trim();
    const gate = LEGACY_GATE_NAMES[raw] || raw;
    if (!GATES.includes(gate) || out[gate]) continue; // first row per gate wins
    const status = statusOf(cells[statusCol] ?? '');
    if (!status) continue;
    const nextAction = actionCols
      .map((i) => (cells[i] || '').trim())
      .filter(Boolean)
      .join(' · ');
    out[gate] = { status, nextAction };
  }
  return out;
}

/** Gate-points for a parsed table. Missing gates score 0 (they aren't done). */
export function pointsFor(gates) {
  return GATES.reduce((sum, g) => sum + (STATUS_POINTS[gates[g]?.status] ?? 0), 0);
}

export function countsFor(gates) {
  const v = GATES.map((g) => gates[g]?.status);
  return {
    green: v.filter((s) => s === 'green').length,
    yellow: v.filter((s) => s === 'yellow').length,
    red: v.filter((s) => s === 'red').length,
    unknown: v.filter((s) => !s).length,
  };
}

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

/**
 * Reconstruct the dated gate series from git.
 *
 * Cost: one `git log` plus one `git show` per commit that touched the file
 * (24 as of 2026-08-11). All local, all free — this is why the estimator is a
 * script and not something an LLM is asked to eyeball.
 *
 * Returns oldest-first: `[{ iso, date, sha, gates, points, counts }]`.
 */
export function readGateHistory({ repoRoot = ROOT, ref = 'HEAD', file = READINESS_PATH } = {}) {
  let log;
  try {
    log = git(['log', '--format=%H|%cI', '--reverse', ref, '--', file], repoRoot).trim();
  } catch {
    return []; // not a git checkout (or a shallow clone with no history)
  }
  if (!log) return [];
  const series = [];
  for (const line of log.split('\n')) {
    const [sha, iso] = line.split('|');
    let body;
    try {
      body = git(['show', `${sha}:${file}`], repoRoot);
    } catch {
      continue; // the commit that deleted/renamed it
    }
    const gates = parseGateTable(body);
    if (Object.keys(gates).length === 0) continue;
    series.push({ sha, iso, date: iso.slice(0, 10), gates, points: pointsFor(gates), counts: countsFor(gates) });
  }
  return series;
}

/** The current gate table, read from the working tree (not git). */
export function readCurrentGates({ repoRoot = ROOT, file = READINESS_PATH } = {}) {
  try {
    return parseGateTable(readFileSync(path.join(repoRoot, file), 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Per-gate "when did this last change status, and to what".
 * Feeds the stalled-gate detection: a gate whose status has not moved in
 * weeks is not on any trajectory, and averaging it into a velocity is how you
 * get a confidently wrong ETA.
 */
export function lastChangeByGate(series) {
  const out = {};
  let prev = {};
  for (const snap of series) {
    for (const gate of GATES) {
      const now = snap.gates[gate]?.status;
      if (!now) continue;
      if (prev[gate] !== now) {
        out[gate] = { status: now, from: prev[gate] ?? null, iso: snap.iso, sha: snap.sha };
      }
    }
    prev = Object.fromEntries(GATES.map((g) => [g, snap.gates[g]?.status]).filter(([, s]) => s));
  }
  return out;
}
