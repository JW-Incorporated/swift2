#!/usr/bin/env node
// Monthly fleet telemetry snapshot — T-17 (docs/TIER2-OPTIMIZATION.md).
//
// `docs/agents/runners.md` § Rules has promised "the manager-hat telemetry
// reports tokens-per-account monthly so the split is measured, not assumed"
// since 2026-07-25, and nothing has ever produced it — every cost figure in
// this repo's docs is a point-in-time audit someone did by hand
// (`docs/automation/review-2026-08-31.md` gap 4). This is the zero-LLM
// Tier-1 Action REC-7.4 / T-17 proposed to close that gap, same shape as
// `growth-snapshot.yml`: a scheduled Action snapshots what GitHub Actions
// itself can see — workflow run counts and open-PR count — into
// `docs/audits/fleet-telemetry/`, so the next optimization pass is a diff
// against this file's history instead of a fresh hand-count.
//
// ROUTINE USAGE TELEMETRY (2026-09-10, closes the other half of the T-17
// visibility gap): each `routine-*.yml` run now uploads a `routine-usage`
// artifact (`scripts/routine-usage-report.mjs`, wired in
// `.github/workflows/routine-template.yml`) carrying that run's turn count,
// duration, and a cost-equivalent parsed from the Claude Code SDK's
// terminal `result` message. This script aggregates those artifacts
// per-routine into the "Routine usage telemetry" report section below.
// IMPORTANT CAVEAT: `total_cost_usd` there is a LIST-PRICE EQUIVALENT under
// the shared `CLAUDE_CODE_OAUTH_TOKEN` plan-usage model
// (`routine-template.yml`'s header) — not a real billed dollar amount, since
// this account is not metered per-token. The actual constraint remains
// Joey's plan rate limit, not money — this closes a VISIBILITY gap, not a
// dollar-cap gap (that's architecturally impossible here). The Routine
// Auditor's own weekly comment (docs/agents/routine-invariants.md § Auditor
// arithmetic) still separately reports enabled-trigger-count and
// per-routine cadence-sum — the two do not duplicate each other.
//
// WHY PER-WORKFLOW TOTAL_COUNT, NOT ONE PAGED LIST: this repo already
// exceeds 1,000 matching runs in a 30-day window (CodeQL + CI alone), and
// GitHub's actions/runs list endpoint silently caps pagination at 1,000
// items even with `--paginate` — one repo-wide query would systematically
// undercount. `total_count` on a filtered per-workflow query is accurate
// regardless of that pagination cap, and this repo has ~40 workflows, so
// ~40 cheap `per_page=1` calls (reading only `.total_count`) is the correct
// shape, not one huge paged fetch.
import { readdir, readFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gh } from './lib/gh.mjs';
import { runMain } from './lib/cli.mjs';

// `routine-usage` artifact name written by `scripts/routine-usage-report.mjs`
// (`.github/workflows/routine-template.yml`'s upload-artifact step).
const ROUTINE_ARTIFACT_NAME = 'routine-usage';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'docs', 'audits', 'fleet-telemetry');
const REPO = process.env.GITHUB_REPOSITORY || 'JW-Incorporated/swift2';
const LOOKBACK_DAYS = 30;

/** ISO timestamp this many days before `now`. Exported for tests. */
export function isoDaysAgo(now, days) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Turns a list of `{ name, totalCount }` per-workflow results into the
 * `{ name: count }` map `buildReport` expects, dropping zero-run workflows
 * (a workflow with no runs this window just doesn't get a row — see
 * `buildReport`'s union-with-previous logic for how a workflow that HAD
 * runs last time but none now is still shown, with a 0). Exported and pure
 * for tests.
 */
export function buildRunCounts(workflowTotals) {
  const counts = {};
  for (const { name, totalCount } of workflowTotals) {
    if (totalCount > 0) counts[name] = totalCount;
  }
  return counts;
}

async function fetchWorkflows() {
  const { stdout } = await gh([
    'api',
    `repos/${REPO}/actions/workflows`,
    '--paginate',
    '-X',
    'GET',
    '-f',
    'per_page=100',
    '--jq',
    '.workflows[] | {id, name}',
  ]);
  const text = stdout.trim();
  if (!text) return [];
  return text.split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

/**
 * Total runs for one workflow since `sinceIso`, via `total_count` on a
 * `per_page=1` request — see the module header for why this avoids the
 * 1,000-run pagination cap that a single repo-wide list would hit.
 */
async function fetchWorkflowRunTotal(workflowId, sinceIso) {
  const { stdout } = await gh([
    'api',
    `repos/${REPO}/actions/workflows/${workflowId}/runs`,
    '-X',
    'GET',
    '-f',
    `created=>=${sinceIso}`,
    '-f',
    'per_page=1',
    '--jq',
    '.total_count',
  ]);
  return parseInt(stdout.trim(), 10) || 0;
}

async function fetchRunCounts(sinceIso) {
  const workflows = await fetchWorkflows();
  const totals = [];
  // Sequential, not Promise.all: this repo-scoped session shares one rate
  // limit across ~40 calls; sequential keeps a single clear failure point
  // (which workflow) instead of a burst that could trip secondary limits.
  for (const wf of workflows) {
    const totalCount = await fetchWorkflowRunTotal(wf.id, sinceIso);
    totals.push({ name: wf.name, totalCount });
  }
  return buildRunCounts(totals);
}

/**
 * True for a `routine-*.yml` caller workflow whose runs carry `routine-usage`
 * telemetry artifacts — excludes `routine-template` itself, the reusable
 * workflow those callers invoke via `uses:`, which is never run directly and
 * so never has its own artifact-bearing runs. Exported and pure for tests.
 */
export function isRoutineWorkflow(name) {
  return typeof name === 'string' && name.startsWith('routine-') && name !== 'routine-template';
}

/** Run IDs for one workflow since `sinceIso`. Routine cadence (daily/weekly) stays well under the 1,000-run pagination cap this window covers, so a full paginated list (not just `total_count`) is safe here. */
async function fetchRoutineRunIds(workflowId, sinceIso) {
  const { stdout } = await gh([
    'api',
    `repos/${REPO}/actions/workflows/${workflowId}/runs`,
    '--paginate',
    '-X',
    'GET',
    '-f',
    `created=>=${sinceIso}`,
    '-f',
    'per_page=100',
    '--jq',
    '.workflow_runs[].id',
  ]);
  const text = stdout.trim();
  if (!text) return [];
  return text.split('\n').filter(Boolean).map((line) => parseInt(line, 10));
}

/** Artifact names attached to one workflow run. */
async function fetchRunArtifactNames(runId) {
  const { stdout } = await gh([
    'api',
    `repos/${REPO}/actions/runs/${runId}/artifacts`,
    '-X',
    'GET',
    '--jq',
    '.artifacts[].name',
  ]);
  return stdout.trim().split('\n').filter(Boolean);
}

/**
 * Downloads and parses one run's `routine-usage` artifact, or returns `null`
 * when the run has none (skipped/guarded-off routine runs never produce one)
 * or the download/parse fails — a single bad run must not abort the snapshot.
 */
async function fetchRoutineUsageRecord(runId) {
  const names = await fetchRunArtifactNames(runId).catch(() => []);
  if (!names.includes(ROUTINE_ARTIFACT_NAME)) return null;
  const dir = await mkdtemp(path.join(tmpdir(), 'routine-usage-'));
  try {
    await gh(['run', 'download', String(runId), '--name', ROUTINE_ARTIFACT_NAME, '--dir', dir, '--repo', REPO]);
    const raw = await readFile(path.join(dir, 'routine-usage.json'), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`fleet-telemetry-snapshot: could not read routine-usage artifact for run ${runId}: ${err?.message ?? err}`);
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/** All parsed `routine-usage` records across every `routine-*` workflow's runs this window. */
async function fetchRoutineUsageRecords(sinceIso) {
  const workflows = (await fetchWorkflows()).filter((wf) => isRoutineWorkflow(wf.name));
  const records = [];
  for (const wf of workflows) {
    const runIds = await fetchRoutineRunIds(wf.id, sinceIso);
    for (const runId of runIds) {
      const record = await fetchRoutineUsageRecord(runId);
      if (record) records.push(record);
    }
  }
  return records;
}

/** Median of a numeric array, or `null` for an empty array. Exported and pure for tests. */
export function median(nums) {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Groups `routine-usage.json` records by routine name into per-routine run
 * count / total & median turns / total duration / summed cost-equivalent.
 * Rows missing a numeric field are excluded from that field's aggregate
 * rather than treated as zero (a `null` cost, e.g. from a malformed
 * execution file, must not silently understate the total). Exported and
 * pure for tests.
 */
export function aggregateRoutineUsage(records) {
  const byRoutine = {};
  for (const r of records || []) {
    if (!r || !r.routineName) continue;
    const agg = (byRoutine[r.routineName] ??= {
      routineName: r.routineName,
      runCount: 0,
      turns: [],
      totalDurationMs: 0,
      totalCostUsd: 0,
      hasCost: false,
    });
    agg.runCount += 1;
    if (Number.isFinite(r.numTurns)) agg.turns.push(r.numTurns);
    if (Number.isFinite(r.durationMs)) agg.totalDurationMs += r.durationMs;
    if (Number.isFinite(r.totalCostUsd)) {
      agg.totalCostUsd += r.totalCostUsd;
      agg.hasCost = true;
    }
  }
  return Object.values(byRoutine)
    .map((agg) => ({
      routineName: agg.routineName,
      runCount: agg.runCount,
      totalTurns: agg.turns.reduce((a, b) => a + b, 0),
      medianTurns: median(agg.turns),
      totalDurationMs: agg.totalDurationMs,
      totalCostUsd: agg.hasCost ? agg.totalCostUsd : null,
    }))
    .sort((a, b) => b.runCount - a.runCount || a.routineName.localeCompare(b.routineName));
}

function formatDurationTotal(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '0m';
  const totalMinutes = Math.round(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Renders the routine-usage telemetry markdown section. Exported and pure
 * for tests. `total_cost_usd` here is explicitly labeled a list-price
 * equivalent, never a real bill — every routine authenticates via the
 * shared `CLAUDE_CODE_OAUTH_TOKEN` plan-usage pool (`routine-template.yml`'s
 * header), not metered per-token billing.
 */
export function renderRoutineUsageSection(aggregates) {
  const header = [
    '',
    '## Routine usage telemetry',
    '',
    'Per-routine aggregation of `routine-usage` artifacts written by' +
      ' `scripts/routine-usage-report.mjs` (T-17\'s routine-fleet visibility' +
      ' gap — see module header). **`total_cost_usd` here is a LIST-PRICE' +
      ' EQUIVALENT under the shared `CLAUDE_CODE_OAUTH_TOKEN` plan-usage' +
      ' model, not a real billed dollar amount** — the actual constraint' +
      ' remains Joey\'s plan rate limit, not money.',
    '',
  ];
  if (!aggregates.length) {
    return [...header, '_No `routine-usage` artifacts found in this window._', ''].join('\n');
  }
  const rows = aggregates.map(
    (a) =>
      `| ${a.routineName} | ${a.runCount} | ${a.totalTurns} | ${a.medianTurns ?? '—'} | ${formatDurationTotal(a.totalDurationMs)} | ${a.totalCostUsd != null ? `$${a.totalCostUsd.toFixed(2)}` : '—'} |`,
  );
  return [
    ...header,
    '| Routine | Runs | Total turns | Median turns | Total duration | List-price cost-equivalent |',
    '|---|---|---|---|---|---|',
    ...rows,
    '',
  ].join('\n');
}

async function fetchOpenPrCount() {
  // `gh pr list` truncates at its --limit even with a large value; this repo
  // is nowhere near 200 open PRs today but the count must stay correct as it
  // grows. The search API's total_count is exact regardless of result size —
  // it's a single-number aggregate, not a paged list, so it isn't subject to
  // the pagination cap that bit the workflow-run count above.
  const { stdout } = await gh([
    'api',
    `search/issues?q=${encodeURIComponent(`repo:${REPO} is:pr is:open`)}`,
    '-X',
    'GET',
    '--jq',
    '.total_count',
  ]);
  return parseInt(stdout.trim(), 10) || 0;
}

/**
 * Signed delta string, or an em-dash when there's nothing to compare
 * against (no previous snapshot, or the workflow is new this window).
 */
function delta(current, previous) {
  if (previous === undefined) return '—';
  const d = current - previous;
  return `${d >= 0 ? '+' : ''}${d}`;
}

/**
 * Builds the markdown report. Exported and pure for tests.
 *
 * Rows are the UNION of this window's and the previous snapshot's workflow
 * names — a workflow that had runs last time but zero this time (disabled,
 * removed, renamed) still gets a row showing 0 and a negative delta, which
 * is exactly the fleet-retirement signal this report exists to surface.
 * Dropping it silently would hide the change instead of reporting it.
 */
export function buildReport({ month, sinceIso, runCounts, openPrCount, previous, routineUsage = [] }) {
  const totalRuns = Object.values(runCounts).reduce((a, b) => a + b, 0);
  const previousCounts = previous?.runCounts ?? {};
  const allNames = new Set([...Object.keys(runCounts), ...Object.keys(previousCounts)]);
  const rows = [...allNames]
    .map((name) => ({ name, count: runCounts[name] ?? 0, prevCount: previousCounts[name] }))
    .sort((a, b) => b.count - a.count)
    .map(({ name, count, prevCount }) => `| ${name} | ${count} | ${delta(count, prevCount)} |`);

  const prDelta = delta(openPrCount, previous?.openPrCount);

  const lines = [
    `# Fleet telemetry snapshot — ${month}`,
    '',
    `Generated by \`scripts/fleet-telemetry-snapshot.mjs\` (report-only, zero-LLM,` +
      ` \`.github/workflows/fleet-telemetry-snapshot.yml\`). Window: workflow runs` +
      ` created on/after ${sinceIso} (last ${LOOKBACK_DAYS} days). Per-workflow` +
      ' counts come from `total_count` on a filtered per-workflow query, not one' +
      ' paginated repo-wide list, because this repo already exceeds the 1,000-run' +
      ' pagination cap that a single query would silently hit. This is the' +
      ' Actions-workflow half of T-17 (`docs/TIER2-OPTIMIZATION.md`); the Claude' +
      ' Code routine-fleet half (enabled-trigger count + cadence sum) is reported' +
      ' weekly by the Routine Auditor per `docs/agents/routine-invariants.md` §' +
      ' Auditor arithmetic — this file does not duplicate that number.',
    '',
    `**Open PRs:** ${openPrCount}${previous ? ` (Δ ${prDelta} vs. previous snapshot)` : ''}`,
    '',
    `**Total workflow runs, last ${LOOKBACK_DAYS} days:** ${totalRuns}`,
    '',
    '| Workflow | Runs (last 30d) | Δ vs. previous snapshot |',
    '|---|---|---|',
    ...rows,
    renderRoutineUsageSection(routineUsage),
  ];
  return lines.join('\n');
}

async function findPreviousSnapshot(excludeFile) {
  let files;
  try {
    files = (await readdir(OUT_DIR)).filter((f) => f.endsWith('.json') && f !== excludeFile).sort();
  } catch {
    return null;
  }
  if (!files.length) return null;
  const latest = files[files.length - 1];
  return JSON.parse(await readFile(path.join(OUT_DIR, latest), 'utf8'));
}

async function main() {
  const now = new Date();
  const month = now.toISOString().slice(0, 7); // YYYY-MM
  const sinceIso = isoDaysAgo(now, LOOKBACK_DAYS);
  const jsonFile = `${month}.json`;
  const mdFile = `${month}.md`;

  const [runCounts, openPrCount, routineUsageRecords] = await Promise.all([
    fetchRunCounts(sinceIso),
    fetchOpenPrCount(),
    fetchRoutineUsageRecords(sinceIso),
  ]);
  const previous = await findPreviousSnapshot(jsonFile);
  const routineUsage = aggregateRoutineUsage(routineUsageRecords);

  const report = buildReport({ month, sinceIso, runCounts, openPrCount, previous, routineUsage });
  const data = { month, sinceIso, generatedAt: now.toISOString(), runCounts, openPrCount, routineUsage };

  if (process.env.DRY_RUN === 'true') {
    console.log(`DRY RUN — would write docs/audits/fleet-telemetry/${mdFile} and ${jsonFile}\n\n${report}`);
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, mdFile), report);
  await writeFile(path.join(OUT_DIR, jsonFile), JSON.stringify(data, null, 2) + '\n');
  console.log(`fleet-telemetry-snapshot: wrote docs/audits/fleet-telemetry/${mdFile} and ${jsonFile}`);
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'fleet-telemetry-snapshot' });
}
