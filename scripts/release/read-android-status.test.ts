import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const SCRIPT = resolve(__dirname, 'read-android-status.sh').replace(/\\/g, '/');
const SHA = 'a'.repeat(40);
const ID = '123e4567-e89b-42d3-a456-426614174000';
const hasBash = spawnSync('bash', ['-c', 'true']).status === 0;

const dir = mkdtempSync(join(tmpdir(), 'fake-eas-'));
const toPosix = (p: string) => p.replace(/\\/g, '/');
writeFileSync(
  join(dir, 'eas'),
  '#!/bin/sh\n[ -n "$FAKE_JSON" ] && printf "%s" "$FAKE_JSON"\n[ -n "$FAKE_ERR" ] && printf "%s\\n" "$FAKE_ERR" >&2\nexit "${FAKE_RC:-0}"\n',
);
chmodSync(join(dir, 'eas'), 0o755);
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const job = (status: string, turtleBuild?: unknown) =>
  JSON.stringify({ jobs: [{ key: 'build_android', status, turtleBuild }] });
const goodBuild = {
  id: ID,
  platform: 'ANDROID',
  status: 'FINISHED',
  buildProfile: 'production',
  gitCommitHash: SHA,
};

function run(rc: number, json: string, err = '') {
  const r = spawnSync('bash', [SCRIPT], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${toPosix(dir)}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH}`,
      RUN_ID: 'run-1',
      GITHUB_SHA: SHA,
      FAKE_RC: String(rc),
      FAKE_JSON: json,
      FAKE_ERR: err,
    },
  });
  const out = Object.fromEntries(
    r.stdout
      .split('\n')
      .filter(Boolean)
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
  );
  return { out, stderr: r.stderr, status: r.status };
}

describe.skipIf(!hasBash)('read-android-status.sh', () => {
  it('exit 11 (run FAILURE) with a good Android build still selects it', () => {
    const r = run(11, job('SUCCESS', goodBuild));
    expect(r.out.result).toBe('success');
    expect(r.out.build_id).toBe(ID);
    expect(r.stderr).toContain('exit code: 11');
  });

  it('exit 11 with build_android FAILURE is not_success', () => {
    const r = run(11, job('FAILURE'));
    expect(r.out.result).toBe('not_success');
    expect(r.out.build_id).toBe('');
  });

  it.each([
    ['SKIPPED', job('SKIPPED')],
    ['absent', JSON.stringify({ jobs: [] })],
  ])('exit 0 with build_android %s is skipped', (_n, json) => {
    expect(run(0, json).out.result).toBe('skipped');
  });

  it('exit 11 with build_android SKIPPED and an existing build selects it', () => {
    const json = JSON.stringify({
      jobs: [
        { key: 'get_android_build', status: 'SUCCESS', turtleBuild: { id: ID } },
        { key: 'build_android', status: 'SKIPPED' },
      ],
    });
    const r = run(11, json);
    expect(r.out.result).toBe('existing');
    expect(r.out.build_id).toBe(ID);
  });

  it('exit 12 (CANCELED) still runs the selector', () => {
    expect(run(12, job('SUCCESS', goodBuild)).out.result).toBe('success');
  });

  it('exit 1 with no JSON is unknown and prints the stderr tail', () => {
    const r = run(1, '', 'boom: auth failed');
    expect(r.out.result).toBe('unknown');
    expect(r.out.build_id).toBe('');
    expect(r.stderr).toContain('boom: auth failed');
    expect(r.stderr).toContain('exit code: 1');
  });
});
