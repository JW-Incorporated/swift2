// Parses HUMAN-ACTIONS.md for Marjorie's brief — deterministic, zero AI, same
// reasoning as gate-history.mjs: the file is the source of truth and
// re-deriving structured data from an LLM reading prose is exactly the "data
// problem masquerading as a writing problem" the 2026-08-11 brief rebuild's
// header note warns about.
//
// FORMAT v2 (RULINGS-2 / ARCHITECTURE-decision.md §3, P3 migration landed
// 2026-09-11): the file now holds ONLY open items — presence means open,
// there is no `**Status:**` field and no `## OPEN`/`## DONE` split. Closed
// items live one-line-each in the sibling `HUMAN-ACTIONS-DONE.md` — the
// brief-rendering functions below never read it (founders never open it
// either), but `nextHumanActionNumber`/`readNextHumanActionNumber` do (added
// 2026-09-12): this repo's "numbers never reused" convention means the true
// next `## #N` has to be computed across both files, not just the open one.
// An item's filed date moved from a `**Filed:**` body line into
// a hidden `<!-- ha filed=YYYY-MM-DD ... -->` comment right under its
// heading, and the kind vocabulary is now exactly BLOCKING / DECIDE /
// UPGRADE (glyph follows kind, the parser ignores the glyph). An optional
// `(~<eta>)` trailer on the heading is captured into its own `eta` field
// instead of staying glued to `title` — see parseMinutes()'s doc comment for
// why that split makes the "quickest to clear" feature MORE robust than the
// v1 parser, not less.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const HUMAN_ACTIONS_PATH = 'HUMAN-ACTIONS.md';
export const HUMAN_ACTIONS_DONE_PATH = 'HUMAN-ACTIONS-DONE.md';
const DAY_MS = 86_400_000;

// `## #43 🔴 [BLOCKING] Title (~15 min)` — `\S*` eats the glyph (any single
// non-space token; the parser never chokes on an unrecognized or missing
// one), the KIND vocabulary is the v2 three, and a trailing `(~...)` eta is
// stripped out of the captured title by the non-capturing group so `title`
// never carries a half-rendered annotation.
const ITEM_HEADER = /^##\s+#(\d+)\s+\S*\s*\[(BLOCKING|DECIDE|UPGRADE)\]\s+(.*?)(?:\s+\(~[^)]*\))?\s*$/;
// The eta, captured independently of ITEM_HEADER so a heading's `title`
// group and its `eta` are two clean fields instead of one field an author
// has to un-glue by regex later. Kept including the leading `~` so it feeds
// parseMinutes() unchanged.
const ETA = /\((~[^)]*)\)\s*$/;
// `<!-- ha filed=2026-09-11 -->` or `<!-- ha filed=2026-09-11 kind=inferred -->`
// — filed= is always the first key; extra `k=v` pairs (e.g. migration's
// `kind=inferred` marker) are legal and ignored here.
const FILED = /^<!--\s*ha filed=(\d{4}-\d{2}-\d{2})\b/;

/**
 * Parse every item block (`## #N <glyph> [KIND] Title (~eta)` through the
 * next such heading, or end of file) out of the whole document. There is no
 * section split any more — v2's entire open file is items, full stop.
 */
function parseItems(markdown) {
  const items = [];
  const lines = markdown.split('\n');
  let current = null;
  for (const line of lines) {
    const h = ITEM_HEADER.exec(line);
    if (h) {
      if (current) items.push(current);
      const eta = ETA.exec(line);
      current = { number: Number(h[1]), tag: h[2], title: h[3].trim(), eta: eta ? eta[1] : null, filed: null };
      continue;
    }
    if (!current) continue;
    const f = FILED.exec(line);
    if (f) current.filed = f[1];
  }
  if (current) items.push(current);
  return items;
}

/**
 * Every item in HUMAN-ACTIONS.md, with age-in-days computed from the
 * `<!-- ha filed=... -->` comment (null if somehow missing — report the
 * gap, don't guess an age). Presence in the file is the only "is this open"
 * test now: there is no `**Status:**` line left to read and no `[DONE]`
 * header tag, so there is nothing here to filter — every parsed item is, by
 * construction of the v2 format, open. (v1 needed `includeClosed` because a
 * closed item could still physically sit in the open file; v2's migration
 * and lint make that state unreachable, so the option is gone, not hidden.)
 */
export function parseOpenActions(markdown, { now = Date.now() } = {}) {
  return parseItems(markdown).map((it) => ({
    ...it,
    ageDays: it.filed ? Math.floor((now - new Date(`${it.filed}T00:00:00Z`).getTime()) / DAY_MS) : null,
  }));
}

export function readOpenActions({ repoRoot = ROOT, file = HUMAN_ACTIONS_PATH, now = Date.now() } = {}) {
  try {
    return parseOpenActions(readFileSync(path.join(repoRoot, file), 'utf8'), { now });
  } catch {
    return [];
  }
}

// `- #66 · 2026-09-12 · done · Title ... · by owner` — one line per closed
// item (HUMAN_ACTIONS_DONE_PATH's own format, see that file's own header
// comment); only the leading `#N` is needed here.
const DONE_ITEM = /^-\s+#(\d+)\s*·/;

/** Every item number recorded in HUMAN-ACTIONS-DONE.md (closed items),
 * newest-first order not guaranteed to matter — every line is scanned. */
export function parseClosedNumbers(markdown) {
  const numbers = [];
  for (const line of String(markdown || '').split('\n')) {
    const m = DONE_ITEM.exec(line);
    if (m) numbers.push(Number(m[1]));
  }
  return numbers;
}

/**
 * The true next `## #N` number for a new HUMAN-ACTIONS.md item: per this
 * repo's "numbers are never reused" convention (CLAUDE.md), that is
 * `max(open items in HUMAN-ACTIONS.md ∪ closed items in
 * HUMAN-ACTIONS-DONE.md) + 1`, not just the highest number in the open file
 * — reading only the open file lets a filer reissue a number that was
 * already used and closed. `openMarkdown`/`doneMarkdown` are the two files'
 * raw text; pure so tests never touch the filesystem.
 */
export function nextHumanActionNumber(openMarkdown, doneMarkdown, { now = Date.now() } = {}) {
  const openNumbers = parseOpenActions(openMarkdown, { now }).map((it) => it.number);
  const closedNumbers = parseClosedNumbers(doneMarkdown);
  return Math.max(0, ...openNumbers, ...closedNumbers) + 1;
}

/** Filesystem-reading wrapper around `nextHumanActionNumber` — the one call
 * site an agent's Bash-only CLI can actually reach (via
 * `alert-router.mjs next-ha-number`). A genuinely missing file (`ENOENT`)
 * reads as empty, matching `readOpenActions`'s own "no file yet" behavior —
 * but any OTHER read failure (permissions, the path being a directory, a
 * transient I/O error) is rethrown rather than silently treated as "no
 * items," which would let the allocator hand out an already-used number
 * (2026-09-12 Codex round-2 review of PR #4216: a broad `catch {}` here
 * reproducibly returned `1` even when both paths were directories). */
export function readNextHumanActionNumber({
  repoRoot = ROOT,
  openFile = HUMAN_ACTIONS_PATH,
  doneFile = HUMAN_ACTIONS_DONE_PATH,
  now = Date.now(),
} = {}) {
  const readOrEmpty = (file) => {
    try {
      return readFileSync(path.join(repoRoot, file), 'utf8');
    } catch (err) {
      if (err && err.code === 'ENOENT') return '';
      throw err;
    }
  };
  return nextHumanActionNumber(readOrEmpty(openFile), readOrEmpty(doneFile), { now });
}

/**
 * One line per item for the brief's "Waiting on you" section, oldest and
 * most BLOCKING first. `🔴` marks anything past `staleAfterDays` (default
 * 14) — same escalation spirit as founder-gate.mjs's ESCALATE_AFTER, kept
 * as its own constant here because HUMAN-ACTIONS items are a different
 * class of ask (a standing item, not a re-asked checklist line).
 */
export const STALE_AFTER_DAYS = 14;

export function renderActionLine(item) {
  const age = item.ageDays === null ? 'age unknown — no Filed: date' : `waiting ${item.ageDays}d`;
  const flag = item.ageDays !== null && item.ageDays > STALE_AFTER_DAYS ? '🔴 ' : '';
  const tag = item.tag === 'BLOCKING' ? '[BLOCKING] ' : '';
  return `- [ ] ${flag}${tag}HA#${item.number} ${item.title} — ${age}`;
}

export function sortForBrief(items) {
  return [...items].sort((a, b) => {
    if (a.tag !== b.tag) return a.tag === 'BLOCKING' ? -1 : 1;
    return (b.ageDays ?? -1) - (a.ageDays ?? -1);
  });
}

/**
 * Pull the author's own `~N min` (or `~N-M min`) estimate out of a string,
 * if any. Call sites pass `item.eta` first and fall back to `item.title`
 * (see quickWins() below) — v2 items carry the estimate in their own `eta`
 * field (parsed out of the heading's `(~...)` trailer), while v1-shaped
 * test fixtures and any estimate an author happens to leave inline in the
 * title text still match here exactly as before. Real titles use both
 * range forms (`~2 min` and `~10-20 min`/`~30–60 min` with a hyphen or en
 * dash); a range's UPPER bound is used, because this number feeds a "quick
 * to clear" promise — the worst case is the honest claim for "will this
 * actually take 15 min or less", not the best case. Returns null, never a
 * guess, when no estimate is present at all.
 */
export function parseMinutes(title) {
  const m = /~\s*(\d+)(?:\s*[-–]\s*(\d+))?\s*min/i.exec(String(title || ''));
  if (!m) return null;
  return m[2] ? Number(m[2]) : Number(m[1]);
}

/**
 * 2026-09-06 content-quality gap: 13 "waiting on you" items were shown as one
 * flat oldest-first list mixing a 2-minute rename with a 35-minute credential
 * upload with a legal sign-off that needs real thought. A founder skimming
 * top-to-bottom has no way to see "I could clear 4 of these in the next 10
 * minutes" without reading every line's estimate by hand. Surface the ones
 * that are cheap to clear as their own pointer — ascending by time, so the
 * very fastest is first.
 */
export const QUICK_WIN_MAX_MINUTES = 15;

export function quickWins(items, maxMinutes = QUICK_WIN_MAX_MINUTES) {
  return items
    .map((it) => ({ item: it, minutes: parseMinutes(it.eta ?? it.title) }))
    .filter((x) => x.minutes !== null && x.minutes <= maxMinutes)
    .sort((a, b) => a.minutes - b.minutes)
    .map((x) => x.item);
}
