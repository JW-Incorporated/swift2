#!/usr/bin/env node
// Measures the real GitHub Actions fire rate of the poll clock and every
// table-dispatched workflow. Read-only: it never dispatches or mutates runs.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

export const REPO = process.env.GITHUB_REPOSITORY || 'JW-Incorporated/swift2';
export const CLOCK_TABLE = JSON.parse(readFileSync(new URL('./clock-table.json', import.meta.url), 'utf8'));
const execFileAsync = promisify(execFile);
const directGh = (args) => execFileAsync('gh', args, { encoding: 'utf8', timeout: 30_000, maxBuffer: 10 * 1024 * 1024 });

export function parseArgs(argv) {
  let hours = 48;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--hours') hours = Number(argv[++i]);
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  if (!Number.isFinite(hours) || hours <= 0) throw new Error('--hours must be a positive number');
  return { hours };
}

export function expectedFires(hours, minGapMinutes) {
  return (hours * 60) / minGapMinutes;
}

function actorLogin(run) {
  return run?.triggering_actor?.login ?? run?.actor?.login ?? null;
}

/** Chooses the narrow clock signal when GitHub supplies it, else reports all runs. */
export function measureActual(runs, kind) {
  if (kind === 'poll') {
    const scheduled = runs.filter((run) => run?.event === 'schedule');
    return { actual: scheduled.length, method: 'schedule events' };
  }
  const hasActorAndEvent = runs.some((run) => typeof run?.event === 'string' && typeof actorLogin(run) === 'string');
  if (!hasActorAndEvent) return { actual: runs.length, method: 'all runs (actor/event unavailable)' };
  return {
    actual: runs.filter((run) => run?.event === 'workflow_dispatch' && actorLogin(run) === 'github-actions[bot]').length,
    method: 'workflow_dispatch by github-actions[bot]',
  };
}

export function buildFireRates({ hours, pollRuns, tableRuns, table = CLOCK_TABLE }) {
  const rows = [
    {
      workflow: 'bot-chat-poll.yml',
      expected: expectedFires(hours, 5),
      ...measureActual(pollRuns, 'poll'),
    },
  ];
  for (const entry of table) {
    rows.push({
      workflow: entry.workflow,
      expected: expectedFires(hours, entry.minGapMinutes),
      ...measureActual(tableRuns.get(entry.workflow) ?? [], 'clock'),
    });
  }
  return rows;
}

export function renderTable(rows, hours) {
  return [
    `Clock fire rate, last ${hours} hours`,
    '| Workflow | Expected | Actual | Counted as |',
    '| --- | ---: | ---: | --- |',
    ...rows.map((row) => `| ${row.workflow} | ${row.expected.toFixed(1)} | ${row.actual} | ${row.method} |`),
  ].join('\n');
}

function parsePages(stdout) {
  const pages = JSON.parse(stdout || '[]');
  return (Array.isArray(pages) ? pages : [pages]).flatMap((page) => page?.workflow_runs ?? []);
}

async function fetchRuns(workflow, since, { ghImpl, repo }) {
  const { stdout } = await ghImpl([
    'api',
    `repos/${repo}/actions/workflows/${workflow}/runs`,
    '--paginate',
    '--slurp',
    '-X',
    'GET',
    '-f',
    'per_page=100',
    '-f',
    `created=>=${since}`,
  ]);
  return parsePages(stdout);
}

export async function main(argv = process.argv.slice(2), { now = new Date(), ghImpl = directGh, repo = REPO, table = CLOCK_TABLE } = {}) {
  const { hours } = parseArgs(argv);
  const since = new Date(now.getTime() - hours * 3_600_000).toISOString();
  const pollRuns = await fetchRuns('bot-chat-poll.yml', since, { ghImpl, repo });
  const tableRuns = new Map();
  for (const entry of table) tableRuns.set(entry.workflow, await fetchRuns(entry.workflow, since, { ghImpl, repo }));
  const rows = buildFireRates({ hours, pollRuns, tableRuns, table });
  console.log(renderTable(rows, hours));
  return rows;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`clock-fire-rate: ${error.message}`);
    process.exitCode = 1;
  });
}
