import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClaudeCaller } from './claude-call.mjs';
import { baseInput, limitResult, spawnReturning, successResult } from './claude-call-test-helpers';
import { createClaudeUsageLogger } from './llm-usage.mjs';

beforeEach(() => {
  vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-primary-token');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Claude subscription usage', () => {
  it('inserts a complete row with missing token counts normalized to zero', async () => {
    const insert = vi.fn(async () => ({ error: null }));
    const from = vi.fn(() => ({ insert }));
    const callClaude = createClaudeCaller({
      spawnImpl: spawnReturning({ stdout: successResult({ usage: {} }) }),
      usageLogger: createClaudeUsageLogger({ from }),
    });

    await expect(callClaude(baseInput)).resolves.toMatchObject({ status: 'ok' });

    expect(from).toHaveBeenCalledWith('llm_usage');
    expect(insert).toHaveBeenCalledWith({
      caller: 'test-caller',
      provider: 'claude-subscription',
      model: 'claude-haiku-5-5',
      token: 'primary',
      input_tokens: 0,
      output_tokens: 0,
      cache_read_tokens: 0,
      cache_creation_input_tokens: 0,
      calls: 1,
      est_cost_usd: null,
    });
  });

  it('bounds all inserts from a retried call to two seconds total', async () => {
    vi.useFakeTimers();
    try {
      const warn = vi.fn();
      let insertStarted!: () => void;
      const started = new Promise<void>((resolve) => { insertStarted = resolve; });
      vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN_BACKUP', 'test-backup-token');
      const insert = vi.fn(() => {
        insertStarted();
        return new Promise(() => undefined);
      });
      const callClaude = createClaudeCaller({
        spawnImpl: spawnReturning([
          { code: 1, stdout: limitResult() },
          { stdout: successResult() },
        ]),
        usageLogger: createClaudeUsageLogger({ from: () => ({ insert }) }),
        warn,
      });

      const result = callClaude(baseInput);
      await started;
      await vi.advanceTimersByTimeAsync(2_000);

      await expect(result).resolves.toMatchObject({ status: 'ok', loggerError: true });
      expect(insert).toHaveBeenCalledTimes(2);
      expect(warn).toHaveBeenCalledWith('Claude usage database logging failed');
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
