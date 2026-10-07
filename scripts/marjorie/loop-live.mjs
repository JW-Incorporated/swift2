// CLI for the live Tree/Marjorie loop (W7, docs/specs/marjorie-overhaul/l1-loop.md
// § Live loop). Always a plain `run:` step on the workflow token, never an agent:
//
//   node scripts/marjorie/loop-live.mjs file-help --side tree|marjorie --dir <dir> --source <N> --source-url <url> [--parent <issue>] [--response] [--dispatch]
//   node scripts/marjorie/loop-live.mjs pending --for marjorie|tree --out <json> [--issue <N>] [--limit <N>]
//   node scripts/marjorie/loop-live.mjs save-help --side tree|marjorie --ask "<text>" [--why "<text>"] [--parent <N>] [--dir <dir>] [--error]
//   node scripts/marjorie/loop-live.mjs guard-dispositions --for marjorie|tree --queue <json>
//
// `guard-dispositions` is the post-run guard: every ask in the queue file the agent
// still has no Disposition on gets a fallback NEEDS HELP (lib/loop-fallback.mjs).
//
// `save-help` is how an agent with no Write tool saves a help ask: it writes the
// next `for-*-N.json` (at most two, plus two more with `--error`) and never touches
// GitHub. `--error` marks an error or blocker: it files past the daily help cap, which
// is for discretionary asks (docs/decisions.md 2026-10-05). A response run
// passes `--parent <the ask it answers>`; `file-help --response` takes each
// ask's depth from that parent and, with none, files the ask but never
// dispatches it (fail closed — lib/loop-dispatch.mjs).
//
// `file-help` reads the asks an agent saved as `<dir>/for-marjorie-*.json`
// (side tree) or `<dir>/for-tree-*.json` (side marjorie) — `{ask, why?}` each —
// files the ones inside today's cap and not already open, and with --dispatch
// starts the other bot's response routine for each NEW filing. `pending`
// writes the queue a response routine reads. A GitHub failure is a
// `::warning::` and exit 0; only bad usage exits non-zero.
import { appendFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runMain } from '../lib/cli.mjs';
import { gh as ghRun } from '../lib/gh.mjs';
import { REPO, fileAsk, parseTreeAsks } from './lib/loop-asks.mjs';
import { dispatchResponse } from './lib/loop-dispatch.mjs';
import { postMissingDispositions, queueNumbers } from './lib/loop-fallback.mjs';
import { buildQueue, ensureLoopLabels, helpBudget } from './lib/loop-queue.mjs';
import { parseArgs } from './loop-asks.mjs';

const USAGE =
  'usage: loop-live.mjs file-help --side tree|marjorie --dir <dir> --source <N> --source-url <url> [--parent <N>] [--response] [--dispatch]\n' +
  '       loop-live.mjs pending --for marjorie|tree --out <json> [--issue <N>] [--limit <N>]\n' +
  '       loop-live.mjs save-help --side tree|marjorie --ask "<text>" [--why "<text>"] [--parent <N>] [--dir <dir>] [--error]\n' +
  '       loop-live.mjs guard-dispositions --for marjorie|tree --queue <json>';
const DIRECTION = { tree: 'to-marjorie', marjorie: 'to-tree' };
const warn = (message) => console.log(`::warning::loop-live: ${message}`);

function need(flags, names) {
  const missing = names.filter((n) => typeof flags[n] !== 'string');
  if (missing.length > 0) throw new Error(`missing --${missing.join(', --')}\n${USAGE}`);
}

/** The file name prefix a side's saved asks carry: what the OTHER bot is called. */
const savedPrefix = (side) => (side === 'tree' ? 'for-marjorie-' : 'for-tree-');

function readSaved(dir, side) {
  const prefix = savedPrefix(side);
  let names;
  try {
    names = readdirSync(dir).filter((n) => n.startsWith(prefix) && n.endsWith('.json')).sort().slice(0, 6);
  } catch {
    return [];
  }
  const entries = [];
  for (const name of names) {
    try {
      const parsed = JSON.parse(readFileSync(path.join(dir, name), 'utf8'));
      entries.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch (err) {
      warn(`${name} is not valid JSON — skipped (${err.message})`);
    }
  }
  return entries;
}

export function saveHelp(flags) {
  if (flags.side !== 'tree' && flags.side !== 'marjorie') throw new Error(`--side must be tree or marjorie\n${USAGE}`);
  const ask = typeof flags.ask === 'string' ? flags.ask.trim() : '';
  if (!ask) throw new Error(`--ask is required\n${USAGE}`);
  const dir = typeof flags.dir === 'string' ? flags.dir : '.scratch/out';
  mkdirSync(dir, { recursive: true });
  const isError = flags.error === true;
  const saved = readdirSync(dir).filter((n) => n.startsWith(savedPrefix(flags.side)) && n.endsWith('.json'));
  const sameKind = saved.filter((n) => {
    try { return (JSON.parse(readFileSync(path.join(dir, n), 'utf8'))?.kind === 'error') === isError; } catch { return !isError; }
  }).length;
  if (sameKind >= 2) {
    console.log(`loop-live: two ${isError ? 'error' : 'help'} asks already saved this run — not saving another.`);
    return 0;
  }
  const file = path.join(dir, `${savedPrefix(flags.side)}${saved.length + 1}.json`);
  const parent = Number.isInteger(Number(flags.parent)) && Number(flags.parent) > 0 ? Number(flags.parent) : undefined;
  writeFileSync(file, `${JSON.stringify({ ask, why: typeof flags.why === 'string' ? flags.why : '', parent, kind: isError ? 'error' : undefined })}\n`);
  console.log(`loop-live: saved ${file} — a plain job files it after this run.`);
  return 0;
}

export async function fileHelp(flags, { gh = ghRun, now = Date.now() } = {}) {
  const side = flags.side;
  if (side !== 'tree' && side !== 'marjorie') throw new Error(`--side must be tree or marjorie\n${USAGE}`);
  const repo = typeof flags.repo === 'string' ? flags.repo : REPO;
  // One entry at a time so each ask keeps its own parent (parseTreeAsks drops it).
  const seen = new Set();
  const asks = [];
  for (const entry of readSaved(flags.dir, side)) {
    const [ask] = parseTreeAsks({ needsFromMarjorie: [entry] }).asks;
    const key = ask?.ask.toLowerCase();
    if (!ask || seen.has(key)) continue;
    seen.add(key);
    asks.push({ ...ask, parent: Number(entry.parent) > 0 ? Number(entry.parent) : null, kind: entry.kind === 'error' ? 'error' : null });
  }
  if (asks.length === 0) {
    console.log(`loop-live: no help ask saved by ${side}.`);
    return 0;
  }
  let budget;
  try {
    budget = await helpBudget(side, asks, { repo, gh, now });
  } catch (err) {
    warn(`could not read today's asks, filing none: ${err.message}`);
    return 0;
  }
  for (const { ask, number } of budget.duplicates) console.log(`loop-live: "${ask.ask.slice(0, 60)}" is already open as #${number} — not refiled.`);
  // Errors and blockers file past the discretionary cap (their own backstop applies); everything else is capped.
  const allowed = [
    ...budget.fresh.filter((a) => a.kind === 'error').slice(0, budget.errorRemaining),
    ...budget.fresh.filter((a) => a.kind !== 'error').slice(0, budget.remaining),
  ];
  if (budget.fresh.length > allowed.length) console.log(`loop-live: ${budget.fresh.length - allowed.length} ask(s) over today's cap (${budget.filedToday} filed already) — not filed.`);
  for (const ask of allowed) {
    try {
      const filing = await fileAsk(side, ask, { sourceNumber: flags.source, sourceUrl: flags['source-url'], repo, gh });
      console.log(`loop-live: ${filing.created ? 'filed' : 'already filed'} #${filing.number} (${side} → ${side === 'tree' ? 'Marjorie' : 'Tree'})`);
      if (flags.dispatch && filing.created) {
        await dispatchResponse(DIRECTION[side], filing.number, { repo, gh, now, parent: flags.response ? ask.parent : ask.parent || flags.parent, response: Boolean(flags.response) });
      }
    } catch (err) {
      warn(`filing a ${side} help ask failed: ${err.message}`);
    }
  }
  return 0;
}

export async function pending(flags, { gh = ghRun, now = Date.now() } = {}) {
  const bot = flags.for;
  if (bot !== 'marjorie' && bot !== 'tree') throw new Error(`--for must be marjorie or tree\n${USAGE}`);
  const repo = typeof flags.repo === 'string' ? flags.repo : REPO;
  const primary = Number.isInteger(Number(flags.issue)) && Number(flags.issue) > 0 ? Number(flags.issue) : null;
  const limit = Number.isInteger(Number(flags.limit)) && Number(flags.limit) > 0 ? Number(flags.limit) : (bot === 'marjorie' ? 4 : 2);
  let queue = { bot, items: [], error: null };
  try {
    await ensureLoopLabels({ repo, gh });
    queue = { ...(await buildQueue(bot, { primary, limit, repo, gh, now })), error: null };
  } catch (err) {
    warn(`could not build the ${bot} queue: ${err.message}`);
    queue.error = String(err.message).slice(0, 200);
  }
  mkdirSync(path.dirname(flags.out), { recursive: true });
  writeFileSync(flags.out, `${JSON.stringify(queue, null, 2)}\n`);
  console.log(`loop-live: ${bot} queue — ${queue.items.length} ask(s) to answer${primary ? `, #${primary} first` : ''}.`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `skip=${queue.items.length === 0}\n`);
  return 0;
}

export async function guardDispositions(flags, { gh = ghRun } = {}) {
  const bot = flags.for;
  if (bot !== 'marjorie' && bot !== 'tree') throw new Error(`--for must be marjorie or tree\n${USAGE}`);
  const repo = typeof flags.repo === 'string' ? flags.repo : REPO;
  let numbers;
  try {
    numbers = queueNumbers(JSON.parse(readFileSync(flags.queue, 'utf8')));
  } catch (err) {
    warn(`could not read the queue file, nothing to guard: ${err.message}`);
    return 0;
  }
  if (numbers.length > 0) await ensureLoopLabels({ repo, gh });
  await postMissingDispositions(bot, numbers, { repo, gh });
  return 0;
}

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (command === 'file-help') {
    need(flags, ['side', 'dir', 'source', 'source-url']);
    return fileHelp(flags);
  }
  if (command === 'save-help') return saveHelp(flags);
  if (command === 'pending') {
    need(flags, ['for', 'out']);
    return pending(flags);
  }
  if (command === 'guard-dispositions') {
    need(flags, ['for', 'queue']);
    return guardDispositions(flags);
  }
  throw new Error(USAGE);
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/marjorie/loop-live.mjs')) {
  runMain(main, { name: 'loop-live' });
}
