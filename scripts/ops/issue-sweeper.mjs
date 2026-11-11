// Deterministic issue sweeper (backlog cleanup pass 1, founder-approved
// 2026-10-08). Closes, never deletes, machine-filed issues that rules prove
// stale. No LLM calls. Rules + hard guard: scripts/ops/lib/issue-sweeper-rules.mjs,
// documented in docs/AUTOMATION.md.
//
//   node scripts/ops/issue-sweeper.mjs [--dry-run] [--apply] [--max N]
//
// Default is --dry-run: writes .scratch/issue-sweeper-plan.json and prints
// counts per rule. --apply closes issues (~1/sec, continues past errors).

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { runMain } from '../lib/cli.mjs';
import { assertNotTruncated, buildPlan, collectPrRefs } from './lib/issue-sweeper-rules.mjs';

const LIST_LIMIT = 1000;
const PLAN_PATH = '.scratch/issue-sweeper-plan.json';
const RULES = ['supersede-report', 'intake-ttl', 'watchdog-recovered', 'cie-duplicate'];

const gh = (args) => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

function parseArgs(argv) {
  const opts = { apply: false, max: 150 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--apply') opts.apply = true;
    else if (argv[i] === '--dry-run') opts.apply = false;
    else if (argv[i] === '--max') opts.max = Number(argv[++i]);
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  if (!Number.isInteger(opts.max) || opts.max < 0) {
    throw new Error('--max needs a non-negative integer');
  }
  return opts;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeLatestRun() {
  const cache = new Map();
  return (file) => {
    if (cache.has(file)) return cache.get(file);
    let run;
    try {
      const out = JSON.parse(
        gh([
          'run', 'list', '--workflow', file, '--branch', 'main', '--limit', '1', '--status', 'completed',
          '--json', 'conclusion,createdAt,url',
        ]),
      );
      run = out[0] ?? null;
    } catch {
      run = null;
    }
    cache.set(file, run);
    return run;
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const issues = JSON.parse(
    gh([
      'issue', 'list', '--state', 'open', '--limit', '1000', '--json',
      'number,title,labels,author,createdAt,updatedAt,assignees,comments',
    ]),
  );
  const prs = JSON.parse(
    gh(['pr', 'list', '--state', 'open', '--limit', '1000', '--json', 'number,title,body']),
  );
  assertNotTruncated({ issues, prs }, LIST_LIMIT);
  const { plan, skipped } = buildPlan({
    issues,
    prRefs: collectPrRefs(prs),
    now: new Date(),
    latestRun: makeLatestRun(),
  });

  const counts = {};
  for (const p of plan) counts[p.rule] = (counts[p.rule] ?? 0) + 1;
  const skipCounts = {};
  for (const s of skipped) skipCounts[s.reason] = (skipCounts[s.reason] ?? 0) + 1;

  mkdirSync('.scratch', { recursive: true });
  writeFileSync(
    PLAN_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        openIssues: issues.length,
        skippedByGuard: skipped.length,
        plan: plan.map(({ number, rule, reason, title }) => ({ number, rule, reason, title })),
      },
      null,
      2,
    ),
  );

  console.log(`open issues: ${issues.length}; skipped by guard: ${skipped.length}`);
  for (const [reason, n] of Object.entries(skipCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  guard skip ${reason}: ${n}`);
  }
  for (const rule of RULES) console.log(`  ${rule}: ${counts[rule] ?? 0}`);
  console.log(`planned closes: ${plan.length} (cap ${opts.max}); plan: ${PLAN_PATH}`);

  if (!opts.apply) {
    console.log('dry run: nothing closed');
    return 0;
  }

  let closed = 0;
  let failed = 0;
  for (const p of plan.slice(0, opts.max)) {
    try {
      gh(['issue', 'close', String(p.number), '--comment', p.comment, '--reason', 'not planned']);
      closed++;
      console.log(`closed #${p.number} [${p.rule}] ${p.reason}`);
    } catch (err) {
      failed++;
      console.error(`FAILED #${p.number} [${p.rule}]: ${String(err.message).split('\n')[0]}`);
    }
    await sleep(1000);
  }
  console.log(`applied: ${closed} closed, ${failed} failed`);
  return 0;
}

runMain(main, { name: 'issue-sweeper' });
