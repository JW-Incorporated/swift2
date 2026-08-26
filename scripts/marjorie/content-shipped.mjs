// "New on the site since the last brief" — Joey, 2026-08-23: "I shouldn't
// have to check the site on my own." Deterministic: reads merged PRs' changed
// file paths, never asks an LLM to recall what shipped. A path this script
// can't map to a known era renders the raw path, never a guessed link — a
// wrong link is worse than an ugly one for "have a quick look."
import { gh as ghRun } from '../lib/gh.mjs';

const REPO = 'JW-Incorporated/swift2';
const SITE = 'https://www.longlivets.com';

// Seed filename -> the era `id` the app's deep-link scheme actually uses
// (apps/web/lib/longlive/eras.ts). These differ for two eras on purpose —
// guessing from the filename would have produced a dead ?era= link for
// both. Re-verify against eras.ts if either file is ever renamed.
export const ERA_ID_BY_SEED_FILE = {
  '1989': '1989', debut: 'debut', evermore: 'evermore', fearless: 'fearless',
  folklore: 'folklore', lover: 'lover', midnights: 'midnights', red: 'red',
  reputation: 'reputation', 'speak-now': 'speak-now',
  'the-life-of-a-showgirl': 'tloas', 'tortured-poets': 'ttpd',
};

export function eraLink(seedFile) {
  const id = ERA_ID_BY_SEED_FILE[seedFile];
  return id ? `${SITE}/?era=${id}` : null;
}

/** Content-desk branch prefixes / PR labels this section reports on. */
const CONTENT_BRANCH_PREFIXES = [
  'content-shift/', 'content/', 'vault/', 'depth/answerer-', 'lex/',
];
const CONTENT_LABELS = new Set(['content-shift', 'cie']);

export function isContentPR(pr) {
  const branch = String(pr.headRefName || '');
  if (CONTENT_BRANCH_PREFIXES.some((p) => branch.startsWith(p))) return true;
  return (pr.labels || []).some((l) => CONTENT_LABELS.has(typeof l === 'string' ? l : l.name));
}

const SEED_PATH = /^supabase\/seed\/content\/([a-z0-9-]+)\.mjs$/;

/**
 * Map one PR's changed file paths to the eras it touched. Unknown/unmapped
 * paths are returned separately (never silently dropped, never guessed).
 */
export function erasTouched(files) {
  const eras = new Set();
  const unmapped = [];
  for (const f of files) {
    const m = SEED_PATH.exec(f.path || f);
    if (m) {
      const link = eraLink(m[1]);
      if (link) { eras.add(m[1]); continue; }
    }
    unmapped.push(f.path || f);
  }
  return { eras: [...eras], unmapped };
}

/**
 * One report line per content PR merged since `sinceIso`. Never fabricates
 * a claim beyond what the PR's own metadata + changed paths say.
 */
export function renderContentLine(pr, files) {
  const { eras, unmapped } = erasTouched(files);
  const title = String(pr.title || '').replace(/^[a-z()-]+:\s*/i, '').slice(0, 70);
  const prLink = `[#${pr.number}](https://github.com/${REPO}/pull/${pr.number})`;
  if (eras.length === 0) {
    return `- ${title} (${prLink})${unmapped.length ? ` — touched: ${unmapped.slice(0, 3).join(', ')}` : ''}`;
  }
  const eraLinks = eras.map((e) => `[${e}](${eraLink(e)})`).join(', ');
  return `- **${eraLinks}:** ${title} (${prLink})`;
}

/**
 * Fetch merged content-desk PRs since `sinceIso` and their changed files.
 * One `gh pr list` + one `gh pr view --json files` per matching PR — same
 * cost shape as assemble-brief.mjs's existing gate-ticket backfill.
 */
export async function fetchContentShipped(repo = REPO, sinceIso) {
  const { stdout } = await ghRun([
    'pr', 'list', '--repo', repo, '--state', 'merged', '--limit', '100',
    '--json', 'number,title,headRefName,labels,mergedAt',
  ]);
  const merged = JSON.parse(stdout || '[]')
    .filter((p) => p.mergedAt && new Date(p.mergedAt).getTime() > new Date(sinceIso).getTime())
    .filter(isContentPR);

  const withFiles = await Promise.all(merged.map(async (pr) => {
    const { stdout: fout } = await ghRun(['pr', 'view', String(pr.number), '--repo', repo, '--json', 'files']);
    const files = JSON.parse(fout || '{}').files || [];
    return { pr, files: files.map((f) => f.path) };
  }));
  return withFiles;
}

export function renderContentShippedSection(withFiles) {
  if (withFiles.length === 0) return null;
  return withFiles.map(({ pr, files }) => renderContentLine(pr, files));
}
