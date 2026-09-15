// Pending-aware allocation/check commands used by the existing alert HA path.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchDispatchChaseState } from './dispatch-chase-state.mjs';
import { allocatePendingHumanActionNumber, checkPendingHumanActionNumber } from './dispatch-chase-apply.mjs';

export async function main(argv = process.argv.slice(2), {
  repo = process.env.GITHUB_REPOSITORY, exec = execFileSync, fetchState = fetchDispatchChaseState,
  log = console.log,
} = {}) {
  const [command, value] = argv;
  if (!['allocate', 'check'].includes(command) || (command === 'check' && !/^[1-9]\d*$/.test(value || ''))) return 2;
  exec('git', ['fetch', 'origin', 'main'], { encoding: 'utf8' });
  const state = await fetchState(repo, { readFileImpl: async (file) => {
    if (!['HUMAN-ACTIONS.md', 'HUMAN-ACTIONS-DONE.md'].includes(file)) throw new Error('unexpected ledger');
    return exec('git', ['show', `origin/main:${file}`], { encoding: 'utf8' });
  } });
  if (command === 'allocate') { log(allocatePendingHumanActionNumber(state)); return 0; }
  const result = checkPendingHumanActionNumber({ ...state, number: Number(value) });
  log(result.valid ? 'unique-pending-reservation' : 'conflict-or-missing-reservation');
  return result.valid ? 0 : 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((code) => { process.exitCode = code; }).catch(() => {
    console.error('dispatch chase ledger: unavailable; no allocation authorized'); process.exitCode = 1;
  });
}
