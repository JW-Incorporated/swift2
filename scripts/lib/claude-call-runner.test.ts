import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClaudeCaller } from './claude-call.mjs';
import {
  baseInput,
  schema,
  spawnReturning,
  successResult,
} from './claude-call-test-helpers';

beforeEach(() => {
  vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-primary-token');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('callClaude runner', () => {
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

  it('handles spawn ENOENT and cleans up the temporary directory', async () => {
    const error = Object.assign(new Error('spawn claude ENOENT'), { code: 'ENOENT' });
    const spawnImpl = spawnReturning({ error });
    const removeTempDir = vi.fn();
    const callClaude = createClaudeCaller({
      spawnImpl,
      createTempDir: () => 'test-temp',
      removeTempDir,
    });
    await expect(callClaude(baseInput)).resolves.toMatchObject({ status: 'unavailable' });
    expect(removeTempDir).toHaveBeenCalledWith('test-temp');
  });

  it('opens the breaker after three timeouts and does not spawn the fourth call', async () => {
    const spawnImpl = spawnReturning({ hang: true });
    const logBreaker = vi.fn();
    const callClaude = createClaudeCaller({ spawnImpl, timeoutMs: 1, logBreaker });
    const breakerInput = { ...baseInput, maxCalls: 10 };

    for (let call = 0; call < 3; call += 1) {
      await expect(callClaude(breakerInput)).resolves.toMatchObject({
        status: 'unavailable',
        reason: 'Claude CLI timed out',
      });
    }
    await expect(callClaude(breakerInput)).resolves.toMatchObject({
      status: 'unavailable',
      reason: 'Claude call circuit breaker open',
    });
    expect(spawnImpl).toHaveBeenCalledTimes(3);
    expect(logBreaker).toHaveBeenCalledOnce();
  });

  it('does not reserve a cap slot when an in-flight call reaches an opened breaker', async () => {
    const spawnImpl = spawnReturning({ hang: true });
    const callCounts = new Map<string, number>();
    let directoryCount = 0;
    let releaseFourth!: () => void;
    const fourthDirectory = new Promise<void>((resolve) => { releaseFourth = resolve; });
    const createTempDir = vi.fn(async () => {
      directoryCount += 1;
      if (directoryCount === 4) await fourthDirectory;
      return `test-temp-${directoryCount}`;
    });
    const callClaude = createClaudeCaller({
      spawnImpl,
      callCounts,
      createTempDir,
      removeTempDir: vi.fn(),
      getLimitState: vi.fn().mockResolvedValue(null),
      timeoutMs: 1,
      logBreaker: vi.fn(),
    });
    const input = { ...baseInput, maxCalls: 4 };
    await callClaude(input);
    await callClaude(input);
    const third = callClaude(input);
    const fourth = callClaude(input);

    await third;
    expect(callCounts.get(baseInput.caller)).toBe(3);
    releaseFourth();
    await expect(fourth).resolves.toMatchObject({
      status: 'unavailable',
      reason: 'Claude call circuit breaker open',
    });
    expect(callCounts.get(baseInput.caller)).toBe(3);
    expect(spawnImpl).toHaveBeenCalledTimes(3);
  });

  it('resets consecutive breaker failures after a successful call', async () => {
    const spawnImpl = spawnReturning([
      { hang: true },
      { hang: true },
      { stdout: successResult() },
      { hang: true },
      { hang: true },
      { stdout: successResult() },
    ]);
    const logBreaker = vi.fn();
    const callClaude = createClaudeCaller({ spawnImpl, timeoutMs: 1, logBreaker });
    const breakerInput = { ...baseInput, maxCalls: 10 };

    for (let call = 0; call < 6; call += 1) await callClaude(breakerInput);

    expect(spawnImpl).toHaveBeenCalledTimes(6);
    expect(logBreaker).not.toHaveBeenCalled();
  });

  it('handles an immediate stdin EPIPE while writing a large prompt', async () => {
    const spawnImpl = vi.fn(() => {
      const child = Object.assign(new EventEmitter(), {
        stdout: new PassThrough(),
        stderr: new PassThrough(),
        kill: vi.fn(),
      }) as EventEmitter & {
        stdout: PassThrough;
        stderr: PassThrough;
        kill: ReturnType<typeof vi.fn>;
        stdin: EventEmitter & { end: ReturnType<typeof vi.fn> };
      };
      child.stdin = Object.assign(new EventEmitter(), {
        end: vi.fn(() => child.stdin.emit(
          'error',
          Object.assign(new Error('EPIPE'), { code: 'EPIPE' }),
        )),
      });
      queueMicrotask(() => child.emit('close', 1));
      return child;
    });
    const callClaude = createClaudeCaller({ spawnImpl, estimateTokens: () => 1 });
    await expect(callClaude({ ...baseInput, user: 'x'.repeat(1_000_000) }))
      .resolves.toMatchObject({ status: 'unavailable' });
  });

  it('parses and logs usage from a non-zero exit', async () => {
    const rows: unknown[] = [];
    const spawnImpl = spawnReturning({ code: 1, stdout: successResult() });
    const callClaude = createClaudeCaller({
      spawnImpl,
      logUsage: (row: unknown) => {
        rows.push(row);
      },
    });
    await callClaude(baseInput);
    expect(rows).toEqual([expect.objectContaining({
      provider: 'claude-subscription',
      token: 'primary',
      input_tokens: 10,
      calls: 1,
    })]);
  });

  it.each([
    ['throws', () => {
      throw new Error('logger failed');
    }],
    ['rejects', () => Promise.reject(new Error('logger failed'))],
  ])('reports loggerError when the usage logger %s', async (_name, logUsage) => {
    const callClaude = createClaudeCaller({
      spawnImpl: spawnReturning({ stdout: successResult() }),
      logUsage,
    });
    await expect(callClaude(baseInput))
      .resolves.toMatchObject({ status: 'ok', loggerError: true });
  });

  it('uses the verified headless flags and writes one usage row per real call', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN_BACKUP', 'test-backup-token');
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-api-key');
    vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-auth-token');
    const rows: unknown[] = [];
    const spawnImpl = spawnReturning({
      stdout: successResult({
        result: "You've hit your weekly limit - resets 2999-01-01T00:00:00.000Z",
      }),
    });
    const createTempDir = vi.fn().mockResolvedValue('C:\\temp\\claude-call-test');
    const removeTempDir = vi.fn().mockResolvedValue(undefined);
    const callClaude = createClaudeCaller({
      spawnImpl,
      logUsage: (row: unknown) => {
        rows.push(row);
      },
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
    const env = (spawnImpl.mock.calls[0]?.[2] as { env: Record<string, string> }).env;
    const allowed = new Set([
      'PATH', 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'TEMP', 'TMP', 'TMPDIR',
      'SystemRoot', 'ComSpec', 'CLAUDE_CODE_OAUTH_TOKEN',
    ]);
    expect(Object.keys(env).every((key) => allowed.has(key))).toBe(true);
    expect(env.CLAUDE_CODE_OAUTH_TOKEN).toBe('test-primary-token');
    expect(env).not.toHaveProperty('CLAUDE_CODE_OAUTH_TOKEN_BACKUP');
    expect(Object.keys(env).some((key) => key.startsWith('ANTHROPIC_'))).toBe(false);
    expect(spawnImpl.mock.results[0]?.value.stdin.end).toHaveBeenCalledWith('Answer yes.');
    expect(createTempDir).toHaveBeenCalledOnce();
    expect(removeTempDir).toHaveBeenCalledWith('C:\\temp\\claude-call-test');
    expect(rows).toEqual([{
      caller: 'test-caller',
      provider: 'claude-subscription',
      model: 'claude-haiku-5-5',
      token: 'primary',
      input_tokens: 10,
      output_tokens: 4,
      cache_read_tokens: 3,
      cache_creation_input_tokens: 12,
      calls: 1,
    }]);
  });
});
