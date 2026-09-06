#!/usr/bin/env node
// Mobile parity check — are iOS and Android carrying the same release?
//
// The release train (apps/mobile/.eas/workflows/release.yml) is designed so
// the platforms cannot drift; this script is the independent proof that they
// have not. It reads EAS state only (no store APIs) and fails when:
//
//   1. STRANDED_OTA   — the latest production update group for a platform
//                       has a runtimeVersion different from that platform's
//                       latest finished store build. Installs of that build
//                       can never receive that update: the platform is stuck
//                       on old JS while the other moves on.
//   2. SPLIT_UPDATE   — the most recent update group does not contain both
//                       platforms (one platform got JS the other did not).
//   3. VERSION_SKEW   — the latest finished store builds disagree on the
//                       marketing version (app.json `version`).
//   4. BUILD_LAG      — the platforms' latest finished store builds come from
//                       different commits and the older one is more than
//                       LAG_HOURS old (a native change reached one store
//                       build but the other platform never got a build).
//
// Usage (from apps/mobile, EXPO_TOKEN or an `eas login` session present):
//   node ../../scripts/mobile/check-parity.mjs [--json] [--lag-hours 48]
// Exit code 0 = in parity, 1 = diverged, 2 = could not check.
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const lagIdx = args.indexOf('--lag-hours');
const LAG_HOURS = lagIdx >= 0 ? Number(args[lagIdx + 1]) : 48;

function eas(cmdArgs) {
  const out = execFileSync(
    'npx',
    ['--no-install', 'eas-cli', ...cmdArgs, '--json', '--non-interactive'],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    },
  );
  // eas prints upgrade notices to stdout before the JSON on some versions.
  const start = out.search(/[[{]/);
  return JSON.parse(out.slice(start));
}

function latestFinishedBuild(builds, platform) {
  return builds
    .filter(
      (b) => b.platform === platform && b.status === 'FINISHED' && String(b.buildProfile || '').startsWith('production'),
    )
    .sort(
      (a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt),
    )[0];
}

const findings = [];
let builds;
let updates;
try {
  builds = eas(['build:list', '--limit', '40']);
  updates = eas(['update:list', '--branch', 'production', '--limit', '10']);
} catch (err) {
  const msg = `could not read EAS state: ${err instanceof Error ? err.message : String(err)}`;
  if (asJson) console.log(JSON.stringify({ ok: false, checkable: false, error: msg }));
  else console.error(msg);
  process.exit(2);
}

const ios = latestFinishedBuild(builds, 'IOS');
const android = latestFinishedBuild(builds, 'ANDROID');

if (!ios || !android) {
  findings.push({
    code: 'NO_BUILD',
    detail: `no finished production build for ${!ios ? 'iOS' : ''}${!ios && !android ? ' and ' : ''}${!android ? 'Android' : ''}`,
  });
}

// eas update:list --json returns { currentPage: [ { group, platforms|updates... } ] }
// across eas-cli versions the shape varies; normalise to [{group, platforms:Set, runtimeVersion, createdAt}].
const groups = new Map();
const rows = Array.isArray(updates) ? updates : (updates?.currentPage ?? updates?.updates ?? []);
for (const row of rows) {
  const list = Array.isArray(row.updates) ? row.updates : [row];
  for (const u of list) {
    const g = u.group ?? row.group;
    if (!g) continue;
    const entry = groups.get(g) ?? {
      group: g,
      platforms: new Set(),
      runtimeVersion: u.runtimeVersion,
      createdAt: u.createdAt ?? row.createdAt,
      message: u.message ?? row.message,
    };
    if (u.platform) entry.platforms.add(String(u.platform).toLowerCase());
    for (const p of row.platforms ?? []) entry.platforms.add(String(p).toLowerCase());
    groups.set(g, entry);
  }
}
const groupList = [...groups.values()].sort(
  (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
);
const latestGroup = groupList[0];

if (latestGroup && !(latestGroup.platforms.has('ios') && latestGroup.platforms.has('android'))) {
  findings.push({
    code: 'SPLIT_UPDATE',
    detail: `latest update group ${latestGroup.group} covers only [${[...latestGroup.platforms].join(', ')}]`,
  });
}

function latestUpdateFor(platform) {
  return groupList.find((g) => g.platforms.has(platform));
}
for (const [name, build] of [
  ['ios', ios],
  ['android', android],
]) {
  if (!build) continue;
  const upd = latestUpdateFor(name);
  if (
    upd &&
    upd.runtimeVersion &&
    build.runtimeVersion &&
    upd.runtimeVersion !== build.runtimeVersion
  ) {
    findings.push({
      code: 'STRANDED_OTA',
      detail: `${name}: latest update runtimeVersion ${upd.runtimeVersion.slice(0, 12)} ≠ latest build ${build.appVersion} (${build.appBuildVersion}) runtimeVersion ${build.runtimeVersion.slice(0, 12)}`,
    });
  }
}

if (ios && android) {
  if (ios.appVersion !== android.appVersion) {
    findings.push({
      code: 'VERSION_SKEW',
      detail: `iOS ${ios.appVersion} vs Android ${android.appVersion}`,
    });
  }
  if (ios.gitCommitHash && android.gitCommitHash && ios.gitCommitHash !== android.gitCommitHash) {
    const older = new Date(ios.completedAt) < new Date(android.completedAt) ? ios : android;
    const ageH = (Date.now() - new Date(older.completedAt)) / 36e5;
    if (ageH > LAG_HOURS) {
      findings.push({
        code: 'BUILD_LAG',
        detail: `store builds from different commits (iOS ${ios.gitCommitHash.slice(0, 8)}, Android ${android.gitCommitHash.slice(0, 8)}); ${older.platform.toLowerCase()} is ${Math.round(ageH)}h behind`,
      });
    }
  }
}

const summary = {
  ok: findings.length === 0,
  checkable: true,
  ios: ios && {
    version: ios.appVersion,
    build: ios.appBuildVersion,
    commit: ios.gitCommitHash?.slice(0, 8),
    runtime: ios.runtimeVersion?.slice(0, 12),
    completedAt: ios.completedAt,
  },
  android: android && {
    version: android.appVersion,
    build: android.appBuildVersion,
    commit: android.gitCommitHash?.slice(0, 8),
    runtime: android.runtimeVersion?.slice(0, 12),
    completedAt: android.completedAt,
  },
  latestUpdate: latestGroup && {
    group: latestGroup.group,
    platforms: [...latestGroup.platforms],
    runtime: latestGroup.runtimeVersion?.slice(0, 12),
    message: latestGroup.message,
  },
  findings,
};

if (asJson) console.log(JSON.stringify(summary, null, 2));
else {
  console.log(
    `iOS     ${summary.ios ? `${summary.ios.version} (${summary.ios.build}) @${summary.ios.commit} rt ${summary.ios.runtime}` : 'no finished production build'}`,
  );
  console.log(
    `Android ${summary.android ? `${summary.android.version} (${summary.android.build}) @${summary.android.commit} rt ${summary.android.runtime}` : 'no finished production build'}`,
  );
  console.log(
    `Update  ${summary.latestUpdate ? `${summary.latestUpdate.group} [${summary.latestUpdate.platforms.join(', ')}] rt ${summary.latestUpdate.runtime}` : 'none published'}`,
  );
  for (const f of findings) console.log(`✖ ${f.code}: ${f.detail}`);
  console.log(findings.length ? 'DIVERGED' : 'IN PARITY');
}
process.exit(findings.length ? 1 : 0);
