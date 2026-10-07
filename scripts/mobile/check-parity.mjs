#!/usr/bin/env node
// Mobile parity check — are iOS and Android carrying the same release?
//
// The release train (.github/workflows/mobile-release.yml) is designed so
// the platforms cannot drift; this script is the independent proof that they
// have not. It reads EAS state only (no store APIs) and fails when:
//
//   1. STRANDED_OTA   — the newest production update for a platform has a
//                       runtimeVersion different from that platform's latest
//                       finished store build. Installs of that build can
//                       never receive that update: the platform is stuck on
//                       old JS while the other moves on.
//   2. SPLIT_UPDATE   — the newest PUBLISH did not reach both platforms (one
//                       platform got JS the other did not) and the platform
//                       that missed it is not already carrying that same
//                       commit in its latest finished store build.
//   3. VERSION_SKEW   — the latest finished store builds disagree on the
//                       marketing version (app.json `version`).
//   4. BUILD_LAG      — the platforms' latest finished store builds come from
//                       different commits and the older one is more than
//                       LAG_HOURS old (a native change reached one store
//                       build but the other platform never got a build).
//
// WHY "publish" AND NOT "update group" (alert #4212, 2026-09-30). apps/mobile
// sets `runtimeVersion: { policy: "fingerprint" }`, and the iOS and Android
// fingerprints of one commit are different hashes. EAS groups updates by
// runtime version, so ONE `type: update` job publishing to both platforms
// still produces TWO update groups — one per platform — carrying the same
// commit, message and timestamp. (Release run 36747899604: the job "Publish
// OTA update (both platforms, one group)" emitted group eed74d81… for ios at
// runtime cdc374cc… and group 55f39c19… for android at runtime 291004871f….)
// Asking "does the newest GROUP cover both platforms?" therefore answers
// "no" on every healthy release. The question that carries meaning is "did
// the newest PUBLISH reach both platforms?", so update rows are folded into
// publish cohorts — same commit, or same message within the same minute when
// EAS reports no commit — before the platform coverage check runs.
//
// Three field shapes also bit this check, all fixed here:
//   - `update:list --json` reports a group's platforms as a STRING
//     ("android, ios"), never an array. Iterating it with for..of walked
//     CHARACTERS, so the alert read `covers only [i, o, s]`.
//   - `build:list --json` nests the runtime version as `runtime.version`;
//     there is no top-level `runtimeVersion`. Reading the flat name printed
//     `rt undefined` and silently disabled STRANDED_OTA entirely.
//   - `update:list --json` reports neither `createdAt` nor `gitCommitHash`
//     per group, so `update:view <group> --json` supplies the per-platform
//     detail the publish fold needs.
//
//   5. MAIN_AHEAD     — neither a platform's latest publish nor its latest
//                       finished store build contains the newest mobile-
//                       relevant main commit, and that commit is more than
//                       --main-ahead-hours old (production lags main; see
//                       scripts/mobile/lib/main-ahead.mjs). Alone it exits 3.
//
// Usage (from apps/mobile, EXPO_TOKEN or an `eas login` session present):
//   node ../../scripts/mobile/check-parity.mjs [--json] [--lag-hours 48]
//     [--main-ahead-hours 6] [--main-ref origin/main]
// Exit code 0 = in parity, 1 = diverged, 2 = could not check,
// 3 = only MAIN_AHEAD (production behind main; any other finding wins → 1).
//
// Exports the pure core for scripts/mobile/check-parity.test.ts; importing
// this file runs nothing.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import {
  DEFAULT_MAIN_AHEAD_HOURS,
  DEFAULT_MAIN_REF,
  evaluateMainAhead,
  exitCodeFor,
  readGitState,
} from './lib/main-ahead.mjs';

export { evaluateMainAhead, exitCodeFor, readGitState };

export const DEFAULT_LAG_HOURS = 48;
// How many of the newest update groups to fetch per-platform detail for. One
// publish makes at most one group per platform, so a handful spans several
// releases while keeping the number of `eas update:view` calls small.
export const DETAIL_GROUP_LIMIT = 6;

// CI installs eas-cli globally and sets EAS_BIN=eas (eas-cli is not a
// workspace dependency — adding it reshuffles package-lock.json by hundreds
// of entries). Locally the default `npx --no-install eas-cli` path is used.
const EAS_BIN = process.env.EAS_BIN || null;

/**
 * Run an eas-cli command and parse its JSON output.
 *
 * `--non-interactive` is not a flag on every command: `update:view` accepts
 * `--json` only and errors on unknown flags, hence the opt-out.
 */
function eas(cmdArgs, { nonInteractive = true } = {}) {
  const bin = EAS_BIN ?? 'npx';
  const prefix = EAS_BIN ? [] : ['--no-install', 'eas-cli'];
  const flags = nonInteractive ? ['--json', '--non-interactive'] : ['--json'];
  const out = execFileSync(bin, [...prefix, ...cmdArgs, ...flags], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });
  // eas prints upgrade notices to stdout before the JSON on some versions.
  const start = out.search(/[[{]/);
  return JSON.parse(out.slice(start));
}

/**
 * Platform names as a lowercased array, whatever shape EAS used: a
 * comma-separated string ("android, ios") from `update:list`, a single
 * `platform` per row from `update:view`, or an array from older eas-cli
 * versions. "N/A" (eas-cli's empty marker) yields no platforms.
 *
 * @param {unknown} value
 * @returns {string[]}
 */
export function normalizePlatforms(value) {
  const raw = Array.isArray(value) ? value : value == null ? [] : [value];
  const out = [];
  for (const item of raw) {
    if (item == null) continue;
    // Split on separators only — NOT on '/', or eas-cli's empty marker "N/A"
    // would split into two bogus platforms ('n', 'a').
    for (const part of String(item).split(/[,\s|]+/)) {
      const p = part.trim().toLowerCase();
      if (!p || p === 'n/a' || p === 'none') continue;
      if (!out.includes(p)) out.push(p);
    }
  }
  return out;
}

/**
 * Runtime version of a build row. `build:list --json` nests it under
 * `runtime.version`; the flat name is tolerated in case a future eas-cli
 * adds it back.
 *
 * @param {Record<string, any> | undefined | null} build
 * @returns {string | undefined}
 */
export function buildRuntimeVersion(build) {
  return build?.runtime?.version ?? build?.runtimeVersion ?? undefined;
}

/**
 * Newest FINISHED production store build for a platform ('IOS' | 'ANDROID').
 */
export function latestFinishedBuild(builds, platform) {
  return (Array.isArray(builds) ? builds : [])
    .filter(
      (b) =>
        b &&
        String(b.platform || '').toUpperCase() === platform &&
        b.status === 'FINISHED' &&
        String(b.buildProfile || '').startsWith('production'),
    )
    .sort(
      (a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt),
    )[0];
}

/**
 * The rows of an `eas update:list --json` payload, across shapes:
 * `{ currentPage: [...] }` (current), `{ updates: [...] }`, or a bare array.
 */
export function updateListRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.currentPage)) return payload.currentPage;
  if (Array.isArray(payload?.updates)) return payload.updates;
  return [];
}

/**
 * Fold update rows (from `update:list` and/or `update:view`) into one entry
 * per update group. `runtimeVersions` maps platform -> runtimeVersion,
 * because under the fingerprint policy each platform has its own; the `'*'`
 * key holds a runtime a row reported without naming a platform.
 *
 * `order` preserves the newest-first order EAS returned, so cohorts stay
 * deterministically ordered even when no row carries a timestamp.
 *
 * @param {Array<Record<string, any>>} rows
 */
export function collectGroups(rows) {
  const groups = new Map();
  let index = 0;
  for (const row of rows ?? []) {
    const position = index++;
    if (!row) continue;
    const group = row.group ?? row.groupId;
    if (!group) continue;
    const entry = groups.get(group) ?? {
      group,
      platforms: [],
      runtimeVersions: {},
      createdAt: undefined,
      message: undefined,
      commit: undefined,
      order: position,
    };
    entry.order = Math.min(entry.order, position);
    const platforms = normalizePlatforms(row.platform ?? row.platforms);
    for (const p of platforms) if (!entry.platforms.includes(p)) entry.platforms.push(p);
    const runtime = row.runtimeVersion ?? row.runtime?.version;
    if (runtime) {
      // A row naming its platform pins the runtime to that platform; a list
      // row covering several platforms shares one runtime across them.
      for (const p of platforms.length ? platforms : ['*']) entry.runtimeVersions[p] = runtime;
    }
    if (
      row.createdAt &&
      (!entry.createdAt || new Date(row.createdAt) > new Date(entry.createdAt))
    ) {
      entry.createdAt = row.createdAt;
    }
    if (row.message && !entry.message) entry.message = row.message;
    if (row.gitCommitHash && !entry.commit) entry.commit = row.gitCommitHash;
    groups.set(group, entry);
  }
  return [...groups.values()];
}

/**
 * Key identifying the ONE publish a group came from. Same commit = same
 * publish; when EAS reports no commit, the same message published in the same
 * minute is the best proxy available.
 */
export function publishKey(group) {
  if (group.commit) return `commit:${group.commit}`;
  const minute = group.createdAt ? new Date(group.createdAt).toISOString().slice(0, 16) : 'unknown';
  return `msg:${group.message ?? ''}@${minute}`;
}

/**
 * Fold groups into publish cohorts, newest first. One cohort = one `eas
 * update` publish, which under the fingerprint runtime policy appears as one
 * update group per platform.
 */
export function buildPublishCohorts(groups) {
  const cohorts = new Map();
  for (const g of groups ?? []) {
    const key = publishKey(g);
    const c = cohorts.get(key) ?? {
      key,
      groups: [],
      platforms: [],
      runtimeVersions: {},
      commit: undefined,
      message: undefined,
      createdAt: undefined,
      order: g.order ?? 0,
    };
    if (!c.groups.includes(g.group)) c.groups.push(g.group);
    for (const p of g.platforms) if (!c.platforms.includes(p)) c.platforms.push(p);
    Object.assign(c.runtimeVersions, g.runtimeVersions);
    if (!c.commit && g.commit) c.commit = g.commit;
    if (!c.message && g.message) c.message = g.message;
    if (g.createdAt && (!c.createdAt || new Date(g.createdAt) > new Date(c.createdAt))) {
      c.createdAt = g.createdAt;
    }
    c.order = Math.min(c.order, g.order ?? 0);
    cohorts.set(key, c);
  }
  // Newest first: by publish time when known, else by the order EAS listed
  // them in (which is already newest-first).
  return [...cohorts.values()].sort((a, b) => {
    const ta = cohortTime(a);
    const tb = cohortTime(b);
    if (ta !== null && tb !== null && ta !== tb) return tb - ta;
    return a.order - b.order;
  });
}

function cohortTime(c) {
  if (!c.createdAt) return null;
  const t = new Date(c.createdAt).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Runtime version this cohort published for `platform`. */
export function cohortRuntimeFor(cohort, platform) {
  return cohort?.runtimeVersions?.[platform] ?? cohort?.runtimeVersions?.['*'];
}

/** Newest cohort that reached `platform`. */
export function latestCohortFor(cohorts, platform) {
  return (cohorts ?? []).find((c) => c.platforms.includes(platform));
}

/**
 * The whole parity verdict, as a pure function of EAS state.
 *
 * @param {{ builds: any[], updateRows: any[], lagHours?: number, now?: number }} input
 */
export function evaluateParity({
  builds,
  updateRows,
  lagHours = DEFAULT_LAG_HOURS,
  now = Date.now(),
}) {
  const findings = [];
  const ios = latestFinishedBuild(builds, 'IOS');
  const android = latestFinishedBuild(builds, 'ANDROID');

  if (!ios || !android) {
    findings.push({
      code: 'NO_BUILD',
      detail: `no finished production build for ${!ios ? 'iOS' : ''}${!ios && !android ? ' and ' : ''}${!android ? 'Android' : ''}`,
    });
  }

  const cohorts = buildPublishCohorts(collectGroups(updateRows));
  const latest = cohorts[0];

  if (latest) {
    const missing = ['ios', 'android'].filter((p) => !latest.platforms.includes(p));
    // A platform that skipped the publish is fine when its latest finished
    // store build already carries that same commit natively — the release
    // train's mixed case (one platform gets JS, the other a store build).
    // A store build that never arrives is BUILD_LAG's job, not this one's.
    const stillMissing = missing.filter((p) => {
      const build = p === 'ios' ? ios : android;
      return !(latest.commit && build?.gitCommitHash && build.gitCommitHash === latest.commit);
    });
    if (stillMissing.length) {
      findings.push({
        code: 'SPLIT_UPDATE',
        detail: `latest publish ${describePublish(latest)} reached only [${latest.platforms.join(', ') || 'no platform'}] — ${stillMissing.join(' and ')} did not get it`,
      });
    }
  }

  for (const [name, build] of [
    ['ios', ios],
    ['android', android],
  ]) {
    if (!build) continue;
    const updateRuntime = cohortRuntimeFor(latestCohortFor(cohorts, name), name);
    const buildRuntime = buildRuntimeVersion(build);
    if (updateRuntime && buildRuntime && updateRuntime !== buildRuntime) {
      findings.push({
        code: 'STRANDED_OTA',
        detail: `${name}: latest update runtimeVersion ${updateRuntime.slice(0, 12)} ≠ latest build ${build.appVersion} (${build.appBuildVersion}) runtimeVersion ${buildRuntime.slice(0, 12)}`,
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
      const ageH = (now - new Date(older.completedAt)) / 36e5;
      if (ageH > lagHours) {
        findings.push({
          code: 'BUILD_LAG',
          detail: `store builds from different commits (iOS ${ios.gitCommitHash.slice(0, 8)}, Android ${android.gitCommitHash.slice(0, 8)}); ${String(older.platform).toLowerCase()} is ${Math.round(ageH)}h behind`,
        });
      }
    }
  }

  return {
    ok: findings.length === 0,
    checkable: true,
    ios: ios && describeBuild(ios),
    android: android && describeBuild(android),
    latestPublish: latest && {
      groups: latest.groups,
      platforms: latest.platforms,
      commit: latest.commit?.slice(0, 8),
      runtimes: Object.fromEntries(
        Object.entries(latest.runtimeVersions).map(([p, v]) => [p, String(v).slice(0, 12)]),
      ),
      createdAt: latest.createdAt,
      message: latest.message,
    },
    findings,
  };
}

function describeBuild(build) {
  return {
    version: build.appVersion,
    build: build.appBuildVersion,
    commit: build.gitCommitHash?.slice(0, 8),
    runtime: buildRuntimeVersion(build)?.slice(0, 12),
    completedAt: build.completedAt,
  };
}

function describePublish(cohort) {
  if (cohort.commit) return `@${cohort.commit.slice(0, 8)}`;
  return cohort.groups.length === 1 ? cohort.groups[0] : `groups [${cohort.groups.join(', ')}]`;
}

/** Human-readable report lines for a summary from evaluateParity. */
export function formatSummary(summary) {
  const lines = [];
  lines.push(
    `iOS     ${summary.ios ? `${summary.ios.version} (${summary.ios.build}) @${summary.ios.commit} rt ${summary.ios.runtime}` : 'no finished production build'}`,
  );
  lines.push(
    `Android ${summary.android ? `${summary.android.version} (${summary.android.build}) @${summary.android.commit} rt ${summary.android.runtime}` : 'no finished production build'}`,
  );
  if (summary.latestPublish) {
    const p = summary.latestPublish;
    const runtimes =
      Object.entries(p.runtimes)
        .map(([k, v]) => `${k} ${v}`)
        .join(', ') || 'unknown';
    lines.push(
      `Update  ${p.commit ? `@${p.commit} ` : ''}[${p.platforms.join(', ') || 'no platform'}] rt ${runtimes} (groups: ${p.groups.join(', ')})`,
    );
  } else {
    lines.push('Update  none published');
  }
  for (const f of summary.findings) lines.push(`✖ ${f.code}: ${f.detail}`);
  const code = exitCodeFor(summary.findings);
  lines.push(code === 1 ? 'DIVERGED' : code === 3 ? 'BEHIND MAIN' : 'IN PARITY');
  return lines;
}

/**
 * Per-platform commits for MAIN_AHEAD: the newest publish that reached the
 * platform, and its latest finished store build.
 */
export function platformCommits(builds, updateRows) {
  const cohorts = buildPublishCohorts(collectGroups(updateRows));
  return [
    ['ios', 'IOS'],
    ['android', 'ANDROID'],
  ].map(([name, buildPlatform]) => ({
    name,
    publishCommit: latestCohortFor(cohorts, name)?.commit,
    buildCommit: latestFinishedBuild(builds, buildPlatform)?.gitCommitHash,
  }));
}

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function runGit(args) {
  return execFileSync('git', args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/**
 * Read EAS state: recent builds, plus the newest update groups with
 * per-platform detail (`update:list` reports neither the commit nor the
 * creation time of a group, both of which the publish-cohort fold needs).
 */
function readEasState() {
  const builds = eas(['build:list', '--limit', '40']);
  const listRows = updateListRows(eas(['update:list', '--branch', 'production', '--limit', '10']));
  const updateRows = [...listRows];
  for (const row of listRows.slice(0, DETAIL_GROUP_LIMIT)) {
    const group = row?.group ?? row?.groupId;
    if (!group) continue;
    // update:view accepts --json only: no --non-interactive flag exists there.
    const detail = eas(['update:view', group], { nonInteractive: false });
    for (const u of updateListRows(detail)) updateRows.push({ ...u, group: u.group ?? group });
  }
  return { builds, updateRows };
}

async function main(argv) {
  const asJson = argv.includes('--json');
  const lagIdx = argv.indexOf('--lag-hours');
  const lagHours = lagIdx >= 0 ? Number(argv[lagIdx + 1]) : DEFAULT_LAG_HOURS;

  let state;
  try {
    state = readEasState();
  } catch (err) {
    const msg = `could not read EAS state: ${err instanceof Error ? err.message : String(err)}`;
    if (asJson) console.log(JSON.stringify({ ok: false, checkable: false, error: msg }));
    else console.error(msg);
    return 2;
  }

  const summary = evaluateParity({ ...state, lagHours });

  const flag = (name, fallback) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : fallback;
  };
  const mainRef = flag('--main-ref', DEFAULT_MAIN_REF);
  const thresholdHours = Number(flag('--main-ahead-hours', DEFAULT_MAIN_AHEAD_HOURS));
  if (!Number.isFinite(thresholdHours) || thresholdHours < 0) {
    console.error('--main-ahead-hours must be a non-negative number');
    return 2;
  }
  try {
    const platforms = platformCommits(state.builds, state.updateRows);
    const git = readGitState(runGit, {
      mainRef,
      commits: platforms.flatMap((p) => [p.publishCommit, p.buildCommit]),
    });
    summary.findings.push(...evaluateMainAhead({ ...git, platforms, thresholdHours }));
    summary.ok = summary.findings.length === 0;
  } catch (err) {
    const msg = `could not read git state: ${err instanceof Error ? err.message : String(err)}`;
    if (asJson) console.log(JSON.stringify({ ok: false, checkable: false, error: msg }));
    else console.error(msg);
    return 2;
  }

  if (asJson) console.log(JSON.stringify(summary, null, 2));
  else for (const line of formatSummary(summary)) console.log(line);
  return exitCodeFor(summary.findings);
}

// Only run when executed directly, never on import (tests import the pure
// fns). Same suffix-match pattern the sibling checkers use (Windows-safe).
if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/mobile/check-parity.mjs')
) {
  runMain(() => main(process.argv.slice(2)), { name: 'check-parity' });
}
