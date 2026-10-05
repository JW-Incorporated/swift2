// Close one HUMAN-ACTIONS.md item (format v2) — Marjorie Overhaul M5, the
// chat routine's "blocker X is done" path (docs/specs/marjorie-overhaul/
// m5-chat.md, Mechanics 4). The human-actions skill allows exactly two
// closes: a `done`/`skip` reply to the item's Discord card, or `ha close`
// run because the owner said so in chat. This is that second path for a
// runner with no VM and no Write/Edit tool: it moves the item out of
// HUMAN-ACTIONS.md and prepends one ledger line to HUMAN-ACTIONS-DONE.md, so
// no agent ever hand-edits either file. Whether the owner actually said so
// is the caller's judgment; this script only refuses what isn't open.
//
//   node scripts/marjorie/ha-close.mjs --list
//   node scripts/marjorie/ha-close.mjs <N> --note "<owner's words>" [--by chat] [--skip] [--date YYYY-MM-DD]
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { HUMAN_ACTIONS_DONE_PATH, HUMAN_ACTIONS_PATH, parseOpenActions } from './human-actions.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const HEADING = /^##\s+#(\d+)\s/;
const TITLE = /^##\s+#\d+\s+\S*\s*\[(?:BLOCKING|DECIDE|UPGRADE)\]\s+(.*?)(?:\s+\(~[^)]*\))?\s*$/;
const LEDGER_LINE = /^-\s+#\d+\s*·/;
const OPEN_COUNT = /^(>\s+\*\*)\d+( open\.\*\*)/;
const NOTE_CAP = 200;

export function laToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(now);
}

function cleanNote(note) {
  const flat = String(note || '').replace(/\s+/g, ' ').replace(/"/g, "'").trim();
  return flat.length > NOTE_CAP ? `${flat.slice(0, NOTE_CAP - 1)}…` : flat;
}

/** Drops separators left back-to-back (or leading/trailing) and runs of blank lines. */
function tidy(lines) {
  const out = [];
  for (const line of lines) {
    const blank = line.trim() === '';
    const rule = line.trim() === '---';
    const prev = [...out].reverse().find((l) => l.trim() !== '');
    if (blank && out.length && out[out.length - 1].trim() === '') continue;
    if (rule && (prev === undefined || prev.trim() === '---' || /^#\s/.test(prev) || /^<!--/.test(prev))) continue;
    out.push(line);
  }
  while (out.length && (out[out.length - 1].trim() === '' || out[out.length - 1].trim() === '---')) out.pop();
  return out;
}

/**
 * Pure: returns the two files' new text, or `{ ok: false, reason }`. The
 * item's block runs from its `## #N` heading to the next item heading or
 * `---` separator. The ledger line goes above the newest existing one.
 */
export function closeHumanAction(openMd, doneMd, { number, date, note, by = 'chat', outcome = 'done' }) {
  if (!Number.isInteger(number) || number < 1) return { ok: false, reason: 'item number must be a positive integer' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return { ok: false, reason: 'date must be YYYY-MM-DD' };
  if (!['done', 'skip'].includes(outcome)) return { ok: false, reason: 'outcome must be done or skip' };
  const why = cleanNote(note);
  if (!why) return { ok: false, reason: 'a note quoting why it closed is required' };

  const eol = openMd.includes('\r\n') ? '\r\n' : '\n';
  const lines = openMd.split(/\r?\n/);
  const start = lines.findIndex((l) => Number(HEADING.exec(l)?.[1]) === number);
  if (start === -1) return { ok: false, reason: `#${number} is not open in ${HUMAN_ACTIONS_PATH}` };
  let end = start + 1;
  while (end < lines.length && !HEADING.test(lines[end]) && lines[end].trim() !== '---') end += 1;
  const chase = lines.slice(start, end).find((line) => /^<!-- marjorie-chase: 96h issue=\d+ -->$/.test(line.trim()))?.trim() || '';
  const title = (TITLE.exec(lines[start])?.[1] || lines[start].replace(/^##\s+#\d+\s*/, '')).trim();
  const kept = tidy([...lines.slice(0, start), ...lines.slice(end)]);
  const remaining = kept.filter((l) => HEADING.test(l)).length;
  const open = `${kept.map((l) => l.replace(OPEN_COUNT, `$1${remaining}$2`)).join(eol)}${eol}`;

  const doneEol = doneMd.includes('\r\n') ? '\r\n' : '\n';
  const doneLines = doneMd.split(/\r?\n/);
  const entry = `- #${number} · ${date} · ${outcome} · ${title} — "${why}" · by ${cleanNote(by) || 'chat'}${chase ? ` · ${chase}` : ''}`;
  const first = doneLines.findIndex((l) => LEDGER_LINE.test(l));
  if (first === -1) {
    while (doneLines.length && doneLines[doneLines.length - 1].trim() === '') doneLines.pop();
    doneLines.push('', entry, '');
  } else {
    doneLines.splice(first, 0, entry);
  }
  return { ok: true, title, entry, open, done: doneLines.join(doneEol) };
}

export function parseArgs(argv) {
  const out = { number: null, note: '', by: 'chat', outcome: 'done', date: '', list: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--list') out.list = true;
    else if (a === '--skip') out.outcome = 'skip';
    else if (['--note', '--by', '--date'].includes(a)) { out[a.slice(2)] = argv[i + 1] ?? ''; i += 1; }
    else if (/^#?\d+$/.test(a)) out.number = Number(a.replace('#', ''));
  }
  return out;
}

export function main(argv = process.argv.slice(2), { root = ROOT, now = new Date() } = {}) {
  const args = parseArgs(argv);
  const openPath = path.join(root, HUMAN_ACTIONS_PATH);
  const donePath = path.join(root, HUMAN_ACTIONS_DONE_PATH);
  const openMd = readFileSync(openPath, 'utf8');
  if (args.list) {
    for (const it of parseOpenActions(openMd)) console.log(`#${it.number} [${it.tag}] ${it.title}`);
    return 0;
  }
  const result = closeHumanAction(openMd, readFileSync(donePath, 'utf8'), { ...args, date: args.date || laToday(now) });
  if (!result.ok) {
    console.log(`ha-close: refused — ${result.reason}`);
    return 1;
  }
  writeFileSync(openPath, result.open);
  writeFileSync(donePath, result.done);
  console.log(`ha-close: closed #${args.number} (${args.outcome}) — ${result.title}`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(() => main(), { name: 'ha-close' });
}
