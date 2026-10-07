import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const LIB = path.resolve(__dirname, 'gh-retry.sh').replace(/\\/g, '/');

const run = (script: string) =>
  spawnSync('bash', ['-c', `. "${LIB}"; ${script}`], {
    encoding: 'utf8',
    env: { ...process.env, GH_RETRY_SLEEPS: '0 0' },
  });

describe('gh_retry', () => {
  it('returns immediately on success with no warning', () => {
    const r = run('gh_retry echo ok');
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('ok\n');
    expect(r.stderr).not.toMatch(/::warning::/);
  });

  it('retries a transient failure and then succeeds', () => {
    const r = run('f() { n=$(cat "$C" 2>/dev/null || echo 0); echo $((n+1)) > "$C"; [ "$n" -ge 1 ]; }; C=$(mktemp); gh_retry f a b');
    expect(r.status).toBe(0);
    expect(r.stderr.match(/::warning::/g)).toHaveLength(1);
  });

  it('gives up after 3 attempts and returns the original exit code', () => {
    const r = run('f() { echo x >> "$C"; return 7; }; C=$(mktemp); gh_retry f a b; rc=$?; wc -l < "$C"; exit $rc');
    expect(r.status).toBe(7);
    expect(r.stdout.trim()).toBe('3');
    expect(r.stderr.match(/::warning::/g)).toHaveLength(2);
  });
});
