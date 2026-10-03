// Picks THIS run's Android store build from `eas workflow:status --json`.
// Fails closed: anything not provably this commit's finished production
// Android build yields no build id, so the Play submit is skipped.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function selectAndroidBuild(run, sha) {
  const j = (run?.jobs ?? []).find((x) => x?.key === 'build_android');
  if (!j) return { result: 'absent' };
  if (j.status !== 'SUCCESS') return { result: 'not_success' };
  const b = j.turtleBuild;
  if (
    typeof sha !== 'string' || !sha ||
    typeof b?.gitCommitHash !== 'string' || b.gitCommitHash !== sha
  ) {
    return { result: 'no_build', warning: `build commit ${JSON.stringify(b?.gitCommitHash ?? null)} does not match ${JSON.stringify(sha ?? null)}` };
  }
  if (
    typeof b.id !== 'string' || !UUID.test(b.id) ||
    b.platform !== 'ANDROID' || b.status !== 'FINISHED' || b.buildProfile !== 'production'
  ) {
    return { result: 'no_build', warning: 'build id/platform/status/profile failed validation' };
  }
  return { result: 'success', buildId: b.id };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let out;
  try {
    const s = readFileSync(process.argv[2], 'utf8');
    const run = JSON.parse(s.slice(s.search(/[[{]/)));
    console.error('EAS jobs: ' + JSON.stringify((run.jobs ?? []).map((x) => ({ key: x.key, name: x.name, status: x.status, build: x.turtleBuild?.id ?? null }))));
    out = selectAndroidBuild(run, process.env.GITHUB_SHA);
  } catch {
    out = { result: 'unknown' };
  }
  if (out.warning) console.error(`::warning::Android Play submit SKIPPED: ${out.warning}`);
  console.log(`result=${out.result}`);
  if (out.buildId) console.log(`build_id=${out.buildId}`);
}
