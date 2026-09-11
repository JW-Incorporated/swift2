#!/usr/bin/env node
// Routine usage telemetry — closes the VISIBILITY gap `fleet-telemetry-
// snapshot.yml` admits it cannot see: per-run turn count, duration, and a
// list-price cost-equivalent for a single `routine-*.yml` run.
//
// NOT dollar hard-capping — architecturally impossible here. Every routine
// authenticates via `CLAUDE_CODE_OAUTH_TOKEN` (`routine-template.yml`'s
// header), Joey's shared Claude Pro/Max plan-usage pool, not metered
// per-token billing. `total_cost_usd` below is therefore a LIST-PRICE
// EQUIVALENT under that plan-usage model, not a real billed dollar amount —
// the actual constraint remains Joey's plan rate limit, not money.
//
// Reads `anthropics/claude-code-action@v1`'s `execution_file` output: a JSON
// array of SDK message-log entries, whose terminal `type: 'result'` entry
// carries `num_turns`, `duration_ms`, `usage`, and `total_cost_usd`
// (confirmed against the upstream action's own README.md example, which
// reads that same file for its `type === 'result'` entry).
//
// Called with `if: always()` right after the routine step, so this must run
// even when the routine itself failed (that is exactly when the turn count
// matters most — early warning for turn-exhaustion failures) and must NEVER
// fail the job — every path below either writes a report or logs a no-op
// notice and returns, never throws past `main()`.
import { writeFile, readFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Finds the terminal SDK `result` message in an execution-file JSON array.
 * Returns `null` when the log is empty, not an array, or has no result
 * entry — every caller treats `null` as "nothing to report", not an error.
 * Exported and pure for tests.
 */
export function findResultMessage(executionLog) {
  if (!Array.isArray(executionLog)) return null;
  for (let i = executionLog.length - 1; i >= 0; i--) {
    const entry = executionLog[i];
    if (entry && entry.type === 'result') return entry;
  }
  return null;
}

/**
 * Builds the small JSON artifact payload from a parsed result message plus
 * the routine's static config. Exported and pure for tests.
 */
export function buildUsageRecord({ routineName, model, maxTurns, result }) {
  return {
    routineName,
    model,
    maxTurns,
    numTurns: result.num_turns ?? null,
    durationMs: result.duration_ms ?? null,
    totalCostUsd: result.total_cost_usd ?? null,
    usage: result.usage ?? null,
    generatedAt: new Date().toISOString(),
  };
}

/** True when `numTurns` is at or above 90% of `maxTurns` — the early-warning threshold. */
export function isNearTurnLimit(numTurns, maxTurns) {
  if (!Number.isFinite(numTurns) || !Number.isFinite(maxTurns) || maxTurns <= 0) return false;
  return numTurns >= 0.9 * maxTurns;
}

function formatDuration(ms) {
  if (!Number.isFinite(ms)) return 'unknown';
  const seconds = Math.round(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatCost(usd) {
  return Number.isFinite(usd) ? `$${usd.toFixed(4)} (list-price equivalent, not billed)` : 'unknown';
}

/** Renders the human-readable job-summary/notice block. Exported and pure for tests. */
export function renderSummary(record) {
  const { routineName, model, numTurns, maxTurns, durationMs, totalCostUsd } = record;
  const turnsDisplay = Number.isFinite(numTurns) ? numTurns : 'unknown';
  const maxTurnsDisplay = Number.isFinite(maxTurns) ? maxTurns : 'unknown';
  return [
    `## Routine usage — ${routineName}`,
    '',
    `- Model: \`${model}\``,
    `- Turns: ${turnsDisplay} / ${maxTurnsDisplay}`,
    `- Duration: ${formatDuration(durationMs)}`,
    `- Cost (list-price equivalent, not a real bill — this account uses shared plan-usage): ${formatCost(totalCostUsd)}`,
    '',
  ].join('\n');
}

async function appendStepSummary(text) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) return;
  try {
    await appendFile(summaryFile, `\n${text}\n`);
  } catch (err) {
    console.error(`routine-usage-report: could not write job summary: ${err?.message ?? err}`);
  }
}

async function main() {
  const routineName = process.env.ROUTINE_NAME || 'unknown-routine';
  const model = process.env.ROUTINE_MODEL || 'unknown-model';
  const maxTurns = Number(process.env.MAX_TURNS);
  const executionFilePath = process.env.EXECUTION_FILE;
  const outFile = process.env.ROUTINE_USAGE_OUT || path.resolve('routine-usage.json');

  if (!executionFilePath) {
    console.log(`::notice::routine-usage-report: no EXECUTION_FILE set for ${routineName} — nothing to report (no-op).`);
    return 0;
  }

  let raw;
  try {
    raw = await readFile(executionFilePath, 'utf8');
  } catch (err) {
    console.log(
      `::notice::routine-usage-report: could not read execution file for ${routineName} (${err?.message ?? err}) — nothing to report (no-op).`,
    );
    return 0;
  }

  let executionLog;
  try {
    executionLog = JSON.parse(raw);
  } catch (err) {
    console.log(
      `::notice::routine-usage-report: execution file for ${routineName} was not valid JSON (${err?.message ?? err}) — nothing to report (no-op).`,
    );
    return 0;
  }

  const result = findResultMessage(executionLog);
  if (!result) {
    console.log(`::notice::routine-usage-report: no terminal 'result' message found for ${routineName} — nothing to report (no-op).`);
    return 0;
  }

  const record = buildUsageRecord({ routineName, model, maxTurns, result });
  const summary = renderSummary(record);

  console.log(`::notice::${summary.replace(/\n/g, ' ')}`);
  await appendStepSummary(summary);

  if (isNearTurnLimit(record.numTurns, record.maxTurns)) {
    console.log(
      `::warning::routine-usage-report: ${routineName} used ${record.numTurns}/${record.maxTurns} turns (≥90% of max-turns) — at risk of turn-exhaustion failure.`,
    );
  }

  try {
    await writeFile(outFile, JSON.stringify(record, null, 2) + '\n');
  } catch (err) {
    console.log(`::notice::routine-usage-report: could not write ${outFile} (${err?.message ?? err}) — reported above only.`);
  }

  return 0;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  // This step must never fail the job (see module header) — `main()` already
  // catches every known failure path internally and returns 0; this catch is
  // a last-resort net for anything genuinely unexpected, which still resolves
  // to a clean exit rather than a failed step.
  main()
    .then((code) => {
      if (typeof code === 'number') process.exitCode = code;
    })
    .catch((err) => {
      console.log(`::notice::routine-usage-report: unexpected error (${err?.message ?? err}) — treated as no-op.`);
      process.exitCode = 0;
    });
}
