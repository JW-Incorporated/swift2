import { execFileSync } from 'node:child_process';

// Pure decision/state logic for the GitHub-hosted mobile release train
// (docs/mobile-release.md). Mirrors the jobs of the retired EAS workflow
// (apps/mobile/.eas/workflows/release.yml, kept in git history): the state
// file it produces has the same `jobs[{key,status,turtleBuild}]` shape that
// select-android-build.mjs already validates.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HASH = /^[0-9a-f]{40,64}$/i;
const SETTLED = new Set(['FINISHED', 'ERRORED', 'CANCELED']);

export function parseFingerprint(text) {
  try {
    const j = JSON.parse(String(text).slice(String(text).search(/[[{]/)));
    return typeof j?.hash === 'string' && HASH.test(j.hash) ? j.hash : null;
  } catch {
    return null;
  }
}

// `eas build:list --json` is newest-first; the first row is the candidate. Like
// the EAS get-build job, presence of a build id means "a build exists"; the
// Android selector re-validates it before anything is submitted.
export function pickExisting(text) {
  try {
    const list = JSON.parse(String(text).slice(String(text).search(/[[{]/)));
    const b = Array.isArray(list) ? list[0] : undefined;
    return b && typeof b === 'object' && b.id ? b : null;
  } catch {
    return null;
  }
}

export function decide({ android, ios, force }) {
  const f = Boolean(force);
  let update = 'none';
  if (!f) {
    if (android && ios) update = 'both';
    else if (android) update = 'android';
    else if (ios) update = 'ios';
  }
  return { buildAndroid: !android || f, buildIos: !ios || f, update };
}

export function jobStatus(buildStatus) {
  if (buildStatus === 'FINISHED') return 'SUCCESS';
  if (buildStatus === 'ERRORED') return 'FAILURE';
  if (buildStatus === 'CANCELED' || buildStatus === 'PENDING_CANCEL') return 'CANCELED';
  return 'IN_PROGRESS';
}

export function initialState({ android, ios, decision }) {
  const get = (key, b) => ({ key, status: 'SUCCESS', turtleBuild: b ?? undefined });
  const build = (key, on) => ({ key, status: on ? 'IN_PROGRESS' : 'SKIPPED' });
  return {
    jobs: [
      get('get_android_build', android),
      get('get_ios_build', ios),
      build('build_android', decision.buildAndroid),
      build('build_ios', decision.buildIos),
    ],
  };
}

export function applyBuild(state, key, build) {
  const j = state.jobs.find((x) => x.key === key);
  if (j) {
    j.status = jobStatus(build?.status);
    j.turtleBuild = build ?? undefined;
  }
  return state;
}

// Polls `view(id)` (a parsed `eas build:view --json`) until every id is
// settled or `now()` passes `deadline`. A failed lookup is retried, never fatal.
export async function awaitBuilds({ ids, view, sleep, now, deadline, intervalMs = 60000, log = () => {} }) {
  const builds = {};
  const pending = new Set(Object.keys(ids).filter((k) => ids[k]));
  while (pending.size) {
    for (const k of [...pending]) {
      try {
        const b = await view(ids[k]);
        builds[k] = b;
        if (SETTLED.has(b?.status)) pending.delete(k);
        else log(`${k} build ${ids[k]}: ${b?.status ?? 'unknown'}`);
      } catch (e) {
        log(`${k} build ${ids[k]}: lookup failed (${String(e?.message).split('\n')[0]}); retrying`);
      }
    }
    if (!pending.size) break;
    if (now() >= deadline) return { builds, timedOut: true };
    await sleep(intervalMs);
  }
  return { builds, timedOut: false };
}

// iOS submits only if its build finished AND Android's job is skipped or
// succeeded (the old `submit_ios needs [build_android, build_ios]`).
export function iosSubmitId(state) {
  const by = (k) => state.jobs.find((x) => x.key === k);
  const ios = by('build_ios');
  const and = by('build_android');
  const id = ios?.turtleBuild?.id;
  if (ios?.status !== 'SUCCESS' || ios.turtleBuild?.status !== 'FINISHED') return null;
  if (ios.turtleBuild.platform !== 'IOS' || ios.turtleBuild.buildProfile !== 'production') return null;
  if (!['SKIPPED', 'SUCCESS'].includes(and?.status)) return null;
  return typeof id === 'string' && UUID.test(id) ? id : null;
}

// eas-cli 23.2.0 argument vectors. `build:view` accepts --json but NOT
// --non-interactive (it errors "Nonexistent flag"); the others accept both.
export const viewArgs = (id) => ['build:view', id, '--json'];
export const fingerprintArgs = (platform) => [
  'fingerprint:generate', '--platform', platform, '--environment', 'production', '--json', '--non-interactive',
];
export const listArgs = (platform, hash) => [
  'build:list', '--platform', platform, '--fingerprint-hash', hash, '--build-profile', 'production',
  '--status', 'finished', '--limit', '1', '--json', '--non-interactive',
];

// eas JSON can be huge (fingerprint:generate prints the full sources list,
// ~1.1 MB); Node's default 1 MiB maxBuffer would throw and truncate stdout.
export const EAS_MAX_BUFFER = 64 * 1024 * 1024;
export function runEas(args, { timeout, stderr = 'inherit', exec = execFileSync } = {}) {
  return exec('eas', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', stderr],
    timeout,
    maxBuffer: EAS_MAX_BUFFER,
  });
}
