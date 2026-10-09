// Deterministic entrypoint (no LLM) for the 7-day silence default. Run by the
// `auto-defer` job in routine-marjorie-ops.yml so it never starts the Sonnet session.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { applyAutoDefers, planAutoDefers } from './chase-auto-defer.mjs';
import { fetchDispatchChaseState } from './dispatch-chase-state.mjs';

const execFileAsync = promisify(execFile);
const shell = (command, args) => execFileAsync(command, args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });

export async function runAutoDefer(repo, { exec = shell, fetchState = fetchDispatchChaseState, ...rest } = {}) {
  await exec('git', ['fetch', 'origin', 'main']);
  await exec('git', ['checkout', '--detach', 'origin/main']);
  const state = await fetchState(repo);
  const due = planAutoDefers(state);
  return applyAutoDefers(repo, due, { exec, now: state.now, ...rest });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runAutoDefer(process.argv[2] || process.env.GITHUB_REPOSITORY)
    .then((result) => console.log(JSON.stringify({ status: result.status })))
    .catch(() => { console.error('auto-defer: safe failure'); process.exitCode = 1; });
}
