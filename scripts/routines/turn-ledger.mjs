#!/usr/bin/env node
// Weekly, read-only routine turn ledger. Artifacts are intentionally the source
// of truth: a skipped or expired artifact is unknown, never zero turns.
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

export const REPO = process.env.GITHUB_REPOSITORY || 'JW-Incorporated/swift2';
export const ARTIFACT_NAME = 'routine-usage';
const OUTPUT = path.resolve('docs/ops/dashboard/budget.json');
const execFileAsync = promisify(execFile);
const directGh = (args) => execFileAsync('gh', args, { encoding: 'utf8', timeout: 30_000, maxBuffer: 10 * 1024 * 1024 });

export function parseArgs(argv) {
  let days = 7;
  let dryRun = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--dry-run') dryRun = true;
    else if (argv[i] === '--days') days = Number(argv[++i]);
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  if (!Number.isFinite(days) || days <= 0) throw new Error('--days must be a positive number');
  return { days, dryRun };
}

export function isLimitFailure(record) {
  // session-outcome.mjs does not export its usage-limit predicate. Its
  // redacted detail is deliberately not persisted, so this fixed diagnostic is
  // the only artifact-safe equivalent of its plan-limit detection.
  return record?.diagnostic?.assistantError === 'rate_limit';
}

export function tokenPool(record) {
  const pool = record?.tokenPool ?? record?.usage?.token_pool;
  return typeof pool === 'string' && pool ? pool : null;
}

/** Pure aggregation used by the CLI and fixture tests. */
export function aggregateUsage(records) {
  const rows = new Map();
  for (const record of records) {
    if (!record || typeof record.routineName !== 'string' || !record.routineName) continue;
    const row = rows.get(record.routineName) ?? {
      routine: record.routineName,
      runs: 0,
      totalTurns: 0,
      turnsWithData: 0,
      models: new Set(),
      limitFailures: 0,
      tokenPools: new Set(),
    };
    row.runs += 1;
    if (Number.isFinite(record.numTurns)) {
      row.totalTurns += record.numTurns;
      row.turnsWithData += 1;
    }
    if (typeof record.model === 'string' && record.model) row.models.add(record.model);
    if (isLimitFailure(record)) row.limitFailures += 1;
    const pool = tokenPool(record);
    if (pool) row.tokenPools.add(pool);
    rows.set(record.routineName, row);
  }
  return [...rows.values()]
    .map((row) => ({
      routine: row.routine,
      runs: row.runs,
      totalTurns: row.totalTurns,
      meanTurns: row.turnsWithData ? row.totalTurns / row.turnsWithData : null,
      model: [...row.models].sort().join(', ') || null,
      limitFailures: row.limitFailures,
      tokenPools: [...row.tokenPools].sort(),
    }))
    .sort((a, b) => a.routine.localeCompare(b.routine));
}

export function renderTable(rows) {
  return [
    '| Routine | Runs | Total turns | Mean turns | Model | Limit failures | Token pool |',
    '| --- | ---: | ---: | ---: | --- | ---: | --- |',
    ...rows.map((row) =>
      `| ${row.routine} | ${row.runs} | ${row.totalTurns} | ${row.meanTurns?.toFixed(1) ?? 'unknown'} | ${row.model ?? 'unknown'} | ${row.limitFailures} | ${row.tokenPools.join(', ') || 'not recorded'} |`,
    ),
  ].join('\n');
}

export function budgetDocument({ days, generatedAt, rows }) {
  return {
    generatedAt,
    lookbackDays: days,
    source: 'routine-usage GitHub Actions artifacts',
    routines: rows,
  };
}

function parsePages(stdout, key) {
  const pages = JSON.parse(stdout || '[]');
  return (Array.isArray(pages) ? pages : [pages]).flatMap((page) => page?.[key] ?? []);
}

async function apiPages(endpoint, ghImpl) {
  const { stdout } = await ghImpl(['api', endpoint, '--paginate', '--slurp', '-X', 'GET', '-f', 'per_page=100']);
  return stdout;
}

async function downloadRecord(runId, artifact, { ghImpl, repo }) {
  const dir = await mkdtemp(path.join(tmpdir(), 'turn-ledger-'));
  const downloadDir = path.join(dir, 'artifact');
  try {
    await ghImpl(['run', 'download', String(runId), '--name', artifact.name, '--dir', downloadDir, '--repo', repo]);
    const record = JSON.parse(await readFile(path.join(downloadDir, 'routine-usage.json'), 'utf8'));
    return record && typeof record === 'object' ? record : null;
  } catch (error) {
    console.error(`turn-ledger: skipped unreadable artifact for run ${runId}: ${error?.message ?? error}`);
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Fetches all recent routine-usage artifacts from GitHub's paginated artifact index. */
export async function fetchUsageRecords({ since, ghImpl = directGh, repo = REPO, readArtifact = downloadRecord }) {
  const artifacts = parsePages(
    await apiPages(`repos/${repo}/actions/artifacts?name=${ARTIFACT_NAME}`, ghImpl),
    'artifacts',
  ).filter((artifact) => artifact.expired !== true && artifact.created_at >= since);
  const records = [];
  // A single download is slow enough that serial traversal can outlive an
  // Actions job. Four is small relative to GitHub's artifact service and keeps
  // one failed/expired artifact isolated without a secondary-limit burst.
  for (let offset = 0; offset < artifacts.length; offset += 4) {
    const batch = await Promise.all(
      artifacts.slice(offset, offset + 4).map(async (artifact) => {
        const runId = artifact.workflow_run?.id;
        return Number.isFinite(runId) ? readArtifact(runId, artifact, { ghImpl, repo }) : null;
      }),
    );
    records.push(...batch.filter(Boolean));
  }
  return records;
}

export async function main(argv = process.argv.slice(2), { now = new Date(), ghImpl = directGh, repo = REPO } = {}) {
  const { days, dryRun } = parseArgs(argv);
  const since = new Date(now.getTime() - days * 86_400_000).toISOString();
  const rows = aggregateUsage(await fetchUsageRecords({ since, ghImpl, repo }));
  console.log(renderTable(rows));
  if (!dryRun) {
    await mkdir(path.dirname(OUTPUT), { recursive: true });
    await writeFile(OUTPUT, JSON.stringify(budgetDocument({ days, generatedAt: now.toISOString(), rows }), null, 2) + '\n');
    console.log(`turn-ledger: wrote ${path.relative(process.cwd(), OUTPUT)}`);
  }
  return rows;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`turn-ledger: ${error.message}`);
    process.exitCode = 1;
  });
}
