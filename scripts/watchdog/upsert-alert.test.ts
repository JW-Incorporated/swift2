import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SCRIPT = path.resolve(__dirname, 'upsert-alert.sh');
const REPO_ROOT = path.resolve(__dirname, '../..');

/**
 * Drives the real script with `gh` and `node` replaced by recorders on PATH:
 * `gh` answers the issue-list lookup from a fixture and appends every other
 * invocation to a log, `node` stands in for post-or-mail.mjs and captures the
 * body file it was handed. That body is what #marjorie actually sees
 * (post-or-mail.mjs posts it verbatim), so it is what these tests assert on.
 */
function runUpsert(
  action: 'open' | 'close',
  title: string,
  body: string,
  { existing = true }: { existing?: boolean } = {},
) {
  const dir = mkdtempSync(path.join(tmpdir(), 'upsert-alert-test-'));
  const bin = path.join(dir, 'bin');
  mkdirSync(bin);
  const bodyFile = path.join(dir, 'alert-body.md');
  writeFileSync(bodyFile, body);
  const ghLog = path.join(dir, 'gh.log');
  const postedBody = path.join(dir, 'posted-body.md');
  const postedArgs = path.join(dir, 'posted-args.txt');

  const listJson = existing
    ? JSON.stringify([{ number: 42, url: 'https://github.com/o/r/issues/42', title }])
    : '[]';
  writeFileSync(
    path.join(bin, 'gh'),
    `#!/usr/bin/env bash\n` +
      `if [ "$1" = "issue" ] && [ "$2" = "list" ]; then printf '%s' ${JSON.stringify(listJson)}; exit 0; fi\n` +
      `printf '%s\\n' "$*" >> "${ghLog}"\n` +
      `if [ "$1" = "issue" ] && [ "$2" = "create" ]; then echo https://github.com/o/r/issues/43; fi\n` +
      `exit 0\n`,
  );
  // post-or-mail.mjs is the only `node` call the script makes; capture the
  // --body-file it was given rather than the shell's own copy.
  writeFileSync(
    path.join(bin, 'node'),
    `#!/usr/bin/env bash\n` +
      `printf '%s\\n' "$*" > "${postedArgs}"\n` +
      `while [ $# -gt 0 ]; do\n` +
      `  if [ "$1" = "--body-file" ]; then cp "$2" "${postedBody}"; fi\n` +
      `  shift\n` +
      `done\n` +
      `exit 0\n`,
  );
  chmodSync(path.join(bin, 'gh'), 0o755);
  chmodSync(path.join(bin, 'node'), 0o755);

  const result = spawnSync('bash', [SCRIPT, action, title, bodyFile], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${bin}${path.delimiter}${process.env.PATH ?? ''}`,
      GH_TOKEN: 'test-token',
      REPO: 'o/r',
      GH_RETRY_SLEEPS: '0 0',
    },
  });

  const read = (file: string) => {
    try {
      return readFileSync(file, 'utf8');
    } catch {
      return '';
    }
  };
  return {
    status: result.status,
    stderr: result.stderr,
    posted: read(postedBody),
    postedArgs: read(postedArgs),
    gh: read(ghLog),
    callerBody: read(bodyFile),
  };
}

const MARK = 'Resolved — no action needed.';
const TITLE = 'Watchdog: link-sweep.yml failed its last 2 scheduled runs';

describe('upsert-alert.sh close', () => {
  // Issue #5336: the owner twice read a recovery notice as a live failure,
  // because the close body reaching Discord was a bare workflow name plus a
  // timestamp with no resolved marker at all.
  it('marks the Discord notice resolved and says no action is needed', () => {
    const r = runUpsert('close', TITLE, '`link-sweep.yml` not 2-consecutive-failing as of 14:35 UTC.\n');
    expect(r.status).toBe(0);
    const firstLine = r.posted.split('\n')[0];
    expect(firstLine).toContain('✅');
    expect(firstLine).toContain(MARK);
    expect(r.posted).toContain(`Cleared: ${TITLE}`);
    // The caller's own status line survives underneath the marker.
    expect(r.posted).toContain('not 2-consecutive-failing as of 14:35 UTC.');
    // No close path may post a bare workflow-name-plus-timestamp line.
    expect(r.posted.trimStart().startsWith('`link-sweep.yml`')).toBe(false);
    // The mail leg's subject reads resolved too.
    expect(r.postedArgs).toContain('--subject Resolved — ');
  });

  it('marks the closing issue comment, and leaves the caller body file untouched', () => {
    const body = 'All watched workflows are succeeding as of 14:35 UTC.\n';
    const r = runUpsert('close', TITLE, body);
    expect(r.gh).toContain('issue comment 42');
    expect(r.gh).toContain('issue close 42');
    expect(r.callerBody).toBe(body);
  });

  it('does not double up the marker when the caller already wrote one', () => {
    const r = runUpsert('close', TITLE, `✅ **${MARK}**\nAlready marked by the caller.\n`);
    expect(r.posted.match(new RegExp(MARK, 'g'))).toHaveLength(1);
  });

  it('still notifies nothing when no alert is open', () => {
    const r = runUpsert('close', TITLE, 'nothing to close\n', { existing: false });
    expect(r.status).toBe(0);
    expect(r.posted).toBe('');
  });
});

describe('upsert-alert.sh open', () => {
  // Still-firing alerts must be unchanged -- same wording, same loudness.
  it('posts the caller body verbatim with no resolved marker', () => {
    const body = '@sffan15-sys — `link-sweep.yml`\'s last 2 scheduled runs both failed.\n';
    const r = runUpsert('open', TITLE, body, { existing: false });
    expect(r.status).toBe(0);
    expect(r.posted).toBe(body);
    expect(r.posted).not.toContain(MARK);
    expect(r.postedArgs).toContain(`--subject ${TITLE}`);
  });
});
