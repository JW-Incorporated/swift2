import { describe, expect, it } from 'vitest';
import { selectAndroidBuild } from './select-android-build.mjs';

const SHA = 'a'.repeat(40);
const ID = '123e4567-e89b-42d3-a456-426614174000';
const build = (o: Record<string, unknown> = {}) => ({
  id: ID,
  platform: 'ANDROID',
  status: 'FINISHED',
  buildProfile: 'production',
  gitCommitHash: SHA,
  ...o,
});
const run = (turtleBuild: unknown, status = 'SUCCESS') => ({
  jobs: [{ key: 'build_android', status, turtleBuild }],
});

describe('selectAndroidBuild', () => {
  it('accepts only the matching, finished, valid build', () => {
    expect(selectAndroidBuild(run(build()), SHA)).toEqual({ result: 'success', buildId: ID });
  });

  it.each([
    ['absent hash', build({ gitCommitHash: undefined })],
    ['empty hash', build({ gitCommitHash: '' })],
    ['mismatched hash', build({ gitCommitHash: 'b'.repeat(40) })],
    ['non-string hash', build({ gitCommitHash: 123 })],
  ])('fails closed on %s with a warning', (_n, b) => {
    const r = selectAndroidBuild(run(b), SHA);
    expect(r.result).toBe('no_build');
    expect(r.warning).toBeTruthy();
  });

  it.each([undefined, ''])('fails closed when GITHUB_SHA is %j', (sha) => {
    expect(selectAndroidBuild(run(build({ gitCommitHash: '' })), sha as string).result).toBe(
      'no_build',
    );
  });

  it.each([
    ['object', {}],
    ['array', [ID]],
    ['number', 5],
    ['null', null],
    ['newline', `${ID}\nresult=success`],
    ['trailing newline', `${ID}\n`],
    ['wrong format', 'not-a-uuid'],
    ['short', ID.slice(1)],
  ])('rejects id: %s', (_n, id) => {
    expect(selectAndroidBuild(run(build({ id })), SHA).result).toBe('no_build');
  });

  it('accepts an uppercase UUID', () => {
    expect(selectAndroidBuild(run(build({ id: ID.toUpperCase() })), SHA).result).toBe('success');
  });

  it.each([
    ['platform', { platform: 'IOS' }],
    ['status', { status: 'ERRORED' }],
    ['profile', { buildProfile: 'preview' }],
  ])('rejects wrong %s', (_n, o) => {
    expect(selectAndroidBuild(run(build(o)), SHA).result).toBe('no_build');
  });

  it('maps job states', () => {
    expect(selectAndroidBuild(run(undefined), SHA).result).toBe('no_build');
  });

  it('treats an absent build_android job as skipped (OTA-only)', () => {
    expect(selectAndroidBuild({ jobs: [] }, SHA)).toEqual({ result: 'skipped' });
    expect(selectAndroidBuild({}, SHA)).toEqual({ result: 'skipped' });
  });

  it('treats the eas-cli SKIPPED status as skipped', () => {
    expect(selectAndroidBuild(run(undefined, 'SKIPPED'), SHA)).toEqual({ result: 'skipped' });
  });

  describe('existing build (build_android skipped)', () => {
    const get = (turtleBuild: unknown, status = 'SUCCESS') => ({
      key: 'get_android_build',
      status,
      turtleBuild,
    });
    const skipped = { key: 'build_android', status: 'SKIPPED' };

    it('returns existing with no build id and no commit match', () => {
      const r = selectAndroidBuild(
        { jobs: [get(build({ gitCommitHash: 'b'.repeat(40) })), skipped] },
        SHA,
      );
      expect(r).toEqual({ result: 'existing' });
    });

    it('also works when build_android is absent and only an id is exposed', () => {
      expect(selectAndroidBuild({ jobs: [get({ id: ID })] }, SHA)).toEqual({ result: 'existing' });
    });

    it.each([undefined, null, {}])('is skipped when get_android_build has no id (%j)', (tb) => {
      expect(selectAndroidBuild({ jobs: [get(tb), skipped] }, SHA)).toEqual({ result: 'skipped' });
    });

    it('is skipped when get_android_build is not SUCCESS', () => {
      expect(selectAndroidBuild({ jobs: [get({ id: ID }, 'FAILURE'), skipped] }, SHA).result).toBe(
        'skipped',
      );
    });

    it('prefers this run build over the existing one', () => {
      const other = '223e4567-e89b-42d3-a456-426614174000';
      const r = selectAndroidBuild(
        {
          jobs: [
            get({ id: other }),
            { key: 'build_android', status: 'SUCCESS', turtleBuild: build() },
          ],
        },
        SHA,
      );
      expect(r).toEqual({ result: 'success', buildId: ID });
    });
  });

  it.each(['FAILURE', 'CANCELED', 'PENDING_CANCEL', 'IN_PROGRESS', 'NEW', 'ACTION_REQUIRED'])(
    'maps job status %s to not_success',
    (status) => {
      expect(selectAndroidBuild(run(build(), status), SHA).result).toBe('not_success');
    },
  );
});
