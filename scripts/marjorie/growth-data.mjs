// Weekly growth collector for Marjorie's Sunday Fable review (W5, bots-v2).
//
//   node scripts/marjorie/growth-data.mjs [--week-ending YYYY-MM-DD] [--out <file>] [--repo owner/repo] [--no-gh]
//
// Prints (and optionally writes) one JSON summary: follower deltas, posts
// published, content shipped, time-sensitive coverage, Tree asks, traffic.
// Read-only. Files come from the checkout (social/metrics, social/posted,
// social/state); GitHub rows come from the REST issues list and `gh pr list`.
// Each GitHub section fails soft into `warnings` so one outage never blanks
// the rest. `--no-gh` skips every network call (offline / test runs).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { gh as ghRun } from '../lib/gh.mjs';
import { erasTouched, fetchContentShipped } from './content-shipped.mjs';
import { buildGrowthData, contentSummary, weekWindow } from './lib/growth-data.mjs';
import { timeSensitiveCoverage, treeAsksSummary } from './lib/growth-coverage.mjs';
import { apiFor, listIssuesByLabels } from './lib/issues-rest.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REPO = 'JW-Incorporated/swift2';

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/** Every `*.json` under `dir`, recursively, parsed; unreadable files skipped. */
export function readJsonTree(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name)).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return readJsonTree(p);
    return e.name.endsWith('.json') ? [readJson(p)].filter(Boolean) : [];
  });
}

export function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) flags[argv[i].slice(2)] = true;
    else { flags[argv[i].slice(2)] = next; i += 1; }
  }
  return flags;
}

/** Runs one GitHub-backed section; a failure becomes a warning + fallback. */
async function soft(label, warnings, fn, fallback) {
  try {
    return await fn();
  } catch (err) {
    warnings.push(`${label}: ${String(err?.message ?? err).slice(0, 200)}`);
    return fallback;
  }
}

export async function collect({ root = ROOT, weekEnding, nowMs = Date.now(), repo = REPO, noGh = false, gh = ghRun, fetchContent = fetchContentShipped } = {}) {
  const win = weekWindow(weekEnding, nowMs);
  const warnings = [];
  const series = readJsonTree(path.join(root, 'social', 'metrics')).filter((r) => r?.date && r?.followers);
  const postMetrics = readJsonTree(path.join(root, 'social', 'metrics', 'posts'));
  const posted = readJsonTree(path.join(root, 'social', 'posted'));
  const eventStatus = readJson(path.join(root, 'social', 'state', 'event-status.json'));
  if (series.length === 0) warnings.push('social/metrics has no follower snapshots');

  let intake = [];
  let treeFiled = [];
  let marjorieFiledForTree = [];
  let content = { mergedContentPRs: null, items: [] };
  if (noGh) {
    warnings.push('--no-gh: GitHub sections (content, time-sensitive, tree asks) skipped');
  } else {
    const api = apiFor(gh);
    const list = (labels) => listIssuesByLabels(api, { repo, labels, state: 'all', limit: 200 });
    intake = await soft('intake issues', warnings, () => list(['intake']), []);
    treeFiled = await soft('tree-filed issues', warnings, () => list(['tree-filed']), []);
    marjorieFiledForTree = await soft('marjorie-filed desk:tree issues', warnings, () => list(['marjorie-filed', 'desk:tree']), []);
    const shipped = await soft('content PRs', warnings, () => fetchContent(repo, win.start), null);
    if (shipped) content = contentSummary(shipped, erasTouched);
  }

  return buildGrowthData({
    win, series, posted, postMetrics, content, eventStatus, warnings,
    coverage: timeSensitiveCoverage(intake, posted, win),
    treeAsks: treeAsksSummary({ treeFiled, marjorieFiledForTree }, win),
  });
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const data = await collect({
    weekEnding: typeof flags['week-ending'] === 'string' ? flags['week-ending'] : undefined,
    repo: typeof flags.repo === 'string' ? flags.repo : REPO,
    noGh: flags['no-gh'] === true,
  });
  const text = `${JSON.stringify(data, null, 2)}\n`;
  if (typeof flags.out === 'string') writeFileSync(flags.out, text);
  else process.stdout.write(text);
  return 0;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/marjorie/growth-data.mjs')) {
  runMain(main, { name: 'growth-data' });
}
