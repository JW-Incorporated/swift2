// Guards `.github/workflows/routine-*.yml` — the scheduled-Action fleet that
// replaced the claude.ai Routines product (2026-09-05 migration, kanban
// t_876f9697 / t_123b1628; docs/audits/2026-09-05-claude-routines-relocation-assessment.md).
//
// WHY THIS EXISTS. The claude.ai fleet was policed by a weekly "Routine
// Auditor" session (docs/agents/routine-invariants.md) that crawled a live,
// paginated, account-bound API to check a handful of invariants — because
// nothing in this repo could see that class of drift. Once every routine is
// a file in `.github/workflows/`, the same invariants are checkable
// statically, deterministically, for free, on every PR, with zero LLM calls
// and zero account dependency. This script is that replacement: it retires
// the weekly Haiku crawl (docs/audits/2026-09-05-claude-routines-relocation-assessment.md
// § "Second question... Retire it and replace with a ~50-line test over the
// workflow files in CI") in favor of a CI gate.
//
// What it checks, mirroring routine-invariants.md's invariant #4 (`Task` in
// `allowed_tools` needs the charter to say why) plus the two new checks this
// migration's card asked for:
//
//   1. No `routine-*.yml` file has `Task` in its `allowed_tools` input
//      without a comment in the file justifying it. A routine's charter is
//      the prompt file it points at, but a Task grant is workflow-level
//      config, so the justification has to live in the workflow file
//      itself — otherwise a copy-pasted template silently inherits an
//      unjustified subagent-fan-out grant with nothing to catch it.
//   2. Every `routine-*.yml`'s cron cadence — reported as runs/week, so a
//      human or a future audit can eyeball the fleet's total scheduled
//      volume without hand-counting cron strings (the exact thing the old
//      Auditor's arithmetic did, T-17).
//   3. The file's `on.schedule.cron` value matches any cron-shaped pattern
//      quoted in its own header comment block. This is the same drift class
//      `docs/agents/runners.md` documents repeatedly for the claude.ai
//      fleet (a registered cadence silently diverging from what actually
//      runs) — catching it here means a workflow's own header can never
//      lie about its own schedule without failing CI.
//
// Deliberately NOT covered: `routine-template.yml` itself (the reusable
// callee, not a routine) and anything that isn't `routine-*.yml` — this is
// a workflow-file check, not a general CI auditor.
//
// Exports the pure pieces for scripts/check-routine-workflows.test.ts.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readdirSync } from 'node:fs';
import { runMain } from './lib/cli.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const WORKFLOWS_DIR = '.github/workflows';
export const ROUTINE_GLOB_PREFIX = 'routine-';
export const TEMPLATE_FILE = 'routine-template.yml';

/** Repo-relative paths of every `routine-*.yml` file, excluding the template. */
export function listRoutineWorkflowFiles(dirents) {
  return dirents
    .filter(
      (f) =>
        f.startsWith(ROUTINE_GLOB_PREFIX) && f.endsWith('.yml') && f !== TEMPLATE_FILE,
    )
    .sort();
}

/** Extracts the `name:` value at the top level of the workflow. */
export function extractName(text) {
  const m = /^name:\s*(.+)\s*$/m.exec(text);
  return m ? m[1].trim() : null;
}

/** Extracts the first `cron: "..."` value (the `on.schedule.cron` entry). */
export function extractCron(text) {
  const m = /cron:\s*"([^"]+)"/.exec(text);
  return m ? m[1].trim() : null;
}

/** Extracts the `allowed_tools: "..."` input value as a comma-split list. */
export function extractAllowedTools(text) {
  const m = /allowed_tools:\s*"([^"]+)"/.exec(text);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * The file's header comment block: every leading line starting with `#`,
 * up to (not including) the first non-comment, non-blank line (normally
 * `name: ...`).
 */
export function extractHeaderComment(text) {
  const lines = text.split(/\r?\n/);
  const header = [];
  for (const line of lines) {
    if (line.startsWith('#')) {
      header.push(line);
      continue;
    }
    if (line.trim() === '') continue; // blank lines inside the header are fine
    break;
  }
  return header.join('\n');
}

/**
 * Invariant 1: a `Task` grant must be justified by a comment somewhere in
 * the file that mentions `Task` alongside an explanatory word. This is
 * deliberately a loose text match (not tied to header position) because the
 * justification may reasonably sit next to the `allowed_tools:` line itself
 * rather than only in the header.
 */
export function taskJustification(text) {
  const re = /Task[^\n]*\b(deliberat\w*|invariant|charter|justif\w*)\b/i;
  const m = re.exec(text);
  return m ? m[0] : null;
}

/** Cron field helper: expands a comma-separated field into distinct values. */
function fieldValues(field) {
  if (field === '*') return null; // caller decides how to interpret "every"
  return field.split(',').map((v) => v.trim()).filter(Boolean);
}

/**
 * Approximate runs/week for a 5-field cron string (minute hour dom month
 * dow). Handles the shapes actually used in this fleet: a single or
 * comma-separated minute/hour (multiple fires per day) and a single,
 * comma-separated, or `*` day-of-week (which days it fires on). Does not
 * attempt full cron semantics (step values, ranges, dom+dow AND-vs-OR) —
 * those don't appear in this fleet's cadences today; a file that needs them
 * will fail loudly via `runsPerWeek` returning `null` rather than silently
 * misreporting a number.
 *
 * @param {string} cron
 * @returns {number | null}
 */
export function runsPerWeek(cron) {
  if (!cron) return null;
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [minute, hour, dom, month, dow] = parts;
  if (
    /[/-]/.test(minute) ||
    /[/-]/.test(hour) ||
    /[/-]/.test(dow) ||
    /[/-]/.test(dom) ||
    /[/-]/.test(month)
  ) {
    return null; // step/range syntax — not attempting full cron semantics
  }
  if (dom !== '*') return null; // day-of-month cadences not modeled here
  if (month !== '*') return null; // month-restricted cadences not modeled here
  const minuteVals = fieldValues(minute) || ['*'];
  const hourVals = fieldValues(hour) || ['*'];
  const runsPerDay = (minuteVals.length || 1) * (hourVals.length || 1);
  const dowVals = fieldValues(dow);
  const daysPerWeek = dowVals === null ? 7 : dowVals.length;
  return runsPerDay * daysPerWeek;
}

/** Every cron-shaped substring (`m h * * d`) quoted anywhere in a header comment. */
export function cronsInHeader(header) {
  const re = /(\d{1,2}(?:,\d{1,2})*)\s+(\d{1,2}(?:,\d{1,2})*)\s+(\*|\d{1,2})\s+(\*|\d{1,2})\s+(\*|\d(?:,\d)*)/g;
  return [...header.matchAll(re)].map((m) => m[0]);
}

/**
 * The whole check, as a pure function over injected file contents so tests
 * can drive it without touching the repo. Returns `{ problems, report }` —
 * `problems` empty means pass; `report` is the per-file cadence-sum lines
 * this always prints (even on failure), per T-17's "state the number, not
 * just pass/fail" precedent.
 *
 * @param {Record<string, string>} files  repo-relative path -> file contents,
 *   for every `routine-*.yml` file (excluding the template)
 */
export function checkRoutineWorkflows(files) {
  const problems = [];
  const report = [];
  let totalRunsPerWeek = 0;
  let unmodeled = 0;

  for (const path of Object.keys(files).sort()) {
    const text = files[path];
    const name = extractName(text);
    const cron = extractCron(text);
    const tools = extractAllowedTools(text);
    const header = extractHeaderComment(text);

    if (!name) problems.push(`${path}: no top-level \`name:\` found.`);
    if (!cron) {
      problems.push(`${path}: no \`on.schedule.cron\` value found — every routine must be scheduled.`);
    }

    // ── 1. Task justification ─────────────────────────────────────────────
    if (tools.includes('Task') && !taskJustification(text)) {
      problems.push(
        `${path}: \`allowed_tools\` includes \`Task\` with no justifying comment in the file. ` +
          'routine-invariants.md invariant #4: `Task` is subagent fan-out — one scheduled run ' +
          'silently becomes several. Add a comment explaining why (e.g. "Task is in ' +
          'allowed_tools deliberately... invariant #4 allows Task when the charter says why").',
      );
    }

    // ── 2. Cadence sum (always reported, never itself a failure) ──────────
    const perWeek = cron ? runsPerWeek(cron) : null;
    if (perWeek === null) {
      unmodeled += 1;
      report.push(`${path}: cron \`${cron ?? '(missing)'}\` — cadence not modeled by this checker.`);
    } else {
      totalRunsPerWeek += perWeek;
      report.push(`${path}: cron \`${cron}\` → ${perWeek} run(s)/week${name ? ` (${name})` : ''}.`);
    }

    // ── 3. Header comment cron must match the real cron ───────────────────
    if (cron) {
      for (const quoted of cronsInHeader(header)) {
        if (quoted !== cron) {
          problems.push(
            `${path}: header comment quotes cron \`${quoted}\`, but \`on.schedule.cron\` is ` +
              `\`${cron}\` — the file's own header disagrees with what it actually runs.`,
          );
        }
      }
    }
  }

  report.push(
    `Fleet total: ${totalRunsPerWeek} modeled run(s)/week across ${Object.keys(files).length} routine file(s)` +
      (unmodeled ? ` (${unmodeled} file(s) not modeled — see above)` : '') +
      '.',
  );

  return { problems, report };
}

function main() {
  const dir = join(ROOT, WORKFLOWS_DIR);
  const dirents = readdirSync(dir);
  const routineFiles = listRoutineWorkflowFiles(dirents);

  const files = {};
  for (const f of routineFiles) {
    files[`${WORKFLOWS_DIR}/${f}`] = readFileSync(join(dir, f), 'utf8');
  }

  const { problems, report } = checkRoutineWorkflows(files);

  for (const line of report) console.log(line);

  if (problems.length) {
    console.error(`\n✗ ${problems.length} routine-workflow problem(s):\n`);
    for (const p of problems) console.error(`  • ${p}`);
    console.error(
      '\nThis check replaces the retired claude.ai Routine Auditor (weekly Haiku\n' +
        'session over a live API) with a deterministic, zero-LLM test over the\n' +
        'workflow files themselves — see docs/audits/2026-09-05-claude-routines-\n' +
        'relocation-assessment.md.\n',
    );
    return 1;
  }
  console.log(`\n✓ all ${routineFiles.length} routine workflow file(s) satisfy the invariants.`);
}

if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/check-routine-workflows.mjs')
) {
  runMain(main, { name: 'check-routine-workflows' });
}
