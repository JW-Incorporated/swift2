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
// WHAT THIS DOES NOT DO: it cannot see Claude Code routine token spend —
// that lives entirely on Anthropic's side of the Claude_Code_Remote
// connector, with no repo-visible API. That is exactly why the Routine
// Auditor's own weekly comment (docs/agents/routine-invariants.md § Auditor
// arithmetic, T-17's other half) carries the enabled-trigger-count and
// per-routine cadence-sum numbers instead — the two systems compose to
// cover both halves of the fleet (Actions workflows here, Claude Code
// routines there); neither claims to see the other's half.
//
// WHY PER-WORKFLOW TOTAL_COUNT, NOT ONE PAGED LIST: this repo already
// exceeds 1,000 matching runs in a 30-day window (CodeQL + CI alone), and
// GitHub's actions/runs list endpoint silently caps pagination at 1,000
// items even with `--paginate` — one repo-wide query would systematically
// undercount. `total_count` on a filtered per-workflow query is accurate
// regardless of that pagination cap, and this repo has ~40 workflows, so
// ~40 cheap `per_page=1` calls (reading only `.total_count`) is the correct
// shape, not one huge paged fetch.
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gh } from './lib/gh.mjs';
import { runMain } from './lib/cli.mjs';

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
export function buildReport({ month, sinceIso, runCounts, openPrCount, previous }) {
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
    '',
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

  const [runCounts, openPrCount] = await Promise.all([fetchRunCounts(sinceIso), fetchOpenPrCount()]);
  const previous = await findPreviousSnapshot(jsonFile);

  const report = buildReport({ month, sinceIso, runCounts, openPrCount, previous });
  const data = { month, sinceIso, generatedAt: now.toISOString(), runCounts, openPrCount };

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
