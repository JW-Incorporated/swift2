// Parses HUMAN-ACTIONS.md's OPEN section for Marjorie's brief — deterministic,
// zero AI, same reasoning as gate-history.mjs: the file is the source of
// truth and re-deriving structured data from an LLM reading prose is exactly
// the "data problem masquerading as a writing problem" the 2026-08-11 brief
// rebuild's header note warns about.
//
// Requires every OPEN item to carry a `**Filed:** YYYY-MM-DD` line (added to
// the file and mandated by the human-actions skill, 2026-08-23) — an item
// missing one is reported with age `null` rather than guessed.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const HUMAN_ACTIONS_PATH = 'HUMAN-ACTIONS.md';
const DAY_MS = 86_400_000;

const ITEM_HEADER = /^###\s+(\d+)\.\s+\[(BLOCKING|UPGRADE)\]\s+(.*?)\s*$/;
const FILED = /^\*\*Filed:\*\*\s*(\d{4}-\d{2}-\d{2})/;
const STATUS = /^\*\*Status:\*\*\s*(\S+)/;

/**
 * Split a HUMAN-ACTIONS.md body into its `## OPEN` and `## DONE` sections.
 * Sections are matched by heading text, not position, so a future
 * reordering of the file doesn't silently break this.
 */
function sectionBody(markdown, heading) {
  const re = new RegExp(`^##\\s+${heading}\\s*$`, 'm');
  const m = re.exec(markdown);
  if (!m) return '';
  const rest = markdown.slice(m.index + m[0].length);
  const next = /^##\s+\S/m.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}

/**
 * Parse every item block (`### N. [TAG] Title` through the next `---` or
 * `### `) out of one section's body.
 */
function parseItems(sectionText) {
  const items = [];
  const lines = sectionText.split('\n');
  let current = null;
  for (const line of lines) {
    const h = ITEM_HEADER.exec(line);
    if (h) {
      if (current) items.push(current);
      current = { number: Number(h[1]), tag: h[2], title: h[3], filed: null, status: null };
      continue;
    }
    if (!current) continue;
    const f = FILED.exec(line);
    if (f) current.filed = f[1];
    const s = STATUS.exec(line);
    if (s) current.status = s[1];
  }
  if (current) items.push(current);
  return items;
}

/**
 * A terminal status means the item is finished, no matter which markdown
 * section it physically sits under. Items are supposed to move from `##
 * OPEN` to `## DONE` when they close out, but that's a manual step a writer
 * can forget — and 2026-09-05 proved it: HA#22 (`RESOLVED`) and HA#24
 * (`DONE`) both got their `**Status:**` line updated in place and were left
 * under `## OPEN`, so the brief kept re-asking for them. The item's own
 * Status line is the ground truth; the section heading is not. Matches
 * `DONE`, `RESOLVED`, and `SKIP`, optionally followed by more text (a date,
 * a dash-note) — same terminal vocabulary the human-actions skill and this
 * file's own DONE-section entries already use.
 */
const TERMINAL_STATUS = /^(DONE|RESOLVED|SKIP)\b/i;

function isTerminal(status) {
  return typeof status === 'string' && TERMINAL_STATUS.test(status);
}

/**
 * OPEN items, with age-in-days computed from `Filed:` (null if the item
 * predates the convention and was never backfilled — report the gap, don't
 * guess an age). Items whose own `**Status:**` line is terminal (DONE /
 * RESOLVED / SKIP) are excluded even if they are still physically sitting
 * under the `## OPEN` heading — see TERMINAL_STATUS above.
 */
export function parseOpenActions(markdown, { now = Date.now() } = {}) {
  const items = parseItems(sectionBody(markdown, 'OPEN')).filter((it) => !isTerminal(it.status));
  return items.map((it) => ({
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
