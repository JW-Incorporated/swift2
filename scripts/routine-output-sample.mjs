#!/usr/bin/env node
// Weekly, zero-LLM quality-signal report on what the Claude Code judgment
// routines (Karen, Kevin, Marjorie, Nils, Paul, Austin, Vault Run, etc.)
// actually produce, using the T-20 attribution trailer as a deterministic,
// greppable join key across the fleet.
//
// THE ENABLER: every `docs/agents/runner-prompts/*.md` routine prompt
// requires its PR/issue bodies to carry a verbatim `Tier-2: <Identifier>`
// line (T-20 Phase 1, docs/TIER2-OPTIMIZATION.md). This script resolves
// that identifier PER ROUTINE by reading the prompt file directly (never
// hardcoded — a prompt file is the single source of truth for its own tag,
// same reasoning as docs/kevin.md's "never hardcode" note on ticket
// exclusions), then greps GitHub PRs/issues for it over the last 7 days.
//
// THE ROUTINE SET is discovered from `.github/workflows/routine-*.yml`
// (reusing `listRoutineWorkflowFiles` from check-routine-workflows.mjs —
// one source of truth for "what counts as a routine"), each of which names
// its own `prompt_file:`. A workflow whose prompt file has no `Tier-2:`
// line is reported with a null identifier and flagged rather than guessed.
//
// ZERO LLM, ZERO SCORING. This only answers two questions per routine: is
// it still producing output in the last 7 days, and is a human/CI rejecting
// that output (closed-unmerged PRs) at an unusual rate. No quality judgment.
//
// Pagination discipline follows fleet-telemetry-snapshot.mjs: `gh search`
// here is bounded by `--limit 100` per routine (15 small queries, not one
// unbounded repo-wide crawl), which is more than an order of magnitude
// above any single routine's realistic weekly PR+issue volume.
import { readFileSync, readdirSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gh } from './lib/gh.mjs';
import { runMain } from './lib/cli.mjs';
import { WORKFLOWS_DIR, listRoutineWorkflowFiles } from './check-routine-workflows.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'docs', 'audits', 'routine-output-sampling');
const REPO = process.env.GITHUB_REPOSITORY || 'JW-Incorporated/swift2';
export const WINDOW_DAYS = 7;
const STALE_HOURS = 72;
const CLOSED_UNMERGED_FLAG_RATE = 0.4;

/** The `prompt_file:` value a `routine-*.yml` workflow points at, or null. */
export function extractPromptFile(text) {
  const m = /^\s*prompt_file:\s*(\S+)\s*$/m.exec(text);
  return m ? m[1].trim() : null;
}

/**
 * The exact `Tier-2: <Identifier>` string a prompt file requires its
 * PR/issue bodies to carry, or null when the prompt file carries no such
 * line — a real gap (missing attribution convention), never guessed.
 */
export function resolveIdentifier(promptText) {
  const m = /Tier-2:\s*([^`\n]+)/.exec(promptText);
  return m ? m[1].trim() : null;
}

/**
 * Per-routine metrics over the last WINDOW_DAYS, from raw
 * `gh search prs`/`gh search issues --json ...` results. Pure and exported
 * for tests — takes `now` so tests are deterministic.
 *
 * @param {{ prs: Array<{number:number,state:string,createdAt:string,closedAt:string|null}>,
 *            issues: Array<{number:number,state:string,createdAt:string}> }} data
 * @param {Date} now
 */
export function computeMetrics({ prs, issues }, now) {
  const windowStart = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const staleThreshold = new Date(now.getTime() - STALE_HOURS * 60 * 60 * 1000);

  const prsInWindow = prs.filter((p) => new Date(p.createdAt) >= windowStart);
  const issuesInWindow = issues.filter((i) => new Date(i.createdAt) >= windowStart);

  const prsOpened = prsInWindow.length;
  const prsMerged = prsInWindow.filter((p) => p.state === 'MERGED').length;
  const prsClosedUnmerged = prsInWindow.filter((p) => p.state === 'CLOSED').length;
  const prsStale72h = prsInWindow.filter(
    (p) => p.state === 'OPEN' && new Date(p.createdAt) <= staleThreshold,
  ).length;

  const issuesFiled = issuesInWindow.length;
  const issuesClosed = issuesInWindow.filter((i) => i.state === 'CLOSED').length;

  const closedUnmergedRate = prsOpened > 0 ? prsClosedUnmerged / prsOpened : 0;
  const zeroOutput = prsOpened === 0 && issuesFiled === 0;
  const highRejectRate = closedUnmergedRate > CLOSED_UNMERGED_FLAG_RATE;

  return {
    prsOpened,
    prsMerged,
    prsClosedUnmerged,
    prsStale72h,
    issuesFiled,
    issuesClosed,
    closedUnmergedRate,
    zeroOutput,
    highRejectRate,
  };
}

/**
 * Builds the markdown report. Exported and pure for tests.
 *
 * @param {{ date: string, repo: string,
 *   routines: Array<{ name: string, identifier: string|null, metrics: object|null }> }} args
 */
export function buildReport({ date, repo, routines }) {
  const pct = (r) => `${Math.round(r * 100)}%`;

  const rows = routines.map((r) => {
    if (!r.identifier || !r.metrics) {
      return `| ${r.name} | — | — | — | — | — | — | no \`Tier-2:\` line in prompt file |`;
    }
    const m = r.metrics;
    return (
      `| ${r.name} | ${m.prsOpened} | ${m.prsMerged} | ${m.prsClosedUnmerged} ` +
      `(${pct(m.closedUnmergedRate)}) | ${m.prsStale72h} | ${m.issuesFiled} | ${m.issuesClosed} | |`
    );
  });

  const flagged = [];
  for (const r of routines) {
    if (!r.identifier) {
      flagged.push(`- **${r.name}**: no \`Tier-2:\` attribution line found in its prompt file — cannot be sampled.`);
      continue;
    }
    if (r.metrics.zeroOutput) {
      flagged.push(`- **${r.name}** (\`${r.identifier}\`): zero PRs and zero issues in the last ${WINDOW_DAYS} days.`);
    }
    if (r.metrics.highRejectRate) {
      flagged.push(
        `- **${r.name}** (\`${r.identifier}\`): closed-unmerged rate ${pct(r.metrics.closedUnmergedRate)} ` +
          `(${r.metrics.prsClosedUnmerged}/${r.metrics.prsOpened} PRs) — above the ${pct(CLOSED_UNMERGED_FLAG_RATE)} threshold.`,
      );
    }
  }

  const lines = [
    `# Routine output sampling — ${date}`,
    '',
    `Generated by \`scripts/routine-output-sample.mjs\` (report-only, zero-LLM,` +
      ' `.github/workflows/output-sampling.yml`). Repo: `' + repo + '`.' +
      ` Window: PRs/issues created in the last ${WINDOW_DAYS} days, matched on the` +
      ' T-20 attribution trailer (`Tier-2: <Identifier>`) required in every routine' +
      ' PR/issue body (docs/agents/runner-prompts/*.md, docs/TIER2-OPTIMIZATION.md' +
      ' § T-20). No LLM calls, no quality scoring — this only answers "is this' +
      ' routine still producing" and "is a human/CI rejecting its work at an' +
      ' unusual rate" (closed-unmerged PRs).',
    '',
    '| Routine | PRs opened | PRs merged | PRs closed-unmerged | PRs open >72h | Issues filed | Issues closed | Notes |',
    '|---|---|---|---|---|---|---|---|',
    ...rows,
    '',
    '## Flagged',
    '',
    ...(flagged.length ? flagged : ['- Nothing flagged this window.']),
    '',
  ];
  return lines.join('\n');
}

/**
 * The routines to sample: workflow name, prompt file, resolved identifier.
 * Exported so routine-quality-sample.mjs (output-sampling.yml's second job)
 * reuses this exact discovery/attribution-matching instead of reimplementing
 * `Tier-2:` parsing.
 */
export function discoverRoutines() {
  const dir = path.join(ROOT, WORKFLOWS_DIR);
  const dirents = readdirSync(dir);
  const files = listRoutineWorkflowFiles(dirents);

  return files.map((f) => {
    const workflowPath = path.join(dir, f);
    const workflowText = readFileSync(workflowPath, 'utf8');
    const nameMatch = /^name:\s*(.+)\s*$/m.exec(workflowText);
    const name = nameMatch ? nameMatch[1].trim() : f;
    const promptFile = extractPromptFile(workflowText);
    let identifier = null;
    if (promptFile) {
      try {
        const promptText = readFileSync(path.join(ROOT, promptFile), 'utf8');
        identifier = resolveIdentifier(promptText);
      } catch {
        identifier = null;
      }
    }
    return { name, promptFile, identifier };
  });
}

/** Exported for reuse by routine-quality-sample.mjs — same PR/issue fetch, same query shape. */
export async function fetchForRoutine(identifier) {
  const query = `Tier-2: ${identifier}`;
  const [prsOut, issuesOut] = await Promise.all([
    gh(['search', 'prs', '--repo', REPO, query, '--limit', '100', '--json', 'number,state,createdAt,closedAt']),
    gh(['search', 'issues', '--repo', REPO, query, '--limit', '100', '--json', 'number,state,createdAt']),
  ]);
  return {
    prs: JSON.parse(prsOut.stdout || '[]'),
    issues: JSON.parse(issuesOut.stdout || '[]'),
  };
}

async function main() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const outFile = `${date}.md`;

  const discovered = discoverRoutines();

  const routines = [];
  // Sequential, not Promise.all: shares one rate limit across 15 routines'
  // worth of queries (same reasoning as fleet-telemetry-snapshot.mjs).
  for (const r of discovered) {
    if (!r.identifier) {
      routines.push({ name: r.name, identifier: null, metrics: null });
      continue;
    }
    const data = await fetchForRoutine(r.identifier);
    routines.push({ name: r.name, identifier: r.identifier, metrics: computeMetrics(data, now) });
  }

  const report = buildReport({ date, repo: REPO, routines });

  if (process.env.DRY_RUN === 'true') {
    console.log(`DRY RUN — would write docs/audits/routine-output-sampling/${outFile}\n\n${report}`);
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, outFile), report);
  console.log(`routine-output-sample: wrote docs/audits/routine-output-sampling/${outFile}`);
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'routine-output-sample' });
}
