import { describe, expect, it } from 'vitest';
import { selectClaudeCallToken, selectClaudeToken } from './claude-token.mjs';

const limitState = { resetAt: '2026-10-15T03:00:00.000Z' };
const backupLimitedState = {
  ...limitState,
  backupResetAt: '2026-10-15T05:00:00.000Z',
};

describe('selectClaudeToken', () => {
  it('uses the primary token when it is not limited', () => {
    expect(selectClaudeToken({ priority: 'routine', hasBackup: true })).toEqual({
      token: 'primary', reason: 'primary token available',
    });
  });

  it('uses the backup token for content while the primary is limited', () => {
    expect(selectClaudeToken({ limitState, priority: 'content', hasBackup: true })).toEqual({
      token: 'backup', reason: 'using backup token until 2026-10-15T03:00:00.000Z',
    });
  });

  it('keeps content on the primary token without a configured backup', () => {
    expect(selectClaudeToken({ limitState: backupLimitedState, priority: 'content', hasBackup: false })).toEqual({
      token: 'primary', reason: 'primary token limited; content priority keeps the primary token',
    });
  });

  it('skips content when both tokens are limited', () => {
    expect(selectClaudeToken({ limitState: backupLimitedState, priority: 'content', hasBackup: true })).toEqual({
      token: 'none', reason: 'both tokens are limited until 2026-10-15T03:00:00.000Z',
    });
  });

  it.each(['P0', 'P1'])('treats %s as content priority', (priority) => {
    expect(selectClaudeToken({ limitState, priority, hasBackup: true }).token).toBe('backup');
  });

  it.each(['P2', 'P3', undefined])('treats %s as non-content priority', (priority) => {
    expect(selectClaudeToken({ limitState, priority, hasBackup: true }).token).toBe('none');
  });

  it('skips non-content work while the primary is limited', () => {
    expect(selectClaudeToken({ limitState, priority: 'routine', hasBackup: true })).toEqual({
      token: 'none', reason: 'skipped: weekly limit until 2026-10-15T03:00:00.000Z',
    });
  });
});

describe('selectClaudeCallToken', () => {
  it('uses the backup when its recorded reset has expired', () => {
    expect(selectClaudeCallToken({
      limitState: {
        resetAt: '2026-10-15T03:00:00.000Z',
        backupResetAt: '2026-10-15T00:30:00.000Z',
      },
      priority: 'P0',
      hasBackup: true,
      now: new Date('2026-10-15T01:00:00.000Z'),
    })).toEqual({
      token: 'backup', reason: 'using backup token until 2026-10-15T03:00:00.000Z',
    });
  });

  it('does not run P0 on a limited primary without a backup', () => {
    expect(selectClaudeCallToken({
      limitState,
      priority: 'P0',
      hasBackup: false,
      now: new Date('2026-10-15T01:00:00.000Z'),
    }).token).toBe('none');
  });
});
