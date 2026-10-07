#!/usr/bin/env node
// Decides a routine's final outcome after `anthropics/claude-code-action` ran
// with `continue-on-error: true`. The action fails the step when a SUCCESSFUL
// session used more turns than --max-turns ("Claude reported a successful
// result after 42 turns, exceeding the configured maximum of 40"); that is a
// false failure. A genuine cutoff (`error_max_turns`), any error, or a missing
// result stays a failure.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** Pure: execution-log JSON text (or null) -> { pass, message }. */
export function decideOutcome(rawLog, { maxTurns, stepOutcome } = {}) {
  if (stepOutcome === 'success') return { pass: true, message: null };
  if (rawLog == null) return { pass: false, message: 'no execution file — treating the routine step as failed' };
  let log;
  try {
    log = JSON.parse(rawLog);
  } catch {
    return { pass: false, message: 'execution file is not valid JSON — treating the routine step as failed' };
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
  if (!result) return { pass: false, message: 'no terminal result message — treating the routine step as failed' };
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
  return {
    pass: false,
    message: `session result subtype=${result.subtype ?? 'unknown'} is_error=${result.is_error ?? 'unknown'} — routine step failed`,
  };
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
