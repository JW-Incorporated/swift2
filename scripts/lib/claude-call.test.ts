import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createClaudeCaller } from './claude-call.mjs';

const schema = {
  type: 'object',
  properties: { answer: { type: 'string' } },
  required: ['answer'],
  additionalProperties: false,
};

const baseInput = {
  caller: 'test-caller',
  priority: 'P1',
  model: 'claude-haiku-5-5',
  system: 'Return JSON.',
  user: 'Answer yes.',
  schema,
  maxInputTokens: 100,
  maxCalls: 1,
} as const;

type SpawnResult = { stdout?: string; stderr?: string; code?: number; hang?: boolean };

function spawnReturning(result: SpawnResult) {
  return vi.fn((_command: string, _args: string[], _options: object) => {
    void _command;
    void _args;
    void _options;
    const child = new EventEmitter() as EventEmitter & {
      stdout: PassThrough;
      stderr: PassThrough;
      stdin: { end: ReturnType<typeof vi.fn> };
      kill: ReturnType<typeof vi.fn>;
    };
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.stdin = { end: vi.fn() };
    child.kill = vi.fn();
    if (!result.hang) {
      queueMicrotask(() => {
        child.stdout.end(result.stdout ?? '');
        child.stderr.end(result.stderr ?? '');
        child.emit('close', result.code ?? 0);
      });
    }
    return child;
  });
}

function successResult(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    type: 'result',
    is_error: false,
    result: '{"answer":"yes"}',
    structured_output: { answer: 'yes' },
    usage: {
      input_tokens: 10,
      cache_creation_input_tokens: 12,
      cache_read_input_tokens: 3,
      output_tokens: 4,
    },
    ...overrides,
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('callClaude', () => {
  it('returns capped without spawning when the per-run call cap is reached', async () => {
    const spawnImpl = spawnReturning({ stdout: successResult() });
    const callClaude = createClaudeCaller({ spawnImpl });

    await expect(callClaude({ ...baseInput, maxCalls: 0 })).resolves.toMatchObject({
      status: 'capped',
    });
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
      status: 'capped',
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

  it.each([
    ['invalid result JSON', { result: 'not JSON', structured_output: undefined }],
    ['a schema miss', { result: '{"wrong":true}', structured_output: { wrong: true } }],
  ])('returns invalid for %s', async (_name, overrides) => {
    const spawnImpl = spawnReturning({ stdout: successResult(overrides) });
    const callClaude = createClaudeCaller({ spawnImpl });

    await expect(callClaude(baseInput)).resolves.toMatchObject({ status: 'invalid' });
  });

  it.each([
    ['a non-zero exit', { code: 1, stderr: 'failed' }, 100],
    ['a timeout', { hang: true }, 5],
  ])('returns unavailable and never throws for %s', async (_name, result, timeoutMs) => {
    const spawnImpl = spawnReturning(result);
    const callClaude = createClaudeCaller({ spawnImpl, timeoutMs });

    await expect(callClaude(baseInput)).resolves.toMatchObject({ status: 'unavailable' });
  });

  it('logs one unavailable usage row for a failed real call', async () => {
    const rows: unknown[] = [];
    const spawnImpl = spawnReturning({ code: 1 });
    const callClaude = createClaudeCaller({
      spawnImpl,
      logUsage: (row: unknown) => { rows.push(row); },
    });

    await callClaude(baseInput);
    expect(rows).toEqual([expect.objectContaining({ calls: 1, status: 'unavailable' })]);
  });

  it('uses the verified headless flags and writes one usage row per real call', async () => {
    const rows: unknown[] = [];
    const spawnImpl = spawnReturning({ stdout: successResult() });
    const createTempDir = vi.fn().mockResolvedValue('C:\\temp\\claude-call-test');
    const removeTempDir = vi.fn().mockResolvedValue(undefined);
    const callClaude = createClaudeCaller({
      spawnImpl,
      logUsage: (row: unknown) => { rows.push(row); },
      createTempDir,
      removeTempDir,
    });

    await expect(callClaude(baseInput)).resolves.toEqual({
      status: 'ok',
      data: { answer: 'yes' },
      usage: {
        inputTokens: 10,
        cacheCreationInputTokens: 12,
        cacheReadInputTokens: 3,
        outputTokens: 4,
      },
    });
    expect(spawnImpl).toHaveBeenCalledOnce();
    expect(spawnImpl.mock.calls[0]?.[1]).toEqual([
      '-p', '--output-format', 'json', '--safe-mode', '--setting-sources', '',
      '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--tools', '',
      '--no-session-persistence', '--model', 'claude-haiku-5-5',
      '--system-prompt', 'Return JSON.', '--json-schema', JSON.stringify(schema),
    ]);
    expect(spawnImpl.mock.calls[0]?.[2]).toEqual(expect.objectContaining({
      cwd: 'C:\\temp\\claude-call-test',
      windowsHide: true,
    }));
    expect(spawnImpl.mock.results[0]?.value.stdin.end).toHaveBeenCalledWith('Answer yes.');
    expect(createTempDir).toHaveBeenCalledOnce();
    expect(removeTempDir).toHaveBeenCalledWith('C:\\temp\\claude-call-test');
    expect(rows).toEqual([{
      caller: 'test-caller',
      model: 'claude-haiku-5-5',
      inputTokens: 10,
      cacheCreationInputTokens: 12,
      cacheReadInputTokens: 3,
      outputTokens: 4,
      calls: 1,
      status: 'ok',
    }]);
  });
});
