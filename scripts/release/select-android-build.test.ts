import { describe, expect, it } from 'vitest';
import { selectAndroidBuild } from './select-android-build.mjs';

const SHA = 'a'.repeat(40);
const ID = '123e4567-e89b-42d3-a456-426614174000';
const build = (o: Record<string, unknown> = {}) => ({
  id: ID, platform: 'ANDROID', status: 'FINISHED', buildProfile: 'production', gitCommitHash: SHA, ...o,
});
const run = (turtleBuild: unknown, status = 'SUCCESS') => ({ jobs: [{ key: 'build_android', status, turtleBuild }] });

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
    expect(selectAndroidBuild(run(build({ gitCommitHash: '' })), sha as string).result).toBe('no_build');
  });

  it.each([
    ['object', {}], ['array', [ID]], ['number', 5], ['null', null],
    ['newline', `${ID}\nresult=success`], ['trailing newline', `${ID}\n`],
    ['wrong format', 'not-a-uuid'], ['short', ID.slice(1)],
  ])('rejects id: %s', (_n, id) => {
    expect(selectAndroidBuild(run(build({ id })), SHA).result).toBe('no_build');
  });

  it('accepts an uppercase UUID', () => {
    expect(selectAndroidBuild(run(build({ id: ID.toUpperCase() })), SHA).result).toBe('success');
  });

  it.each([
    ['platform', { platform: 'IOS' }], ['status', { status: 'ERRORED' }], ['profile', { buildProfile: 'preview' }],
  ])('rejects wrong %s', (_n, o) => {
    expect(selectAndroidBuild(run(build(o)), SHA).result).toBe('no_build');
  });

  it('maps job states', () => {
    expect(selectAndroidBuild({ jobs: [] }, SHA).result).toBe('absent');
    expect(selectAndroidBuild(run(build(), 'SKIPPED'), SHA).result).toBe('not_success');
    expect(selectAndroidBuild(run(undefined), SHA).result).toBe('no_build');
  });
});
