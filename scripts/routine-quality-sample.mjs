#!/usr/bin/env node
// A4 (Tree Overhaul epic #4117) — output-sampling.yml's second job. Reuses
// routine-output-sample.mjs's discovery/attribution-matching (never
// reimplements `Tier-2:` parsing): for every routine the first job already
// has volume data for (a resolved `Tier-2:` identifier), pick at most
// MAX_PRS_PER_ROUTINE merged PRs from the same WINDOW_DAYS window, at most
// MAX_PRS_PER_WEEK total across the fleet, and — only when that routine's
// charter doc (named by its prompt file's "runtime contract" line) carries a
// `## Sampling rubric` heading — have one cheap Sonnet call (thinking
// disabled, forced-tool response) score the PR 1-3 against that rubric text
// with one evidence sentence grounded in the diff/description.
//
// A routine with no rubric available this week (no Tier-2 tag at all, no
// charter doc named, or a charter doc with no `## Sampling rubric` heading)
// is listed explicitly, never silently dropped — silence would look
// indistinguishable from a clean 3/3 sweep by omission.
//
// Appends a "## Quality sampling" section to the SAME
// docs/audits/routine-output-sampling/<date>.md file the first job just
// wrote (output-sampling.yml's quality-sample job checks out that job's
// branch and pushes a second commit onto the same open PR — no competing
// parallel report).
import { readFileSync } from 'node:fs';
import { appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gh } from './lib/gh.mjs';
import { runMain } from './lib/cli.mjs';
import { callAnthropicMessages, extractToolUseInput } from './lib/anthropic.mjs';
import { discoverRoutines, fetchForRoutine, WINDOW_DAYS } from './routine-output-sample.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'docs', 'audits', 'routine-output-sampling');
const REPO = process.env.GITHUB_REPOSITORY || 'JW-Incorporated/swift2';

export const MODEL = 'claude-sonnet-5';
export const MAX_PRS_PER_ROUTINE = 2;
export const MAX_PRS_PER_WEEK = 30;
export const MAX_DIFF_CHARS = 20_000;
export const RUBRIC_HEADING = '## Sampling rubric';

const THINKING = { type: 'disabled' };
const SCORE_TOOL = {
  name: 'record_quality_score',
  description:
    "Record a 1-3 quality score for one merged routine PR against its charter's sampling rubric, with exactly one evidence sentence.",
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      score: { type: 'integer', enum: [1, 2, 3] },
      evidence: { type: 'string', minLength: 1, maxLength: 400 },
    },
    required: ['score', 'evidence'],
  },
};

/**
 * The charter doc path a routine's prompt file names as its runtime
 * contract, or null. Every current prompt file either says "Your runtime
 * contract is <path>.md" (checked first) or, for the one exception
 * (kevin-stream3-radar.md's lighter framing), "... read <path>.md".
 */
export function resolveCharterDoc(promptText) {
  const contractMatch = /runtime contract is\s+`?([\w./-]+\.md)`?/i.exec(promptText);
  if (contractMatch) return contractMatch[1];
  const readMatch = /\bread\s+`?([\w./-]+\.md)`?/i.exec(promptText);
  return readMatch ? readMatch[1] : null;
}

/**
 * The text under a charter doc's `## Sampling rubric` heading, up to the
 * next `##` heading or end of file. Null when the heading is absent — never
 * guessed, same discipline as resolveIdentifier's null-when-absent.
 */
export function extractRubric(charterText) {
  const m = new RegExp(`^${RUBRIC_HEADING}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|\\n?$)`, 'm').exec(
    charterText,
  );
  const body = m ? m[1].trim() : '';
  return body || null;
}

/**
 * Pure classification of whether a routine can be quality-scored this week.
 * Keeps the three "no rubric" cases distinct (no Tier-2 tag at all, no
 * charter doc named, charter doc with no rubric heading) so the report's
 * note is specific rather than a generic "skipped".
 *
 * @param {{ identifier: string|null, charterDoc?: string|null, charterText?: string|null }} args
 */
export function classifyRubric({ identifier, charterDoc = null, charterText = null }) {
  if (!identifier) {
    return {
      rubric: null,
      reason: 'no `Tier-2:` attribution tag — unsampleable, no PRs can be attributed to it',
    };
  }
  if (!charterDoc) {
    return {
      rubric: null,
      reason: 'its prompt file names no charter doc to hold a rubric',
    };
  }
  if (charterText == null) {
    return { rubric: null, reason: `its charter doc (${charterDoc}) could not be read` };
  }
  const rubric = extractRubric(charterText);
  if (!rubric) {
    return { rubric: null, reason: `${charterDoc} has no "${RUBRIC_HEADING}" heading yet` };
  }
  return { rubric, reason: null };
}

/**
 * Merged PRs within the same WINDOW_DAYS window computeMetrics uses, from a
 * raw fetchForRoutine() result. Case-insensitive state match: `gh search prs
 * --json state` returns lowercase ("merged"), not the GraphQL-style
 * uppercase computeMetrics's own fixtures use — verified against a real PR
 * (repo search, 2026-09-12) after a live dispatch found zero merged PRs
 * fleet-wide despite real recent merges, e.g. #4140 (Tree daily draft).
 */
export function mergedPrsInWindow(prs, now) {
  const windowStart = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  return prs.filter(
    (p) => p.state?.toUpperCase() === 'MERGED' && new Date(p.createdAt) >= windowStart,
  );
}

/**
 * Pure cap logic: from each routine's already-windowed merged-PR list, keep
 * at most `maxPerRoutine` per routine (most-recently-merged first), stopping
 * the whole fleet at `maxTotal`. Routines are processed in the order given
 * (the same discovery order as the first job) — a routine reached after the
 * weekly cap is already spent is not an error, it simply gets none this week.
 *
 * @param {Array<{ name: string, mergedPrs: Array<{number:number,closedAt:string}> }>} routines
 * @param {{ maxPerRoutine?: number, maxTotal?: number }} [caps]
 * @returns {Array<{ name: string, picked: Array<{number:number,closedAt:string}> }>}
 */
export function selectPrsToSample(
  routines,
  { maxPerRoutine = MAX_PRS_PER_ROUTINE, maxTotal = MAX_PRS_PER_WEEK } = {},
) {
  let remaining = maxTotal;
  return routines.map((routine) => {
    if (remaining <= 0) return { name: routine.name, picked: [] };
    const sorted = [...routine.mergedPrs].sort(
      (a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime(),
    );
    const picked = sorted.slice(0, Math.min(maxPerRoutine, remaining));
    remaining -= picked.length;
    return { name: routine.name, picked };
  });
}

/** Extracts and validates a scoring response — an invalid/missing shape is treated as a failure, never guessed. */
export function normalizeScore(response) {
  if (!response || typeof response !== 'object') return null;
  if (![1, 2, 3].includes(response.score)) return null;
  if (typeof response.evidence !== 'string' || !response.evidence.trim()) return null;
  return { score: response.score, evidence: response.evidence.trim() };
}

/** One Sonnet call, forced-tool response, thinking disabled — cheap by design (T5's "keep it cheap"). */
export async function scorePrWithClaude({
  apiKey,
  routineName,
  rubric,
  pr,
  diffText,
  fetchImpl = fetch,
}) {
  const diff =
    diffText.length > MAX_DIFF_CHARS
      ? `${diffText.slice(0, MAX_DIFF_CHARS)}\n(diff truncated at ${MAX_DIFF_CHARS} characters)`
      : diffText;
  const promptText = [
    `Routine: ${routineName}`,
    '',
    "Sampling rubric (from this routine's own charter — score against this, not a generic standard):",
    rubric,
    '',
    `Merged PR #${pr.number}: ${pr.title}`,
    `URL: ${pr.url}`,
    '',
    'PR description:',
    (pr.body && pr.body.trim()) || '(no description)',
    '',
    'Diff:',
    diff,
    '',
    'Score this PR 1-3 against the rubric above. The evidence sentence must cite',
    'something concrete from the diff or description (a file, a check, a specific',
    'behavior) — never a vibe or a restatement of the rubric.',
  ].join('\n');
  const { raw } = await callAnthropicMessages(
    apiKey,
    {
      model: MODEL,
      max_tokens: 300,
      thinking: THINKING,
      tools: [SCORE_TOOL],
      tool_choice: { type: 'tool', name: SCORE_TOOL.name },
      messages: [{ role: 'user', content: [{ type: 'text', text: promptText }] }],
    },
    { fetchImpl, errorLabel: `anthropic quality-sample request for PR #${pr.number}` },
  );
  return extractToolUseInput(raw, { toolName: SCORE_TOOL.name });
}

/**
 * Neutralizes markdown table-breaking characters in free-text (LLM-authored)
 * cell content. Backslashes are escaped FIRST — escaping `|` without also
 * escaping a pre-existing `\` immediately before it lets a `\|` in the
 * source text smuggle an unescaped pipe through as `\\|` (CodeQL: incomplete
 * string escaping, caught in PR #4168 review).
 */
function escapeTableCell(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/**
 * Builds the "## Quality sampling" section appended to the weekly report.
 * Exported and pure for tests, same shape as buildReport().
 *
 * @param {{ date: string, scored: Array<{routineName:string,prNumber:number,prUrl:string,score:number|null,evidence:string|null,error:string|null}>,
 *   noRubric: Array<{name:string, reason:string}> }} args
 */
export function buildQualitySection({ date, scored, noRubric }) {
  const rows = scored.map((s) => {
    const result = s.score
      ? `${s.score} — ${escapeTableCell(s.evidence)}`
      : `not scored (${escapeTableCell(s.error)})`;
    return `| ${s.routineName} | [#${s.prNumber}](${s.prUrl}) | ${result} |`;
  });

  const lines = [
    '',
    `## Quality sampling — ${date}`,
    '',
    'Generated by `scripts/routine-quality-sample.mjs` (output-sampling.yml, second' +
      ' job, A4). At most 2 merged PRs per routine, at most 30/week total, each' +
      " scored 1-3 by one Sonnet call against that routine's own `## Sampling" +
      ' rubric` (its charter doc), one evidence sentence grounded in the diff or' +
      ' description — never a generic standard.',
    '',
    '| Routine | PR | Score |',
    '|---|---|---|',
    ...(rows.length
      ? rows
      : ['| — | — | no merged PRs in this window for any rubric-bearing routine |']),
    '',
    '### No rubric available this week',
    '',
    ...(noRubric.length
      ? noRubric.map((n) => `- **${n.name}**: ${n.reason}.`)
      : ['- Every routine with volume data had a rubric available this week.']),
    '',
  ];
  return lines.join('\n');
}

function loadRubricForRoutine(routine) {
  if (!routine.identifier) return classifyRubric({ identifier: null });
  let charterDoc = null;
  try {
    const promptText = readFileSync(path.join(ROOT, routine.promptFile), 'utf8');
    charterDoc = resolveCharterDoc(promptText);
  } catch {
    // No prompt file readable — charterDoc stays null, handled below.
  }
  if (!charterDoc) return classifyRubric({ identifier: routine.identifier, charterDoc: null });
  let charterText = null;
  try {
    charterText = readFileSync(path.join(ROOT, charterDoc), 'utf8');
  } catch {
    // Charter doc named but unreadable — charterText stays null, handled below.
  }
  return classifyRubric({ identifier: routine.identifier, charterDoc, charterText });
}

/** Job one's raw per-routine PR lists (RAW_OUTPUT_FILE artifact), keyed by routine name — null when unavailable. */
export function readRawPrData(rawDataFile) {
  if (!rawDataFile) return null;
  try {
    const parsed = JSON.parse(readFileSync(rawDataFile, 'utf8'));
    return new Map(parsed.map((r) => [r.name, r.prs || []]));
  } catch {
    return null;
  }
}

async function loadPrDetails(number) {
  const [viewOut, diffOut] = await Promise.all([
    gh(['pr', 'view', String(number), '--json', 'number,title,body,url']),
    gh(['pr', 'diff', String(number)]),
  ]);
  const meta = JSON.parse(viewOut.stdout || '{}');
  return { ...meta, diff: diffOut.stdout || '' };
}

async function main() {
  const date = process.env.REPORT_DATE || new Date().toISOString().slice(0, 10);
  const outFile = path.join(OUT_DIR, `${date}.md`);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const now = new Date();

  const discovered = discoverRoutines();
  const noRubric = [];
  const rubricByRoutine = new Map();
  for (const routine of discovered) {
    const { rubric, reason } = loadRubricForRoutine(routine);
    if (reason) noRubric.push({ name: routine.name, reason });
    else rubricByRoutine.set(routine.name, rubric);
  }

  // Only routines with a resolved Tier-2: identifier have volume data at all.
  // Prefer the first job's own already-fetched PR lists (RAW_DATA_FILE, an
  // artifact from output-sampling.yml's `sample` job) over a fresh
  // `gh search prs` per routine — the Search API's per-minute cap is easy
  // for two jobs in the same run to collide on back-to-back, confirmed by a
  // real dispatch (see routine-output-sample.mjs's RAW_OUTPUT_FILE comment).
  // Falls back to a live fetch when no artifact is available (standalone
  // runs, e.g. local testing).
  const rawPrsByRoutine = readRawPrData(process.env.RAW_DATA_FILE);
  const withVolume = discovered.filter((r) => r.identifier);
  const routinesWithPrs = [];
  for (const routine of withVolume) {
    const prs = rawPrsByRoutine
      ? (rawPrsByRoutine.get(routine.name) ?? [])
      : (await fetchForRoutine(routine.identifier)).prs;
    routinesWithPrs.push({ name: routine.name, mergedPrs: mergedPrsInWindow(prs, now) });
  }

  const selections = selectPrsToSample(routinesWithPrs);

  const scored = [];
  for (const selection of selections) {
    const rubric = rubricByRoutine.get(selection.name);
    if (!rubric) continue; // already logged in noRubric above — never scored against nothing
    for (const pr of selection.picked) {
      const fallbackUrl = `https://github.com/${REPO}/pull/${pr.number}`;
      try {
        const details = await loadPrDetails(pr.number);
        if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
        const response = await scorePrWithClaude({
          apiKey,
          routineName: selection.name,
          rubric,
          pr: details,
          diffText: details.diff,
        });
        const normalized = normalizeScore(response);
        scored.push({
          routineName: selection.name,
          prNumber: pr.number,
          prUrl: details.url || fallbackUrl,
          score: normalized?.score ?? null,
          evidence: normalized?.evidence ?? null,
          error: normalized ? null : 'invalid or missing scoring response',
        });
      } catch (error) {
        scored.push({
          routineName: selection.name,
          prNumber: pr.number,
          prUrl: fallbackUrl,
          score: null,
          evidence: null,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  const section = buildQualitySection({ date, scored, noRubric });

  if (process.env.DRY_RUN === 'true') {
    console.log(
      `DRY RUN — would append to docs/audits/routine-output-sampling/${date}.md\n\n${section}`,
    );
    return;
  }

  await appendFile(outFile, section);
  console.log(
    `routine-quality-sample: appended quality section to docs/audits/routine-output-sampling/${date}.md`,
  );
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'routine-quality-sample' });
}
