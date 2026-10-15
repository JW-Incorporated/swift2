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
import { gh, ghApiSoft } from './lib/gh.mjs';
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
  const prsMerged = prsInWindow.filter((p) => String(p.state).toUpperCase() === 'MERGED').length;
  const prsClosedUnmerged = prsInWindow.filter((p) => String(p.state).toUpperCase() === 'CLOSED').length;
  const prsStale72h = prsInWindow.filter(
    (p) => String(p.state).toUpperCase() === 'OPEN' && new Date(p.createdAt) <= staleThreshold,
  ).length;

  const issuesFiled = issuesInWindow.length;
  const issuesClosed = issuesInWindow.filter((i) => String(i.state).toUpperCase() === 'CLOSED').length;

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

// ---------------------------------------------------------------------------
// GitHub Search API pacing (#5845)
// ---------------------------------------------------------------------------
//
// THE BUG: the Search API allows 30 requests/minute, and that bucket belongs
// to the INSTALLATION token — every other fleet job searching in the same
// minute draws it down too. This script's loop issues 2 searches per routine
// for ~15 routines, and the old shape fired both of a routine's searches with
// `Promise.all` and then moved straight to the next routine, so all ~30 went
// out in well under a minute with zero margin. Three consecutive scheduled
// runs died on the first `403 API rate limit exceeded` (runs 37355399932,
// 38294479288, 38660475179) — a single 403 took the whole report down.
//
// Two mitigations, both needed:
//   1. SPACING. Searches are serialised and paced, so this script consumes at
//      ~20/min rather than bursting, leaving the rest of the fleet a third of
//      the window instead of racing it to zero.
//   2. RETRY. Pacing cannot prevent a collision when another job has already
//      spent the window, so a rate-limited search is retried — waiting until
//      the window's own reset time (read from `/rate_limit`, the authoritative
//      shared-quota answer) when GitHub will tell us, and a fixed backoff when
//      it won't.
/** Minimum gap between two Search API calls: 3s ≈ 20/min against a 30/min cap. */
export const SEARCH_MIN_INTERVAL_MS = Number(process.env.SEARCH_MIN_INTERVAL_MS) || 3_000;
/** Retries after a rate-limited search before the error propagates. */
export const SEARCH_MAX_RETRIES = 2;
/** Ceiling on any single wait, so a bogus reset time can't outlive the job timeout. */
export const SEARCH_MAX_BACKOFF_MS = 75_000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** True for the `403 ... API rate limit exceeded` shape `gh search` reports. */
export function isRateLimitError(err) {
  const text = `${err?.message ?? err} ${err?.stderr ?? ''}`;
  return /rate limit exceeded/i.test(text) || (/\b403\b/.test(text) && /rate limit/i.test(text));
}

/** Milliseconds to hold off, given when the previous search went out (null = none yet). */
export function waitBeforeNextSearch(lastAt, nowMs, interval = SEARCH_MIN_INTERVAL_MS) {
  if (lastAt === null || lastAt === undefined) return 0;
  return Math.min(Math.max(0, interval - (nowMs - lastAt)), interval);
}

/**
 * Milliseconds to wait for the Search window to reset, from a `/rate_limit`
 * payload, or null when the payload doesn't say. One second of slack: the
 * reset second itself is still inside the exhausted window.
 */
export function waitForSearchReset(payload, nowMs) {
  const reset = payload?.resources?.search?.reset;
  if (typeof reset !== 'number' || !Number.isFinite(reset)) return null;
  return Math.min(Math.max(0, reset * 1000 - nowMs) + 1_000, SEARCH_MAX_BACKOFF_MS);
}

/** Fixed fallback backoff for retry `attempt` (1-based), when `/rate_limit` is unreadable. */
export function retryBackoffMs(attempt) {
  return Math.min(attempt * 30_000, SEARCH_MAX_BACKOFF_MS);
}

let lastSearchAt = null;

/** For tests: forget when the last search went out. */
export function resetSearchPacing() {
  lastSearchAt = null;
}

/**
 * One paced, rate-limit-retrying `gh search`. Dependencies are injectable so
 * the pacing and the retry are testable without a network or a real clock.
 */
export async function pacedSearch(args, {
  run = gh,
  sleep = delay,
  now = Date.now,
  quota = () => ghApiSoft('/rate_limit'),
  retries = SEARCH_MAX_RETRIES,
} = {}) {
  for (let attempt = 0; ; attempt++) {
    const gap = waitBeforeNextSearch(lastSearchAt, now());
    if (gap > 0) await sleep(gap);
    lastSearchAt = now();
    try {
      return await run(args);
    } catch (err) {
      if (attempt >= retries || !isRateLimitError(err)) throw err;
      const q = await quota();
      const wait = (q?.ok ? waitForSearchReset(q.data, now()) : null) ?? retryBackoffMs(attempt + 1);
      console.error(
        `⚠ routine-output-sample: GitHub Search rate limit hit on \`gh ${args.slice(0, 2).join(' ')}\`; ` +
        `waiting ${Math.round(wait / 1000)}s for the shared 30/min window ` +
        `(retry ${attempt + 1}/${retries}).`,
      );
      await sleep(wait);
      lastSearchAt = null; // the wait already covers the inter-call gap
    }
  }
}

/** Exported for reuse by routine-quality-sample.mjs — same PR/issue fetch, same query shape. */
export async function fetchForRoutine(identifier, deps = {}) {
  const query = `Tier-2: ${identifier}`;
  // Serial, not Promise.all: two concurrent searches are two against the same
  // 30/min window in the same instant, which is exactly what pacing is for.
  const prsOut = await pacedSearch(
    ['search', 'prs', '--repo', REPO, query, '--limit', '100', '--json', 'number,state,createdAt,closedAt'],
    deps,
  );
  const issuesOut = await pacedSearch(
    ['search', 'issues', '--repo', REPO, query, '--limit', '100', '--json', 'number,state,createdAt'],
    deps,
  );
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
  // worth of queries (same reasoning as fleet-telemetry-snapshot.mjs). Each
  // query inside is additionally paced and rate-limit-retried — see the
  // pacing block above (#5845); at SEARCH_MIN_INTERVAL_MS this loop takes
  // ~90s of wall clock for ~30 searches by design, not by accident.
  for (const r of discovered) {
    if (!r.identifier) {
      routines.push({ name: r.name, identifier: null, metrics: null, prs: [] });
      continue;
    }
    const data = await fetchForRoutine(r.identifier);
    routines.push({ name: r.name, identifier: r.identifier, metrics: computeMetrics(data, now), prs: data.prs });
  }

  // Optional: hand this run's already-fetched raw PR lists to a downstream
  // job (output-sampling.yml's quality-sample) via a build artifact, so it
  // never re-issues the same `gh search prs` queries this process just
  // made — the GitHub Search API's per-minute cap is easy for two jobs in
  // the same run to collide on back-to-back (T5, found via a real dispatch:
  // quality-sample's first attempt hit "API rate limit exceeded" on its
  // second routine because it re-fetched all 13 routines' searches moments
  // after this loop already spent that same window). Unset by default —
  // zero behavior change for anyone running this script standalone.
  if (process.env.RAW_OUTPUT_FILE) {
    await writeFile(
      process.env.RAW_OUTPUT_FILE,
      JSON.stringify(routines.map(({ name, identifier, prs }) => ({ name, identifier, prs }))),
    );
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
