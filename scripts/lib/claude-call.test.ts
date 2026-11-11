import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClaudeCaller } from './claude-call.mjs';
import {
  baseInput,
  limitResult,
  sessionLimitResult,
  spawnReturning,
  successResult,
} from './claude-call-test-helpers';

beforeEach(() => {
  vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-primary-token');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('callClaude limits', () => {
  it('returns capped without spawning when the per-run call cap is reached', async () => {
    const spawnImpl = spawnReturning({ stdout: successResult() });
    const callClaude = createClaudeCaller({ spawnImpl });
    await expect(callClaude({ ...baseInput, maxCalls: 0 }))
      .resolves.toMatchObject({ status: 'capped' });
    expect(spawnImpl).not.toHaveBeenCalled();
  });

  it('returns capped without spawning when the estimated input cap is exceeded', async () => {
    const spawnImpl = spawnReturning({ stdout: successResult() });
    const callClaude = createClaudeCaller({ spawnImpl, estimateTokens: () => 101 });
    await expect(callClaude(baseInput)).resolves.toMatchObject({ status: 'capped' });
    expect(spawnImpl).not.toHaveBeenCalled();
  });

  it('does not use the backup for P2 when the primary is exhausted', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN_BACKUP', 'test-backup-token');
    const spawnImpl = spawnReturning({ stdout: successResult() });
    const callClaude = createClaudeCaller({
      spawnImpl,
      getLimitState: () => ({ fiveHourResetAt: '2999-01-01T00:00:00.000Z' }),
    });
    await expect(callClaude({ ...baseInput, priority: 'P2' })).resolves.toMatchObject({
      status: 'unavailable',
      reason: 'limit',
    });
    expect(spawnImpl).not.toHaveBeenCalled();
  });

  it('returns unavailable without spawning when both tokens are exhausted', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN_BACKUP', 'test-backup-token');
    const spawnImpl = spawnReturning({ stdout: successResult() });
    const callClaude = createClaudeCaller({
      spawnImpl,
      getLimitState: () => ({
        resetAt: '2999-01-01T00:00:00.000Z',
        backupFiveHourResetAt: '2999-01-02T00:00:00.000Z',
      }),
    });
    await expect(callClaude(baseInput)).resolves.toMatchObject({ status: 'unavailable' });
    expect(spawnImpl).not.toHaveBeenCalled();
  });

  it('uses the limit-gate reset reader to select the backup', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN_BACKUP', 'test-backup-token');
    const spawnImpl = spawnReturning({ stdout: successResult() });
    const callClaude = createClaudeCaller({ spawnImpl });
    await expect(callClaude({
      ...baseInput,
      limitIssue: { body: 'claude-weekly-limit-reset: 2999-01-01T00:00:00.000Z' },
    })).resolves.toMatchObject({ status: 'ok' });
    const options = spawnImpl.mock.calls[0]?.[2] as { env: Record<string, string> };
    expect(options.env.CLAUDE_CODE_OAUTH_TOKEN).toBe('test-backup-token');
  });

  it('retries a P0 primary limit once with the backup and logs both calls', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN_BACKUP', 'test-backup-token');
    const rows: unknown[] = [];
    const spawnImpl = spawnReturning([
      { code: 1, stdout: limitResult() },
      { stdout: successResult() },
    ]);
    const callClaude = createClaudeCaller({
      spawnImpl,
      logUsage: (row: unknown) => {
        rows.push(row);
      },
    });
    await expect(callClaude({ ...baseInput, priority: 'P0' }))
      .resolves.toMatchObject({ status: 'ok' });
    expect(spawnImpl).toHaveBeenCalledTimes(2);
    expect(rows).toEqual([
      expect.objectContaining({ token: 'primary', input_tokens: 10 }),
      expect.objectContaining({ token: 'backup', input_tokens: 10 }),
    ]);
  });

  it('returns a P2 primary limit without trying the backup', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN_BACKUP', 'test-backup-token');
    const spawnImpl = spawnReturning({ code: 1, stdout: limitResult() });
    const callClaude = createClaudeCaller({ spawnImpl });
    await expect(callClaude({ ...baseInput, priority: 'P2' })).resolves.toMatchObject({
      status: 'unavailable',
      reason: 'limit',
      usage: { resetAt: '2999-01-01T00:00:00.000Z' },
    });
    expect(spawnImpl).toHaveBeenCalledOnce();
  });

  it('does not count subscription limits toward the unavailable breaker', async () => {
    const spawnImpl = spawnReturning([
      { code: 1, stdout: limitResult() },
      { code: 1, stdout: limitResult() },
      { code: 1, stdout: limitResult() },
      { stdout: successResult() },
    ]);
    const callClaude = createClaudeCaller({ spawnImpl, logBreaker: vi.fn() });
    const input = { ...baseInput, priority: 'P2' as const, maxCalls: 10 };

    for (let call = 0; call < 3; call += 1) {
      await expect(callClaude(input)).resolves.toMatchObject({
        status: 'unavailable',
        reason: 'limit',
      });
    }
    await expect(callClaude(input)).resolves.toMatchObject({ status: 'ok' });
    expect(spawnImpl).toHaveBeenCalledTimes(4);
  });

  it('re-spawns a P0 five-hour session limit with the backup and returns ok', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN_BACKUP', 'test-backup-token');
    const spawnImpl = spawnReturning([
      { code: 1, stdout: sessionLimitResult() },
      { stdout: successResult() },
    ]);
    const callClaude = createClaudeCaller({ spawnImpl });
    await expect(callClaude({ ...baseInput, priority: 'P0' }))
      .resolves.toMatchObject({ status: 'ok', data: { answer: 'yes' } });
    expect(spawnImpl).toHaveBeenCalledTimes(2);
    const first = spawnImpl.mock.calls[0]?.[2] as { env: Record<string, string> };
    const second = spawnImpl.mock.calls[1]?.[2] as { env: Record<string, string> };
    expect(first.env.CLAUDE_CODE_OAUTH_TOKEN).toBe('test-primary-token');
    expect(second.env.CLAUDE_CODE_OAUTH_TOKEN).toBe('test-backup-token');
  });

  it('returns unavailable for a P2 five-hour session limit without the backup', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN_BACKUP', 'test-backup-token');
    const spawnImpl = spawnReturning({ code: 1, stdout: sessionLimitResult() });
    const callClaude = createClaudeCaller({ spawnImpl });
    await expect(callClaude({ ...baseInput, priority: 'P2' }))
      .resolves.toMatchObject({ status: 'unavailable', reason: 'limit' });
    expect(spawnImpl).toHaveBeenCalledOnce();
    const options = spawnImpl.mock.calls[0]?.[2] as { env: Record<string, string> };
    expect(options.env.CLAUDE_CODE_OAUTH_TOKEN).toBe('test-primary-token');
  });
});
