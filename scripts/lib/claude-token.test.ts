import { describe, expect, it } from 'vitest';
import { selectClaudeToken } from './claude-token.mjs';

const limitState = { resetAt: '2026-10-15T03:00:00.000Z' };

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
    expect(selectClaudeToken({ limitState, priority: 'content', hasBackup: false })).toEqual({
      token: 'primary', reason: 'primary token limited; content priority keeps the primary token',
    });
  });

  it('skips non-content work while the primary is limited', () => {
    expect(selectClaudeToken({ limitState, priority: 'routine', hasBackup: true })).toEqual({
      token: 'none', reason: 'skipped: weekly limit until 2026-10-15T03:00:00.000Z',
    });
  });
});
