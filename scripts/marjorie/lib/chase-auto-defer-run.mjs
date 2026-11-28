// Deterministic entrypoint (no LLM) for the 7-day silence default. Run by the
// `auto-defer` job in routine-marjorie-ops.yml so it never starts the Sonnet session.
//
// #7175: this file used to end in `.catch(() => { console.error('auto-defer:
// safe failure'); ... })`. When the 2026-11-27 07:45 run failed, that one line
// was the ENTIRE log — no stage, no error class, nothing to diagnose from. Every
// stage now names itself and reports a redacted one-line reason, and the process
// still exits 1. Nothing here ever prints a secret: reasons go through
// `failureDetail`, which is the same redactor the fb-export worker uses.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { applyAutoDefers, planAutoDefers } from './chase-auto-defer.mjs';
import { fetchDispatchChaseState } from './dispatch-chase-state.mjs';
import { failureDetail } from '../../lib/failure-reason.mjs';

const execFileAsync = promisify(execFile);
const shell = (command, args) => execFileAsync(command, args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });

/** The stages a failure can be attributed to, in the order they run. */
export const AUTO_DEFER_STAGES = ['git-fetch', 'git-checkout', 'fetch-state', 'plan', 'apply'];

/** Tags whatever a stage threw with that stage, without losing the original error. */
async function at(stage, step) {
  try {
    return await step();
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error(String(cause));
    if (!error.autoDeferStage) error.autoDeferStage = stage;
    throw error;
  }
}

/** The single log line a failed run leaves behind: which stage, which error class, why. */
export function autoDeferFailureLine(error) {
  const stage = error?.autoDeferStage ?? 'unknown';
  return `auto-defer: ${stage} failed (${error?.name || 'Error'}): ${failureDetail(error)}`;
}

export async function runAutoDefer(repo, { exec = shell, fetchState = fetchDispatchChaseState, ...rest } = {}) {
  await at('git-fetch', () => exec('git', ['fetch', 'origin', 'main']));
  await at('git-checkout', () => exec('git', ['checkout', '--detach', 'origin/main']));
  const state = await at('fetch-state', () => fetchState(repo));
  const due = await at('plan', async () => planAutoDefers(state));
  return at('apply', () => applyAutoDefers(repo, due, { exec, now: state.now, ...rest }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runAutoDefer(process.argv[2] || process.env.GITHUB_REPOSITORY)
    .then((result) => {
      console.log(JSON.stringify({ status: result.status, failed: result.failed ?? [] }));
      // Every due item erroring is a dead lane, not a quiet day: `none` + exit 0 is
      // what let a broken `gh issue comment` go unnoticed for days (#7175).
      if (result.status === 'failed') {
        console.error(`::error::auto-defer: all ${result.failed.length} due item(s) failed; nothing was applied`);
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      console.error(`::error::${autoDeferFailureLine(error)}`);
      process.exitCode = 1;
    });
}
