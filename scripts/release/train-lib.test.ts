import { describe, expect, it } from 'vitest';
import { selectAndroidBuild } from './select-android-build.mjs';
import {
  applyBuild,
  awaitBuilds,
  decide,
  initialState,
  iosSubmitId,
  jobStatus,
  parseFingerprint,
  pickExisting,
} from './train-lib.mjs';

const SHA = 'a'.repeat(40);
const A = '123e4567-e89b-42d3-a456-426614174000';
const I = '223e4567-e89b-42d3-a456-426614174000';
const build = (o: Record<string, unknown> = {}) => ({
  id: A,
  platform: 'ANDROID',
  status: 'FINISHED',
  buildProfile: 'production',
  gitCommitHash: SHA,
  ...o,
});
const ios = (o: Record<string, unknown> = {}) => build({ id: I, platform: 'IOS', ...o });

describe('parseFingerprint', () => {
  it('reads the hash, tolerating leading log noise', () => {
    expect(parseFingerprint(`noise\n${JSON.stringify({ hash: 'b'.repeat(40) })}`)).toBe('b'.repeat(40));
  });
  it.each(['', 'nope', '{}', '{"hash":"zz"}', '{"hash":5}'])('rejects %j', (t) => {
    expect(parseFingerprint(t)).toBeNull();
  });
});

describe('pickExisting', () => {
  it('takes the newest row', () => {
    expect(pickExisting(JSON.stringify([build(), ios()]))?.id).toBe(A);
  });
  it.each(['[]', '', 'x', '{}', '[{"nope":1}]'])('is null for %j', (t) => {
    expect(pickExisting(t)).toBeNull();
  });
});

describe('decide (old EAS job conditions)', () => {
  const E = { id: A };
  it('neither exists: build both, no OTA', () => {
    expect(decide({ android: null, ios: null })).toEqual({ buildAndroid: true, buildIos: true, update: 'none' });
  });
  it('both exist: one OTA group, no builds', () => {
    expect(decide({ android: E, ios: E })).toEqual({ buildAndroid: false, buildIos: false, update: 'both' });
  });
  it('mixed: OTA for the platform with a build, build the other', () => {
    expect(decide({ android: E, ios: null })).toEqual({ buildAndroid: false, buildIos: true, update: 'android' });
    expect(decide({ android: null, ios: E })).toEqual({ buildAndroid: true, buildIos: false, update: 'ios' });
  });
  it('force_store_build: build both, never OTA', () => {
    expect(decide({ android: E, ios: E, force: true })).toEqual({ buildAndroid: true, buildIos: true, update: 'none' });
  });
});

describe('state file feeds select-android-build unchanged', () => {
  const sel = (s: unknown) => selectAndroidBuild(s, SHA);
  it('OTA-only (no existing id exposed) is skipped', () => {
    const s = initialState({ android: null, ios: null, decision: decide({ android: { id: A }, ios: { id: A } }) });
    expect(sel(s).result).toBe('skipped');
  });
  it('existing Android build is selected without a commit match', () => {
    const e = build({ gitCommitHash: 'b'.repeat(40) });
    const s = initialState({ android: e, ios: ios(), decision: decide({ android: e, ios: ios() }) });
    expect(sel(s)).toEqual({ result: 'existing' });
  });
  it('finished store build is success; errored is not_success', () => {
    const d = decide({ android: null, ios: null });
    const ok = applyBuild(initialState({ android: null, ios: null, decision: d }), 'build_android', build());
    expect(sel(ok)).toEqual({ result: 'success', buildId: A });
    const bad = applyBuild(initialState({ android: null, ios: null, decision: d }), 'build_android', build({ status: 'ERRORED' }));
    expect(sel(bad).result).toBe('not_success');
  });
  it('an unfinished build left in the state is not_success', () => {
    expect(sel(initialState({ android: null, ios: null, decision: decide({ android: null, ios: null }) })).result).toBe('not_success');
  });
});

describe('jobStatus', () => {
  it.each([
    ['FINISHED', 'SUCCESS'],
    ['ERRORED', 'FAILURE'],
    ['CANCELED', 'CANCELED'],
    ['IN_QUEUE', 'IN_PROGRESS'],
    [undefined, 'IN_PROGRESS'],
  ])('%s -> %s', (b, j) => expect(jobStatus(b as string)).toBe(j));
});

describe('iosSubmitId gate', () => {
  const state = (a: string, i: string, b = ios()) => ({
    jobs: [
      { key: 'build_android', status: a },
      { key: 'build_ios', status: i, turtleBuild: b },
    ],
  });
  it('submits when iOS finished and Android skipped or succeeded', () => {
    expect(iosSubmitId(state('SKIPPED', 'SUCCESS'))).toBe(I);
    expect(iosSubmitId(state('SUCCESS', 'SUCCESS'))).toBe(I);
  });
  it('blocks when Android failed or iOS did not finish', () => {
    expect(iosSubmitId(state('FAILURE', 'SUCCESS'))).toBeNull();
    expect(iosSubmitId(state('SUCCESS', 'FAILURE'))).toBeNull();
    expect(iosSubmitId(state('SKIPPED', 'SKIPPED', undefined as never))).toBeNull();
  });
  it('rejects a wrong platform or malformed id', () => {
    expect(iosSubmitId(state('SKIPPED', 'SUCCESS', ios({ platform: 'ANDROID' })))).toBeNull();
    expect(iosSubmitId(state('SKIPPED', 'SUCCESS', ios({ id: 'nope' })))).toBeNull();
  });
});

describe('awaitBuilds', () => {
  const fixed = (seq: Record<string, string[]>) => {
    const n: Record<string, number> = {};
    return async (id: string) => {
      const s = seq[id];
      n[id] = Math.min((n[id] ?? -1) + 1, s.length - 1);
      if (s[n[id]] === 'THROW') throw new Error('network');
      return { id, status: s[n[id]] };
    };
  };
  const clock = () => {
    let t = 0;
    return { now: () => t, sleep: async (ms: number) => void (t += ms) };
  };

  it('polls until settled and survives a failed lookup', async () => {
    const { now, sleep } = clock();
    const r = await awaitBuilds({
      ids: { android: 'a', ios: 'i' },
      view: fixed({ a: ['IN_PROGRESS', 'THROW', 'FINISHED'], i: ['ERRORED'] }),
      now, sleep, deadline: 10 * 60000,
    });
    expect(r.timedOut).toBe(false);
    expect(r.builds.android.status).toBe('FINISHED');
    expect(r.builds.ios.status).toBe('ERRORED');
  });

  it('times out at the deadline without settling', async () => {
    const { now, sleep } = clock();
    const r = await awaitBuilds({ ids: { android: 'a', ios: '' }, view: fixed({ a: ['IN_QUEUE'] }), now, sleep, deadline: 5 * 60000 });
    expect(r.timedOut).toBe(true);
    expect(r.builds.android.status).toBe('IN_QUEUE');
  });
});

describe('large eas output (fingerprint:generate is ~1.1 MB)', () => {
  it('runEas sets a maxBuffer well above 1 MiB', async () => {
    const { runEas, EAS_MAX_BUFFER } = await import('./train-lib.mjs');
    let seen: { maxBuffer?: number } = {};
    const big = JSON.stringify({ hash: 'c'.repeat(40), sources: 'x'.repeat(1_200_000) });
    const out = runEas(['fingerprint:generate'], {
      exec: ((_c: string, _a: string[], o: { maxBuffer?: number }) => {
        seen = o;
        return big;
      }) as never,
    });
    expect(seen.maxBuffer).toBe(EAS_MAX_BUFFER);
    expect(EAS_MAX_BUFFER).toBeGreaterThan(2 * 1024 * 1024);
    expect(parseFingerprint(out)).toBe('c'.repeat(40));
  });

  it('really survives >1 MiB of stdout through child_process', async () => {
    const { runEas } = await import('./train-lib.mjs');
    const { execFileSync } = await import('node:child_process');
    const out = runEas([], {
      exec: ((_c: string, _a: string[], o: object) =>
        execFileSync(process.execPath, ['-e', 'process.stdout.write("y".repeat(1200000))'], o)) as never,
    });
    expect(out.length).toBe(1_200_000);
  });
});
