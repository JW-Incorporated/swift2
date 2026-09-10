// The product Definition-of-Done time series — same git-archaeology pattern
// as gate-history.mjs, pointed at docs/definition-of-done.md instead of the
// superseded docs/launch-readiness.md (2026-08-23; see PLAN.md and that
// file's own "Relationship" note for why the brief moved to this source).
//
// Shape differs from gate-history.mjs on purpose:
//   - Items are NUMBERED (1..N), not named codes — the table is the source
//     of truth for which numbers currently exist, never a hardcoded list,
//     because "items are added/removed only by founder decision" (the
//     file's own rule) and a hardcoded list is exactly the kind of thing
//     that silently goes stale (see gate-history.mjs's own header note
//     about runners.md drifting to describe 15 of 97 routines).
//   - FOUR statuses, not three: 🟢 done, 🟡 moving, ⬜ not started, 🔴
//     blocked. `notstarted` and `blocked` are deliberately distinct —
//     Joey's ask was "why aren't the reds started", which only makes sense
//     if "not started" and "blocked" aren't folded into one bucket.
//   - Every non-green row names who it's blocked on (founder/agent/nobody)
//     in its own column — read directly, never inferred from prose.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DONE_PATH = 'docs/definition-of-done.md';

export const STATUS_ICONS = { green: '🟢', yellow: '🟡', notstarted: '⬜', red: '🔴' };

function statusOf(cell) {
  if (/🟢/.test(cell)) return 'green';
  if (/🟡/.test(cell)) return 'yellow';
  if (/🔴/.test(cell)) return 'red';
  if (/⬜/.test(cell)) return 'notstarted';
  return null;
}

function blockedOnOf(cell) {
  const t = String(cell || '').trim().toLowerCase();
  if (t === 'founder' || t === 'agent' || t === 'nobody') return t;
  // Compound cells — `agent (Marketplace) · nobody (Community)` — are how the
  // file records a row with two sub-items blocked on different parties.
  // 2026-09-05 audit: this parsed as null, so the brief said "reason not
  // recorded — the table needs a Blocked-on value" every day for DoD item 4
  // while the file DID record it, and Marjorie was hand-correcting the row
  // each morning. Keep the cell's own wording when it names real parties.
  const parties = [...t.matchAll(/\b(founder|agent|nobody)\b/g)].map((m) => m[1]);
  if (parties.length) return String(cell).trim();
  return null; // green rows carry no blocked-on value — that's expected, not a parse failure
}

const ITEM_ROW = /^\|\s*(\d+)\s*\|/;

/**
 * Parse the "Status at a glance" table out of a definition-of-done.md body.
 *
 * Returns `{ [itemNumber]: { title, status, blockedOn, nextAction } }`.
 *
 * Same trap gate-history.mjs's parser learned the hard way: locate the
 * Status/Blocked-on columns from the nearest preceding header row, never by
 * fixed index or by searching for the first emoji — prose in `nextAction`
 * can and does contain arrows/emoji-adjacent characters.
 */
export function parseDoneTable(markdown) {
  const out = {};
  let statusCol = 2; // | # | Item | Status | Blocked on | Next action |
  let blockedCol = 3;
  let titleCol = 1;
  let actionCols = [4];
  for (const line of String(markdown || '').split('\n')) {
    if (!ITEM_ROW.test(line)) {
      if (/^\s*\|/.test(line)) {
        const heads = line.split('|').map((c) => c.trim().toLowerCase());
        const s = heads.findIndex((h) => /^status\b/.test(h));
        if (s > 0) {
          statusCol = s;
          const b = heads.findIndex((h) => /^blocked/.test(h));
          blockedCol = b > s ? b : -1;
          titleCol = heads.findIndex((h) => /^item\b/.test(h));
          if (titleCol < 0) titleCol = s - 1;
          actionCols = heads
            .map((_, i) => i)
            .filter((i) => i > s && i !== blockedCol && i < heads.length - 1 && heads[i]);
          if (actionCols.length === 0) actionCols = [s + 1];
        }
      }
      continue;
    }
    const cells = line.split('|');
    if (cells.length < 4) continue; // narrower than any real data row
    const num = Number(cells[1].trim());
    if (!Number.isInteger(num) || out[num]) continue; // first row per number wins
    const status = statusOf(cells[statusCol] ?? '');
    if (!status) continue; // the legend line and stray rows fail this and are skipped
    const title = (cells[titleCol] ?? '').trim();
    const blockedOn = blockedCol >= 0 ? blockedOnOf(cells[blockedCol]) : null;
    const nextAction = actionCols
      .map((i) => (cells[i] || '').trim())
      .filter(Boolean)
      .join(' · ');
    out[num] = { title, status, blockedOn, nextAction };
  }
  return out;
}

export function countsFor(items) {
  const v = Object.values(items).map((i) => i.status);
  return {
    green: v.filter((s) => s === 'green').length,
    yellow: v.filter((s) => s === 'yellow').length,
    notstarted: v.filter((s) => s === 'notstarted').length,
    red: v.filter((s) => s === 'red').length,
  };
}

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

/**
 * Reconstruct the dated item series from git — same cost model as
 * gate-history.mjs (one `git log` + one `git show` per touching commit, all
 * local, all free).
 *
 * Returns oldest-first: `[{ iso, date, sha, items, counts }]`.
 */
export function readDoneHistory({ repoRoot = ROOT, ref = 'HEAD', file = DONE_PATH } = {}) {
  let log;
  try {
    log = git(['log', '--format=%H|%cI', '--reverse', ref, '--', file], repoRoot).trim();
  } catch {
    return [];
  }
  if (!log) return [];
  const series = [];
  for (const line of log.split('\n')) {
    const [sha, iso] = line.split('|');
    let body;
    try {
      body = git(['show', `${sha}:${file}`], repoRoot);
    } catch {
      continue;
    }
    const items = parseDoneTable(body);
    if (Object.keys(items).length === 0) continue;
    series.push({ sha, iso, date: iso.slice(0, 10), items, counts: countsFor(items) });
  }
  return series;
}

/** The current item table, read from the working tree (not git). */
export function readCurrentDone({ repoRoot = ROOT, file = DONE_PATH } = {}) {
  try {
    return parseDoneTable(readFileSync(path.join(repoRoot, file), 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Per-item "when did this last change status, and to what" — a cheap
 * overview, but NOT what decides "moved since the last brief" (see
 * `changeSinceAnchor` below): the last flip could have happened weeks ago,
 * long before the anchor, and this map alone can't tell you that.
 */
export function lastChangeByItem(series) {
  const out = {};
  let prev = {};
  for (const snap of series) {
    for (const [num, item] of Object.entries(snap.items)) {
      const now = item.status;
      if (prev[num] !== now) {
        out[num] = { status: now, from: prev[num] ?? null, iso: snap.iso, sha: snap.sha };
      }
    }
    prev = Object.fromEntries(Object.entries(snap.items).map(([n, i]) => [n, i.status]));
  }
  return out;
}

/**
 * What changed for each currently-tracked item since `anchorIso` (the
 * previous brief's `createdAt`) — finds the last snapshot at-or-before the
 * anchor and diffs it against the CURRENT table. Compares status AND
 * nextAction text, because a yellow can make real progress (a new PR
 * landed, the next-action ticket changed) without its status flipping —
 * status-only diffing would call that "no movement" when it wasn't.
 *
 * Returns `{ [itemNumber]: { moved: bool, statusChanged: bool, from, to,
 * nextActionChanged: bool } }`.
 */
export function changeSinceAnchor(series, current, anchorIso) {
  const anchorSnap = [...series].reverse().find((s) => s.iso <= anchorIso) ?? null;
  const out = {};
  for (const [num, item] of Object.entries(current)) {
    const before = anchorSnap?.items?.[num];
    if (!before) {
      // No snapshot at/before the anchor had this item — either it's brand
      // new (founder-added since) or the series doesn't reach back far
      // enough. Either way, "moved" isn't a meaningful claim; say so rather
      // than guessing.
      out[num] = { moved: null, statusChanged: null, from: null, to: item.status, nextActionChanged: null };
      continue;
    }
    const statusChanged = before.status !== item.status;
    const nextActionChanged = before.nextAction !== item.nextAction;
    out[num] = {
      moved: statusChanged || nextActionChanged,
      statusChanged, from: before.status, to: item.status,
      nextActionChanged,
    };
  }
  return out;
}

/**
 * The "since yesterday" line for one item, for the brief's Gates section.
 * Always returns something printable — never a silent blank — per Joey's
 * refinement (2026-08-23): a yellow with no movement is itself the finding,
 * every day it's true, not just after it repeats.
 */
export function sinceLastBrief(num, item, delta) {
  if (item.status === 'green') return null; // done rows don't get a delta line
  const d = delta?.[num];

  if (item.status === 'red') {
    return item.blockedOn
      ? `blocked on ${item.blockedOn}${item.blockedOn === 'nobody' ? ' (unstaffed — needs someone to pick it up)' : ''}`
      : 'blocked, reason not recorded — the table needs a Blocked-on value';
  }
  if (item.status === 'notstarted') {
    return item.blockedOn === 'nobody' || !item.blockedOn
      ? 'not started — unstaffed, needs someone to pick it up'
      : `not started — waiting on ${item.blockedOn}`;
  }

  // yellow: state whether it moved, and if not, why not — every occurrence,
  // not just after N repeats (this is the finding, not noise). Blocked-on is
  // static data (not history-dependent), so it's always worth stating even
  // when there's no prior snapshot to compare against — dropping it on day
  // one is exactly the silence this whole feature exists to prevent.
  if (d?.moved === null) {
    return item.blockedOn
      ? `no history yet to compare — currently blocked on ${item.blockedOn}${item.blockedOn === 'nobody' ? ' (unstaffed)' : ''}`
      : 'no history yet to compare, and no Blocked-on value recorded';
  }
  if (d?.statusChanged) return `moved: ${d.from ?? 'unknown'} → ${d.to} since the last brief`;
  if (d?.nextActionChanged) return 'moving — next-action ticket updated since the last brief';
  return item.blockedOn
    ? `no movement since yesterday — blocked on ${item.blockedOn}${item.blockedOn === 'nobody' ? ' (unstaffed — that is why it is not moving)' : ''}`
    : 'no movement since yesterday, reason not recorded — the table needs a Blocked-on value';
}
