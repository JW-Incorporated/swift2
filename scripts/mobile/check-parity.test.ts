import { describe, expect, it } from 'vitest';
import {
  buildPublishCohorts,
  buildRuntimeVersion,
  cohortRuntimeFor,
  collectGroups,
  evaluateMainAhead,
  evaluateParity,
  exitCodeFor,
  formatSummary,
  latestCohortFor,
  latestFinishedBuild,
  normalizePlatforms,
  platformCommits,
  publishKey,
  readGitState,
  updateListRows,
} from './check-parity.mjs';

/**
 * A finished production store build, shaped like a row of
 * `eas build:list --json` (runtime version NESTED under `runtime`).
 */
const build = ({
  platform,
  appBuildVersion,
  runtime,
  commit = '9bc40534a7194fe0f95f0dcc0c7f6c026ee086f5',
  appVersion = '1.0.0',
  completedAt = '2026-09-25T23:19:01.866Z',
}: {
  platform: 'IOS' | 'ANDROID';
  appBuildVersion: string;
  runtime: string;
  commit?: string;
  appVersion?: string;
  completedAt?: string;
}) => ({
  platform,
  status: 'FINISHED',
  buildProfile: 'production',
  appVersion,
  appBuildVersion,
  gitCommitHash: commit,
  runtime: { id: `rt-${runtime}`, version: runtime },
  completedAt,
  createdAt: completedAt,
});

const IOS_RT = 'cdc374cc3b4f93e9f974f92d67838f1239c6ad4f';
const ANDROID_RT = '291004871f4284b35c6962e100427f60e0050cb8';
const COMMIT = '478c145a016f5dfb42b588d1c536383f4dd85543';

/** The two builds LongLive actually has in production (both @9bc40534). */
const LIVE_BUILDS = [
  build({ platform: 'IOS', appBuildVersion: '14', runtime: IOS_RT }),
  build({ platform: 'ANDROID', appBuildVersion: '15', runtime: ANDROID_RT }),
];

/**
 * `update:view <group> --json` rows for the both-platforms publish of run
 * 36747899604: ONE publish, TWO groups, because the fingerprint runtime
 * policy gives each platform its own runtime version.
 */
const LIVE_UPDATE_ROWS = [
  // update:list rows: platforms is a STRING, no createdAt, no commit.
  { group: 'eed74d81-6243-4aac-a276-42cf9acc93c5', platforms: 'ios', runtimeVersion: IOS_RT },
  {
    group: '55f39c19-d427-48cb-8776-b4bf23b7f9ad',
    platforms: 'android',
    runtimeVersion: ANDROID_RT,
  },
  // update:view rows for the same groups.
  {
    group: 'eed74d81-6243-4aac-a276-42cf9acc93c5',
    createdAt: '2026-09-30T19:07:46.599Z',
    message: 'Automate weekly Facebook group export (HA #70) (#4642)',
    runtimeVersion: IOS_RT,
    platform: 'ios',
    gitCommitHash: COMMIT,
  },
  {
    group: '55f39c19-d427-48cb-8776-b4bf23b7f9ad',
    createdAt: '2026-09-30T19:07:46.599Z',
    message: 'Automate weekly Facebook group export (HA #70) (#4642)',
    runtimeVersion: ANDROID_RT,
    platform: 'android',
    gitCommitHash: COMMIT,
  },
];

describe('normalizePlatforms (the #4212 bug)', () => {
  it('splits the comma-separated STRING eas update:list returns', () => {
    // The bug: for..of over "ios" yielded ['i','o','s'] — the alert literally
    // read "covers only [i, o, s]".
    expect(normalizePlatforms('ios')).toEqual(['ios']);
    expect(normalizePlatforms('android, ios')).toEqual(['android', 'ios']);
    expect(normalizePlatforms('android,ios')).toEqual(['android', 'ios']);
  });

  it('still accepts an array (older eas-cli) and a single value', () => {
    expect(normalizePlatforms(['IOS', 'ANDROID'])).toEqual(['ios', 'android']);
    expect(normalizePlatforms('ANDROID')).toEqual(['android']);
  });

  it('treats nothing, N/A and empties as no platforms', () => {
    expect(normalizePlatforms(undefined)).toEqual([]);
    expect(normalizePlatforms(null)).toEqual([]);
    expect(normalizePlatforms('')).toEqual([]);
    expect(normalizePlatforms('N/A')).toEqual([]);
    expect(normalizePlatforms([null, 'ios', 'ios'])).toEqual(['ios']);
  });
});

describe('buildRuntimeVersion (the "rt undefined" bug)', () => {
  it('reads the nested runtime.version build:list actually returns', () => {
    expect(buildRuntimeVersion({ runtime: { version: IOS_RT } })).toBe(IOS_RT);
  });

  it('tolerates a flat runtimeVersion and missing data', () => {
    expect(buildRuntimeVersion({ runtimeVersion: ANDROID_RT })).toBe(ANDROID_RT);
    expect(buildRuntimeVersion({})).toBeUndefined();
    expect(buildRuntimeVersion(undefined)).toBeUndefined();
  });
});

describe('latestFinishedBuild', () => {
  it('picks the newest FINISHED production build for the platform', () => {
    const older = build({
      platform: 'IOS',
      appBuildVersion: '13',
      runtime: 'old',
      completedAt: '2026-09-01T00:00:00.000Z',
    });
    const newer = build({ platform: 'IOS', appBuildVersion: '14', runtime: IOS_RT });
    expect(latestFinishedBuild([older, newer], 'IOS')?.appBuildVersion).toBe('14');
  });

  it('ignores other platforms, unfinished builds and non-production profiles', () => {
    const rows = [
      { ...build({ platform: 'IOS', appBuildVersion: '20', runtime: IOS_RT }), status: 'ERRORED' },
      {
        ...build({ platform: 'IOS', appBuildVersion: '21', runtime: IOS_RT }),
        buildProfile: 'preview',
      },
      build({ platform: 'ANDROID', appBuildVersion: '15', runtime: ANDROID_RT }),
    ];
    expect(latestFinishedBuild(rows, 'IOS')).toBeUndefined();
    expect(latestFinishedBuild(rows, 'ANDROID')?.appBuildVersion).toBe('15');
  });

  it('returns undefined instead of throwing on a non-array payload', () => {
    expect(latestFinishedBuild(undefined as unknown as unknown[], 'IOS')).toBeUndefined();
  });
});

describe('updateListRows', () => {
  it('unwraps every shape eas update:list has used', () => {
    expect(updateListRows({ currentPage: [{ group: 'a' }] })).toEqual([{ group: 'a' }]);
    expect(updateListRows({ updates: [{ group: 'b' }] })).toEqual([{ group: 'b' }]);
    expect(updateListRows([{ group: 'c' }])).toEqual([{ group: 'c' }]);
    expect(updateListRows(null)).toEqual([]);
  });
});

describe('collectGroups', () => {
  it('merges list and view rows into one entry per group, runtime per platform', () => {
    const groups = collectGroups(LIVE_UPDATE_ROWS);
    expect(groups).toHaveLength(2);
    const ios = groups.find((g) => g.group.startsWith('eed74d81'))!;
    expect(ios.platforms).toEqual(['ios']);
    expect(ios.runtimeVersions).toEqual({ ios: IOS_RT });
    expect(ios.commit).toBe(COMMIT);
    expect(ios.createdAt).toBe('2026-09-30T19:07:46.599Z');
  });

  it('keys an unlabelled runtime under * so it can still be compared', () => {
    const [g] = collectGroups([{ group: 'g1', runtimeVersion: IOS_RT }]);
    expect(g.runtimeVersions).toEqual({ '*': IOS_RT });
    expect(cohortRuntimeFor({ runtimeVersions: g.runtimeVersions }, 'ios')).toBe(IOS_RT);
  });

  it('skips rows with no group and tolerates holes', () => {
    expect(collectGroups([null, undefined, { platforms: 'ios' }] as never)).toEqual([]);
  });
});

describe('buildPublishCohorts', () => {
  it('folds the per-platform groups of ONE publish into ONE cohort', () => {
    const cohorts = buildPublishCohorts(collectGroups(LIVE_UPDATE_ROWS));
    expect(cohorts).toHaveLength(1);
    expect(cohorts[0].platforms.sort()).toEqual(['android', 'ios']);
    expect(cohorts[0].groups).toHaveLength(2);
    expect(cohortRuntimeFor(cohorts[0], 'ios')).toBe(IOS_RT);
    expect(cohortRuntimeFor(cohorts[0], 'android')).toBe(ANDROID_RT);
  });

  it('keeps separate publishes separate and orders them newest first', () => {
    const rows = [
      ...LIVE_UPDATE_ROWS,
      {
        group: 'older-ios',
        platform: 'ios',
        runtimeVersion: IOS_RT,
        createdAt: '2026-09-25T23:00:00.000Z',
        gitCommitHash: '9bc40534a7194fe0f95f0dcc0c7f6c026ee086f5',
      },
    ];
    const cohorts = buildPublishCohorts(collectGroups(rows));
    expect(cohorts).toHaveLength(2);
    expect(cohorts[0].commit).toBe(COMMIT);
    expect(latestCohortFor(cohorts, 'android')?.commit).toBe(COMMIT);
  });

  it('falls back to message+minute when EAS reports no commit', () => {
    const rows = [
      { group: 'a', platform: 'ios', createdAt: '2026-09-30T19:07:46.599Z', message: 'same' },
      { group: 'b', platform: 'android', createdAt: '2026-09-30T19:07:51.100Z', message: 'same' },
      { group: 'c', platform: 'ios', createdAt: '2026-09-30T18:00:00.000Z', message: 'other' },
    ];
    const cohorts = buildPublishCohorts(collectGroups(rows));
    expect(cohorts[0].platforms.sort()).toEqual(['android', 'ios']);
    expect(cohorts).toHaveLength(2);
  });

  it('keeps EAS list order when nothing carries a timestamp', () => {
    const cohorts = buildPublishCohorts(
      collectGroups([
        { group: 'newest', platform: 'ios', message: 'n' },
        { group: 'oldest', platform: 'ios', message: 'o' },
      ]),
    );
    expect(cohorts.map((c) => c.groups[0])).toEqual(['newest', 'oldest']);
  });

  it('publishKey is commit-first, minute-bucketed otherwise', () => {
    expect(publishKey({ commit: 'abc' })).toBe('commit:abc');
    expect(publishKey({ message: 'm', createdAt: '2026-09-30T19:07:46.599Z' })).toBe(
      'msg:m@2026-09-30T19:07',
    );
  });
});

describe('evaluateParity — the live LongLive state', () => {
  it('reports IN PARITY for one publish that reached both platforms', () => {
    const summary = evaluateParity({
      builds: LIVE_BUILDS,
      updateRows: LIVE_UPDATE_ROWS,
      now: Date.parse('2026-09-30T20:00:00.000Z'),
    });
    expect(summary.findings).toEqual([]);
    expect(summary.ok).toBe(true);
    // The two regressions this card fixed, asserted on the rendered report.
    const text = formatSummary(summary).join('\n');
    expect(text).toContain('IN PARITY');
    expect(text).not.toContain('rt undefined');
    expect(text).not.toContain('[i, o, s]');
    expect(summary.ios?.runtime).toBe(IOS_RT.slice(0, 12));
    expect(summary.android?.runtime).toBe(ANDROID_RT.slice(0, 12));
    expect(summary.latestPublish?.platforms.sort()).toEqual(['android', 'ios']);
  });

  it('would have flagged the raw (unfixed) group view — regression guard', () => {
    // Same state, but with only ONE platform's group present: a genuine
    // one-platform publish with no matching store build must still fail.
    const summary = evaluateParity({
      builds: LIVE_BUILDS,
      updateRows: LIVE_UPDATE_ROWS.filter((r) => !String(r.group).startsWith('55f39c19')),
      now: Date.parse('2026-09-30T20:00:00.000Z'),
    });
    expect(summary.findings.map((f) => f.code)).toContain('SPLIT_UPDATE');
    expect(summary.findings.find((f) => f.code === 'SPLIT_UPDATE')?.detail).toContain(
      'android did not get it',
    );
  });
});

describe('evaluateParity — the real failure modes still fire', () => {
  it('SPLIT_UPDATE is suppressed when the missed platform has that commit natively', () => {
    // Release train mixed case: iOS took the OTA, Android got a store build
    // from the same commit instead.
    const builds = [
      build({ platform: 'IOS', appBuildVersion: '14', runtime: IOS_RT }),
      build({
        platform: 'ANDROID',
        appBuildVersion: '16',
        runtime: ANDROID_RT,
        commit: COMMIT,
        completedAt: '2026-09-30T19:00:00.000Z',
      }),
    ];
    const summary = evaluateParity({
      builds,
      updateRows: LIVE_UPDATE_ROWS.filter((r) => !String(r.group).startsWith('55f39c19')),
      now: Date.parse('2026-09-30T20:00:00.000Z'),
    });
    expect(summary.findings.map((f) => f.code)).not.toContain('SPLIT_UPDATE');
  });

  it('STRANDED_OTA fires when an update runtime outruns the store build', () => {
    const summary = evaluateParity({
      builds: [
        build({ platform: 'IOS', appBuildVersion: '14', runtime: 'stale-ios-runtime' }),
        build({ platform: 'ANDROID', appBuildVersion: '15', runtime: ANDROID_RT }),
      ],
      updateRows: LIVE_UPDATE_ROWS,
      now: Date.parse('2026-09-30T20:00:00.000Z'),
    });
    const stranded = summary.findings.find((f) => f.code === 'STRANDED_OTA');
    expect(stranded?.detail).toContain('ios:');
  });

  it('VERSION_SKEW fires on disagreeing marketing versions', () => {
    const summary = evaluateParity({
      builds: [
        build({ platform: 'IOS', appBuildVersion: '14', runtime: IOS_RT, appVersion: '1.0.0' }),
        build({
          platform: 'ANDROID',
          appBuildVersion: '15',
          runtime: ANDROID_RT,
          appVersion: '1.1.0',
        }),
      ],
      updateRows: LIVE_UPDATE_ROWS,
      now: Date.parse('2026-09-30T20:00:00.000Z'),
    });
    expect(summary.findings.map((f) => f.code)).toContain('VERSION_SKEW');
  });

  it('BUILD_LAG fires only past the lag window', () => {
    const builds = [
      build({
        platform: 'IOS',
        appBuildVersion: '14',
        runtime: IOS_RT,
        commit: 'aaaaaaaa11111111111111111111111111111111',
        completedAt: '2026-09-20T00:00:00.000Z',
      }),
      build({
        platform: 'ANDROID',
        appBuildVersion: '15',
        runtime: ANDROID_RT,
        commit: 'bbbbbbbb22222222222222222222222222222222',
        completedAt: '2026-09-30T00:00:00.000Z',
      }),
    ];
    const now = Date.parse('2026-09-30T20:00:00.000Z');
    expect(
      evaluateParity({ builds, updateRows: [], now, lagHours: 48 }).findings.map((f) => f.code),
    ).toContain('BUILD_LAG');
    expect(
      evaluateParity({ builds, updateRows: [], now, lagHours: 1000 }).findings.map((f) => f.code),
    ).not.toContain('BUILD_LAG');
  });

  describe('BUILD_LAG is runtime-aware', () => {
    const lagBuilds = [
      build({
        platform: 'IOS',
        appBuildVersion: '14',
        runtime: IOS_RT,
        commit: 'aaaaaaaa11111111111111111111111111111111',
        completedAt: '2026-09-20T00:00:00.000Z',
      }),
      build({
        platform: 'ANDROID',
        appBuildVersion: '15',
        runtime: ANDROID_RT,
        commit: 'bbbbbbbb22222222222222222222222222222222',
        completedAt: '2026-09-30T00:00:00.000Z',
      }),
    ];
    const now = Date.parse('2026-09-30T20:00:00.000Z');
    const codes = (updateRows: typeof LIVE_UPDATE_ROWS, builds = lagBuilds) =>
      evaluateParity({ builds, updateRows, now, lagHours: 48 }).findings.map((f) => f.code);

    it('does not fire when the older platform is covered by OTA on its build runtime', () => {
      expect(codes(LIVE_UPDATE_ROWS)).not.toContain('BUILD_LAG');
    });

    it('fires when the older platform cohort runtime differs from its build runtime', () => {
      const rows = LIVE_UPDATE_ROWS.map((r) =>
        r.runtimeVersion === IOS_RT ? { ...r, runtimeVersion: 'newer-ios-runtime' } : r,
      );
      expect(codes(rows)).toContain('BUILD_LAG');
    });

    it('fires when the older platform has no cohort at all', () => {
      const rows = LIVE_UPDATE_ROWS.filter((r) => r.runtimeVersion !== IOS_RT);
      expect(codes(rows)).toContain('BUILD_LAG');
    });
  });

  it('NO_BUILD fires when a platform has no finished production build', () => {
    const summary = evaluateParity({
      builds: [build({ platform: 'IOS', appBuildVersion: '14', runtime: IOS_RT })],
      updateRows: [],
      now: Date.parse('2026-09-30T20:00:00.000Z'),
    });
    expect(summary.findings.map((f) => f.code)).toEqual(['NO_BUILD']);
    expect(formatSummary(summary)).toContain('Update  none published');
  });
});

describe('evaluateMainAhead', () => {
  const HEAD = 'aaaaaaaa11111111111111111111111111111111';
  const OLD = 'bbbbbbbb22222222222222222222222222222222';
  const NEW = 'cccccccc33333333333333333333333333333333';
  const NOW = Date.parse('2026-10-01T12:00:00.000Z');
  const OLD_HEAD_TIME = '2026-10-01T02:00:00.000Z'; // 10h old
  const FRESH_HEAD_TIME = '2026-10-01T10:00:00.000Z'; // 2h old
  const run = (over: Record<string, unknown>) =>
    evaluateMainAhead({
      mainHead: HEAD,
      mainHeadTime: OLD_HEAD_TIME,
      platforms: [
        { name: 'ios', publishCommit: OLD, buildCommit: OLD },
        { name: 'android', publishCommit: OLD, buildCommit: OLD },
      ],
      ancestry: { [OLD]: false, [NEW]: true },
      now: NOW,
      thresholdHours: 6,
      ...over,
    });

  it('is caught up via the latest publish', () => {
    const platforms = [
      { name: 'ios', publishCommit: NEW, buildCommit: OLD },
      { name: 'android', publishCommit: NEW, buildCommit: OLD },
    ];
    expect(run({ platforms })).toEqual([]);
  });

  it('is caught up via the latest finished build', () => {
    const platforms = [
      { name: 'ios', publishCommit: OLD, buildCommit: NEW },
      { name: 'android', publishCommit: undefined, buildCommit: NEW },
    ];
    expect(run({ platforms })).toEqual([]);
  });

  it('stays quiet when behind but under the threshold', () => {
    expect(run({ mainHeadTime: FRESH_HEAD_TIME })).toEqual([]);
  });

  it('fires when neither platform is caught up and the head is over the threshold', () => {
    const findings = run({});
    expect(findings).toHaveLength(1);
    expect(findings[0].code).toBe('MAIN_AHEAD');
    expect(findings[0].detail).toContain('ios and android');
    expect(findings[0].detail).toContain('aaaaaaaa');
    expect(findings[0].detail).toContain('10h');
  });

  it('names only the platform that is behind', () => {
    const platforms = [
      { name: 'ios', publishCommit: NEW, buildCommit: OLD },
      { name: 'android', publishCommit: OLD, buildCommit: OLD },
    ];
    const findings = run({ platforms });
    expect(findings).toHaveLength(1);
    expect(findings[0].detail).toMatch(/^android not carrying/);
  });

  it('is silent when main has no mobile-relevant commit', () => {
    expect(run({ mainHead: null, mainHeadTime: null })).toEqual([]);
  });
});

describe('readGitState', () => {
  const HEAD = 'aaaaaaaa11111111111111111111111111111111';
  const exit = (status: number, stderr = '') =>
    Object.assign(new Error('git failed'), { status, stderr });

  it('parses %H<TAB>%cI and answers ancestry from exit codes', () => {
    const calls: string[][] = [];
    const run = (args: string[]) => {
      calls.push(args);
      if (args[0] === 'log') return `${HEAD}\t2026-10-01T02:00:00+00:00\n`;
      if (args[2] === HEAD && args[3] === 'yes') return '';
      throw exit(1);
    };
    const state = readGitState(run, {
      mainRef: 'origin/main',
      commits: ['yes', 'no', undefined, 'yes'],
    });
    expect(state).toEqual({
      mainHead: HEAD,
      mainHeadTime: '2026-10-01T02:00:00+00:00',
      ancestry: { yes: true, no: false },
    });
    expect(calls[0]).toEqual([
      'log',
      '-1',
      '--format=%H%x09%cI',
      'origin/main',
      '--',
      'apps/mobile',
      'packages',
      'package-lock.json',
      ':(exclude)**/*.md',
    ]);
    expect(calls[1]).toEqual(['merge-base', '--is-ancestor', HEAD, 'yes']);
  });

  it('returns a null head when no mobile-relevant commit exists', () => {
    expect(readGitState(() => '\n', { commits: ['x'] })).toEqual({
      mainHead: null,
      mainHeadTime: null,
      ancestry: {},
    });
  });

  it('treats a commit git says is unknown as not contained', () => {
    const run = (args: string[]) => {
      if (args[0] === 'log') return `${HEAD}\t2026-10-01T02:00:00+00:00`;
      throw exit(128, 'fatal: Not a valid commit name deadbeef');
    };
    expect(readGitState(run, { commits: ['deadbeef'] }).ancestry).toEqual({ deadbeef: false });
  });

  it('propagates real git errors', () => {
    const run = (args: string[]) => {
      if (args[0] === 'log') return `${HEAD}\t2026-10-01T02:00:00+00:00`;
      throw exit(128, 'fatal: not a git repository');
    };
    expect(() => readGitState(run, { commits: ['x'] })).toThrow('git failed');
    const failLog = () => {
      throw exit(128, 'fatal: bad revision');
    };
    expect(() => readGitState(failLog, { commits: [] })).toThrow('git failed');
  });
});

describe('exit-code precedence', () => {
  const ahead = { code: 'MAIN_AHEAD', detail: 'x' };
  it('is 0 when clean, 3 for MAIN_AHEAD alone, 1 when any other finding is present', () => {
    expect(exitCodeFor([])).toBe(0);
    expect(exitCodeFor([ahead])).toBe(3);
    expect(exitCodeFor([{ code: 'BUILD_LAG', detail: 'y' }])).toBe(1);
    expect(exitCodeFor([ahead, { code: 'SPLIT_UPDATE', detail: 'y' }])).toBe(1);
  });

  it('labels the summary by that precedence', () => {
    const base = evaluateParity({
      builds: LIVE_BUILDS,
      updateRows: LIVE_UPDATE_ROWS,
      now: Date.parse('2026-09-30T20:00:00.000Z'),
    });
    expect(formatSummary({ ...base, findings: [ahead] }).at(-1)).toBe('BEHIND MAIN');
    expect(
      formatSummary({ ...base, findings: [ahead, { code: 'VERSION_SKEW', detail: 'y' }] }).at(-1),
    ).toBe('DIVERGED');
  });
});

describe('platformCommits', () => {
  it('pairs each platform with its latest publish commit and finished build commit', () => {
    const platforms = platformCommits(LIVE_BUILDS, LIVE_UPDATE_ROWS);
    expect(platforms.map((p) => p.name)).toEqual(['ios', 'android']);
    expect(platforms[0].buildCommit).toBe('9bc40534a7194fe0f95f0dcc0c7f6c026ee086f5');
    expect(platforms[0].publishCommit).toBe(COMMIT);
  });
});
