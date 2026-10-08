#!/usr/bin/env node
// Decides a routine's final outcome after `anthropics/claude-code-action` ran
// with `continue-on-error: true`. The action fails the step when a SUCCESSFUL
// session used more turns than --max-turns ("Claude reported a successful
// result after 42 turns, exceeding the configured maximum of 40"); that is a
// false failure. A genuine cutoff (`error_max_turns`), any error, or a missing
// result stays a failure.
//
// A failure message must name its cause. The action hides the session output
// ("full output hidden for security"), so for a long time a failing routine
// logged only `subtype=success is_error=true` — unreadable, and routine-failure
// issues inherited that dead end (issue #5281: six identical failures nobody
// could diagnose). The terminal result message carries the reason; this script
// surfaces it, redacted and truncated, and names the two shapes that are not
// code defects: an exhausted plan-usage window and a session that failed before
// its first API call.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Redacted before anything reaches a (public) Actions log or a filed issue.
const TOKENISH =
  /(?:sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9]{8,}|eyJ[A-Za-z0-9_-]{10,}|[A-Fa-f0-9]{32,}|[A-Za-z0-9+/]{40,}={0,2})/g;
const DETAIL_MAX = 240;

/** Pure: a terminal result message -> a one-line, redacted reason, or null. */
export function resultDetail(result) {
  const raw =
    typeof result?.result === 'string'
      ? result.result
      : typeof result?.error === 'string'
        ? result.error
        : typeof result?.error?.message === 'string'
          ? result.error.message
          : '';
  const text = raw.replace(TOKENISH, '[redacted]').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return text.length > DETAIL_MAX ? `${text.slice(0, DETAIL_MAX)}…` : text;
}

/** Pure: a terminal result message -> a note on why it is not a code defect, or null. */
export function failureHint(result) {
  const detail = resultDetail(result) ?? '';
  const limit = detail.match(/usage limit reached\|?(\d{10,13})?/i);
  if (limit) {
    const stamp = Number(limit[1]);
    const resets =
      Number.isFinite(stamp) && stamp > 0 ? new Date(stamp < 1e12 ? stamp * 1000 : stamp) : null;
    const when =
      resets && !Number.isNaN(resets.getTime()) ? `, resets ${resets.toISOString()}` : '';
    return `plan usage for this account is exhausted${when} — transient, not a code defect; the next scheduled run recovers`;
  }
  const noTurns =
    Number(result?.num_turns ?? 0) <= 1 &&
    Number(result?.total_cost_usd ?? 0) === 0 &&
    Object.keys(result?.modelUsage ?? {}).length === 0;
  if (noTurns && !detail) {
    return 'no model turns ran and nothing was billed — the session failed before its first API call (auth, usage limit, or a rejected CLI argument)';
  }
  return null;
}

/** Pure: execution-log JSON text (or null) -> { pass, message }. */
export function decideOutcome(rawLog, { maxTurns, stepOutcome } = {}) {
  if (stepOutcome === 'success') return { pass: true, message: null };
  if (rawLog == null)
    return { pass: false, message: 'no execution file — treating the routine step as failed' };
  let log;
  try {
    log = JSON.parse(rawLog);
  } catch {
    return {
      pass: false,
      message: 'execution file is not valid JSON — treating the routine step as failed',
    };
  }
  let result = null;
  if (Array.isArray(log)) {
    for (let i = log.length - 1; i >= 0; i -= 1) {
      if (log[i] && log[i].type === 'result') {
        result = log[i];
        break;
      }
    }
  }
  if (!result)
    return {
      pass: false,
      message: 'no terminal result message — treating the routine step as failed',
    };
  if (result.subtype === 'success' && result.is_error === false) {
    if (!(Number(result.num_turns) > Number(maxTurns))) {
      return {
        pass: false,
        message: `action failed but the session was not over its turn cap (turns ${result.num_turns ?? 'unknown'}, cap ${maxTurns ?? 'unknown'}) — routine step failed`,
      };
    }
    return {
      pass: true,
      message: `session used ${result.num_turns ?? 'unknown'} turns (cap ${maxTurns ?? 'unknown'}) — consider raising max_turns`,
    };
  }
  const parts = [
    `session result subtype=${result.subtype ?? 'unknown'} is_error=${result.is_error ?? 'unknown'} — routine step failed`,
  ];
  const detail = resultDetail(result);
  if (detail) parts.push(`reason: ${detail}`);
  const hint = failureHint(result);
  if (hint) parts.push(hint);
  return { pass: false, message: parts.join(' · ') };
}

async function main() {
  const stepOutcome = process.env.STEP_OUTCOME;
  const file = process.env.EXECUTION_FILE;
  let raw = null;
  if (file) {
    try {
      raw = await readFile(file, 'utf8');
    } catch {
      raw = null;
    }
  }
  const { pass, message } = decideOutcome(raw, { maxTurns: process.env.MAX_TURNS, stepOutcome });
  if (pass) {
    if (message) console.log(`::warning::${message}`);
    return 0;
  }
  console.log(`::error::${message}`);
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then((code) => {
    process.exitCode = code;
  });
}
