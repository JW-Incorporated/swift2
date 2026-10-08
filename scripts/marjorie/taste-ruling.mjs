// CLI for Fable taste rulings (S2, docs/decisions.md 2026-10-01; mechanics in
// lib/taste-ruling.mjs). `save` is the only command an agent runs; the rest are
// plain `run:` steps on the workflow token.
//
//   node scripts/marjorie/taste-ruling.mjs save --side tree|marjorie --question "<text>" [--context "<text>"] [--dir <dir>]
//   node scripts/marjorie/taste-ruling.mjs file --dir <dir> [--source-url <url>] [--dispatch]
//   node scripts/marjorie/taste-ruling.mjs prepare --issue <N> --out <json>      (writes skip=true|false to $GITHUB_OUTPUT)
//   node scripts/marjorie/taste-ruling.mjs post --issue <N> --file <ruling.md>
//
// A GitHub failure is a `::warning::` and exit 0; only bad usage exits non-zero.
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runMain } from '../lib/cli.mjs';
import { parseArgs } from './loop-asks.mjs';
import { fileQuestion, postRuling, prepareQuestion, saveQuestion } from './lib/taste-ruling.mjs';

const USAGE =
  'usage: taste-ruling.mjs save --side tree|marjorie --question "<text>" [--context "<text>"] [--dir <dir>]\n' +
  '       taste-ruling.mjs file --dir <dir> [--source-url <url>] [--dispatch]\n' +
  '       taste-ruling.mjs prepare --issue <N> --out <json>\n' +
  '       taste-ruling.mjs post --issue <N> --file <ruling.md>';

const need = (flags, names) => {
  const missing = names.filter((n) => typeof flags[n] !== 'string');
  if (missing.length > 0) throw new Error(`missing --${missing.join(', --')}\n${USAGE}`);
};

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (command === 'save') {
    need(flags, ['side', 'question']);
    const r = saveQuestion({ side: flags.side, question: flags.question, context: typeof flags.context === 'string' ? flags.context : '', dir: typeof flags.dir === 'string' ? flags.dir : undefined });
    console.log(r.saved ? `taste-ruling: saved ${r.file} — a plain job files it after this run.` : `taste-ruling: not saved (${r.reason}).`);
    return 0;
  }
  if (command === 'file') {
    need(flags, ['dir']);
    await fileQuestion({ dir: flags.dir, sourceUrl: typeof flags['source-url'] === 'string' ? flags['source-url'] : '', dispatch: Boolean(flags.dispatch) });
    return 0;
  }
  if (command === 'prepare') {
    need(flags, ['issue', 'out']);
    let result;
    try {
      result = await prepareQuestion(flags.issue);
    } catch (err) {
      result = { ok: false, reason: `could not read the issue: ${String(err.message).split('\n')[0].slice(0, 160)}` };
    }
    console.log(result.ok ? `taste-ruling: #${flags.issue} is ready to rule on.` : `taste-ruling: skipping #${flags.issue} (${result.reason}).`);
    if (result.ok) {
      mkdirSync(path.dirname(flags.out), { recursive: true });
      writeFileSync(flags.out, `${JSON.stringify(result.question, null, 2)}\n`);
    }
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `skip=${!result.ok}\n`);
    return 0;
  }
  if (command === 'post') {
    need(flags, ['issue', 'file']);
    await postRuling(flags.issue, flags.file);
    return 0;
  }
  throw new Error(USAGE);
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/marjorie/taste-ruling.mjs')) {
  runMain(main, { name: 'taste-ruling' });
}
