// CLI for L1 — the Tree/Marjorie loop (docs/specs/marjorie-overhaul/l1-loop.md).
// Always a `run:` step on the workflow token, never an agent:
//
//   node scripts/marjorie/loop-asks.mjs file-tree --plan <calendar.brief.json> --pr <N> --pr-url <url> --out <loop.json>
//   node scripts/marjorie/loop-asks.mjs file-marjorie --issue <N> --issue-url <url> --body-file <in.md> --out <out.md> [--no-edit]
//
// A GitHub failure is a ::warning:: and exit 0 — a failed filing must never
// stop a brief from going out. Only bad usage (or an unreadable input file)
// exits non-zero, and both workflows guard that with `|| echo ::warning::`.
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { runMain } from '../lib/cli.mjs';
import { gh as ghRun } from '../lib/gh.mjs';
import {
  REPO, parseTreeAsks, parseMarjorieAsk, fileAsk, rewriteForTreeLine,
  fetchAsksFor, selectAsksFor, renderTreeBriefBlock,
} from './lib/loop-asks.mjs';

const USAGE =
  'usage: loop-asks.mjs file-tree --plan <json> --pr <N> --pr-url <url> --out <json>\n' +
  '       loop-asks.mjs file-marjorie --issue <N> --issue-url <url> --body-file <md> --out <md> [--no-edit]';

function warn(message) {
  console.log(`::warning::loop-asks: ${message}`);
}

// Temp file + rename, so `timeout 120` killing the process mid-write can
// never leave the brief body the workflow is about to post truncated.
function writeAtomic(file, text) {
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, text);
  renameSync(tmp, file);
}

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const flags = {};
  for (let i = 0; i < rest.length; i += 1) {
    if (!rest[i].startsWith('--')) continue;
    const name = rest[i].slice(2);
    const next = rest[i + 1];
    if (next === undefined || next.startsWith('--')) {
      flags[name] = true;
    } else {
      flags[name] = next;
      i += 1;
    }
  }
  return { command, flags };
}

function requireFlags(flags, names) {
  const missing = names.filter((n) => typeof flags[n] !== 'string');
  if (missing.length > 0) throw new Error(`missing --${missing.join(', --')}\n${USAGE}`);
}

/** Tree side: file this week's asks, read Marjorie's, write the brief block. */
export async function fileTree(flags, { gh = ghRun, now = Date.now() } = {}) {
  const repo = typeof flags.repo === 'string' ? flags.repo : REPO;
  let plan = {};
  try {
    plan = JSON.parse(readFileSync(flags.plan, 'utf8'));
  } catch (err) {
    warn(`could not read ${flags.plan}: ${err.message}`);
  }

  const { asks, overCap, invalid, duplicates } = parseTreeAsks(plan);
  if (invalid > 0) warn(`${invalid} needsFromMarjorie entr${invalid === 1 ? 'y has' : 'ies have'} no ask text — skipped`);
  if (duplicates > 0) warn(`${duplicates} duplicate needsFromMarjorie entr${duplicates === 1 ? 'y' : 'ies'} merged — filed once`);

  const filed = [];
  let failed = 0;
  for (const ask of asks) {
    try {
      const filing = await fileAsk('tree', ask, { sourceNumber: flags.pr, sourceUrl: flags['pr-url'], repo, gh });
      filed.push(filing);
      console.log(`loop-asks: ${filing.created ? 'filed' : 'already filed'} #${filing.number} (Tree → Marjorie)`);
    } catch (err) {
      failed += 1;
      warn(`filing a Tree ask failed: ${err.message}`);
    }
  }

  let incoming = [];
  try {
    incoming = selectAsksFor('tree', await fetchAsksFor('tree', { repo, gh, state: 'all' }), { now, closedWithinDays: 7 });
  } catch (err) {
    warn(`reading Marjorie's asks of Tree failed: ${err.message}`);
  }

  const lines = renderTreeBriefBlock({ filed, failed, overCap, incoming });
  const summary = filed.map(({ number, url, created }) => ({ number, url, created }));
  writeAtomic(flags.out, `${JSON.stringify({ lines, filed: summary }, null, 2)}\n`);
  console.log(`loop-asks: tree — ${summary.filter((f) => f.created).length} filed, ${summary.filter((f) => !f.created).length} already filed, ${failed} failed, ${incoming.length} from Marjorie`);
  return 0;
}

/** Marjorie side: file the brief's For Tree ask, write its number back. */
export async function fileMarjorie(flags, { gh = ghRun, timeoutMs } = {}) {
  const repo = typeof flags.repo === 'string' ? flags.repo : REPO;
  const body = readFileSync(flags['body-file'], 'utf8');
  const parsed = parseMarjorieAsk(body);
  let out = body;
  let written = false;

  if (!parsed.line) {
    console.log('loop-asks: no "- For Tree:" line in the brief — nothing to file.');
  } else if (parsed.filed) {
    console.log(`loop-asks: For Tree already filed as #${parsed.filed}.`);
  } else if (!parsed.ask) {
    console.log('loop-asks: no ask for Tree today.');
  } else {
    try {
      const filing = await fileAsk('marjorie', parsed.ask, { sourceNumber: flags.issue, sourceUrl: flags['issue-url'], repo, gh, timeoutMs });
      console.log(`loop-asks: ${filing.created ? 'filed' : 'already filed'} #${filing.number} (Marjorie → Tree)`);
      out = rewriteForTreeLine(body, filing);
      // Written before the brief edit, so a hang there can't lose the number.
      writeAtomic(flags.out, out);
      written = true;
      if (!flags['no-edit']) {
        try {
          await gh(['issue', 'edit', String(flags.issue), '--repo', repo, '--body', out]);
        } catch (err) {
          warn(`filed #${filing.number} but could not write its number into brief #${flags.issue}: ${err.message}`);
        }
      }
    } catch (err) {
      warn(`filing Marjorie's ask of Tree failed: ${err.message}`);
    }
  }

  if (!written) writeAtomic(flags.out, out);
  return 0;
}

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (command === 'file-tree') {
    requireFlags(flags, ['plan', 'pr', 'pr-url', 'out']);
    return fileTree(flags);
  }
  if (command === 'file-marjorie') {
    requireFlags(flags, ['issue', 'issue-url', 'body-file', 'out']);
    return fileMarjorie(flags);
  }
  throw new Error(USAGE);
}

// Basename check only: lib/loop-asks.mjs shares this basename but has no
// entry point, and tests import this file under vitest's own argv.
if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/marjorie/loop-asks.mjs')) {
  runMain(main, { name: 'loop-asks' });
}
