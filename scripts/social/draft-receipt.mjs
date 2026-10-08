#!/usr/bin/env node
// The failure receipt for Tree's draft runs (Bots v2 W8). A daily draft that
// dies — the 2026-09-30 run hit its 50-turn cap at $8.55 and produced nothing —
// used to leave only a red run nobody read. This turns that into a receipt in
// the run summary and ONE deduped `desk:tree` issue per day and run kind: what
// ran, why it stopped, what the pre-compute had already decided, and what to do.
// Runs from a plain job after the agent job, only when the agent did not
// succeed. Never fails its own job.
//
//   node scripts/social/draft-receipt.mjs --kind daily|event --result failure|cancelled|skipped
//        [--inputs .scratch/tree-inputs.json] [--usage routine-usage.json] [--run-url <url>] [--file-issue]
import { execFileSync } from 'node:child_process';
import { appendFile, readFile } from 'node:fs/promises';
import { runMain } from '../lib/cli.mjs';

const KIND_LABEL = { daily: 'daily draft', event: 'event draft' };

/** One plain sentence on why the agent stopped, from the usage telemetry. */
export function causeOf(usage) {
  const sub = usage?.diagnostic?.resultSubtype;
  if (sub === 'error_max_turns') return `hit its turn cap (${usage.numTurns}/${usage.maxTurns} turns, $${Number(usage.totalCostUsd ?? 0).toFixed(2)} list-price) before opening a PR`;
  if (sub === 'error_max_budget_usd') return `hit its budget cap ($${Number(usage.totalCostUsd ?? 0).toFixed(2)}) before opening a PR`;
  if (usage?.diagnostic?.isError) return `ended in an error (${sub ?? 'unknown subtype'}${usage.diagnostic.assistantError ? `, ${usage.diagnostic.assistantError}` : ''})`;
  return usage ? 'stopped without a result message' : 'failed before telemetry was written (setup, auth or timeout — see the run log)';
}

export function buildReceipt({ kind, result, runUrl, day, inputs, usage }) {
  const label = KIND_LABEL[kind] ?? kind;
  const beats = (inputs?.beats ?? []).map((b) => `- ${b.date}: ${b.text === null ? 'no calendar entry' : b.needsDraft ? `needed a pair${b.photo ? ` (pre-picked photo \`${b.photo.photoId}\`)` : ' — no never-used photo was left'}` : 'already drafted'}`);
  const todo = result === 'cancelled'
    ? ['Cancelled or timed out — re-run the workflow once the cause is clear.']
    : ['Re-run via `workflow_dispatch` once the cause below is understood — the pre-compute is deterministic, so a re-run starts from the same inputs.', 'If it capped out again, the prompt (`docs/agents/runner-prompts/`) needs trimming, not the cap raising.'];
  return [
    `## Tree ${label} did not finish — ${day}`,
    '',
    `The agent ${causeOf(usage)}. Job result: \`${result}\`.${runUrl ? ` Run: ${runUrl}` : ''}`,
    '',
    '**What was decided before the model started** (`.scratch/tree-inputs.json`):',
    ...(beats.length ? beats : ['- (no pre-compute artifact — the prepare job itself failed)']),
    ...(inputs ? [`- backlog ${inputs.backlog.heldItems}/${inputs.backlog.skipAt}${inputs.backlog.skipCalendarDrafting ? ' (calendar drafting was skipped on purpose)' : ''}; never-used photos ${inputs.photos.neverUsed}/${inputs.photos.library}; uncovered events ${inputs.events.uncovered.length}`] : []),
    '',
    '**Next:**',
    ...todo.map((t) => `- ${t}`),
    '',
    `Tier-2: Tree — ${kind === 'event' ? 'event draft' : 'daily social draft'}`,
  ].join('\n');
}

const gh = (args) => execFileSync('gh', args, { encoding: 'utf8', timeout: 60_000 });

async function readJson(file) {
  if (!file) return null;
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const value = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
  const kind = value('--kind') ?? 'daily';
  const day = new Date().toISOString().slice(0, 10);
  const body = buildReceipt({
    kind, result: value('--result') ?? 'failure', runUrl: value('--run-url'), day,
    inputs: await readJson(value('--inputs')), usage: await readJson(value('--usage')),
  });
  console.log(body);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${body}\n`);
  if (argv.includes('--file-issue')) {
    const title = `tree: ${KIND_LABEL[kind] ?? kind} run failed ${day}`;
    try {
      const open = JSON.parse(gh(['issue', 'list', '--state', 'open', '--search', `"${title}" in:title`, '--json', 'number,title', '--limit', '5']));
      if (open.some((i) => i.title === title)) console.log(`receipt issue for ${day} already open — not filing another`);
      else console.log(gh(['issue', 'create', '--title', title, '--label', 'desk:tree', '--body', body]).trim());
    } catch (err) {
      console.log(`::warning::draft-receipt: could not file the receipt issue (${String(err.message).split('\n')[0]})`);
    }
  }
  return 0;
}

if (process.argv[1]?.endsWith('draft-receipt.mjs')) runMain(main, { name: 'draft-receipt' });
