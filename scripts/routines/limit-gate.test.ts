import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { decideLimitGate, failOpenGate, issueReset } from './limit-gate.mjs';

const futureIssue = {
  number: 42,
  body: 'claude-weekly-limit-reset: 2026-10-15T03:00:00.000Z\nclaude-weekly-limit-detected: 2026-10-14T20:00:00.000Z',
  createdAt: '2026-10-14T20:00:00.000Z',
};
const now = new Date('2026-10-14T21:00:00.000Z');
const backupLimitedIssue = {
  ...futureIssue,
  body: `${futureIssue.body}\nclaude-weekly-limit-reset-backup: 2026-10-15T05:00:00.000Z`,
};

describe('decideLimitGate', () => {
  it('fails open when the GitHub API is unavailable', () => {
    expect(failOpenGate()).toEqual({
      skip: false,
      message: '::warning::weekly-limit gate unavailable; running routine without a limit check',
    });
  });

  it('makes the workflow entry point warn and continue when GitHub context is unavailable', () => {
    const output = execFileSync(process.execPath, ['scripts/routines/limit-gate.mjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, GH_TOKEN: '', GITHUB_REPOSITORY: '', ROUTINES_PAUSED: 'false' },
    });
    expect(output).toContain('::warning::weekly-limit gate unavailable');
  });

  it('runs when there is no issue', () => {
    expect(decideLimitGate({ issues: [], now, priority: 'routine' })).toEqual({
      skip: false, message: null,
    });
  });

  it('skips non-content work until a future reset with the exact log line', () => {
    expect(decideLimitGate({ issues: [futureIssue], now, priority: 'routine' })).toEqual({
      skip: true,
      message: 'skipped: weekly limit until 2026-10-15T03:00:00.000Z',
    });
  });

  it('runs content priority on the backup through an active weekly limit', () => {
    expect(decideLimitGate({ issues: [futureIssue], now, priority: 'content', hasBackup: true })).toEqual({
      skip: false,
      message: 'using backup token until 2026-10-15T03:00:00.000Z',
      token: 'backup',
    });
  });

  it('skips content when the backup is also limited', () => {
    expect(decideLimitGate({ issues: [backupLimitedIssue], now, priority: 'content', hasBackup: true })).toEqual({
      skip: true,
      message: 'both tokens are limited until 2026-10-15T05:00:00.000Z',
    });
  });

  it('keeps P0-01 gate outputs unchanged without a backup token', () => {
    expect(decideLimitGate({ issues: [], now, priority: 'routine' })).toEqual({ skip: false, message: null });
    expect(decideLimitGate({ issues: [futureIssue], now, priority: 'routine' })).toEqual({
      skip: true, message: 'skipped: weekly limit until 2026-10-15T03:00:00.000Z',
    });
    expect(decideLimitGate({ issues: [futureIssue], now, priority: 'content' })).toEqual({
      skip: false, message: null,
    });
  });

  it('runs after the reset and marks the issue for closure', () => {
    expect(
      decideLimitGate({ issues: [futureIssue], now: new Date('2026-10-15T03:00:01.000Z'), priority: 'routine' }),
    ).toEqual({ skip: false, message: null, closeIssueNumber: 42 });
  });

  it('skips every priority when ROUTINES_PAUSED is true', () => {
    expect(decideLimitGate({ issues: [], now, priority: 'content', routinesPaused: 'true' })).toEqual({
      skip: true,
      message: 'skipped: routines paused',
    });
  });

  it('uses a bounded six-hour pause for an unparseable reset', () => {
    const issue = {
      number: 43,
      body: 'claude-weekly-limit-reset: not-a-time\nclaude-weekly-limit-detected: 2026-10-14T20:00:00.000Z',
    };
    expect(issueReset(issue, { now })).toEqual({
      resetAt: '2026-10-15T02:00:00.000Z',
      fallback: true,
    });
    expect(decideLimitGate({ issues: [issue], now, priority: 'routine' }).skip).toBe(true);
    expect(
      decideLimitGate({ issues: [issue], now: new Date('2026-10-15T02:00:01.000Z'), priority: 'routine' }),
    ).toEqual({ skip: false, message: null, closeIssueNumber: 43 });
  });

  it('does not renew a malformed issue that has no trustworthy time anchor', () => {
    expect(decideLimitGate({
      issues: [{ number: 44, body: 'claude-weekly-limit-reset: not-a-time' }], now, priority: 'routine',
    })).toEqual({ skip: false, message: null, closeIssueNumber: 44 });
  });
});
