// Release-train step 3 (replaces the EAS workflow's build jobs' wait): polls
// the store builds started with `eas build --no-wait`, folds their final
// state into the train state file (argv[2]) and emits `ios_submit_id` when the
// iOS submit gate passes. Exits 1 unless every started build FINISHED. A
// timeout does NOT cancel the builds on EAS; they keep running there.
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { applyBuild, awaitBuilds, iosSubmitId, runEas, viewArgs } from './train-lib.mjs';

const view = async (id) => {
  const s = runEas(viewArgs(id), { timeout: 60000, stderr: 'pipe' });
  return JSON.parse(s.slice(s.search(/[[{]/)));
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const statePath = process.argv[2];
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  const ids = { android: process.env.ANDROID_BUILD_ID || '', ios: process.env.IOS_BUILD_ID || '' };
  const deadline = Date.now() + Number(process.env.DEADLINE_MIN || 190) * 60000;
  let ok;
  try {
    const { builds, timedOut } = await awaitBuilds({
      ids,
      view,
      sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
      now: Date.now,
      deadline,
      log: (m) => console.error(m),
    });
    if (timedOut) console.error('::error::Timed out waiting for store builds; they are NOT cancelled and keep running on EAS.');
    for (const [p, key] of [['android', 'build_android'], ['ios', 'build_ios']]) {
      if (ids[p]) applyBuild(state, key, builds[p] ?? { id: ids[p], status: 'IN_PROGRESS' });
    }
    ok = Object.keys(ids).filter((p) => ids[p]).every((p) => builds[p]?.status === 'FINISHED');
  } finally {
    writeFileSync(statePath, JSON.stringify(state));
  }
  const submit = iosSubmitId(state);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `ios_submit_id=${submit ?? ''}\n`);
  process.exit(ok === true ? 0 : 1);
}
