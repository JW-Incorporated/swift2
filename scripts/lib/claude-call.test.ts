import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

type SpawnResult = {
  stdout?: string; stderr?: string; code?: number; hang?: boolean; error?: Error;
};

function spawnReturning(input: SpawnResult | SpawnResult[]) {
  const results = Array.isArray(input) ? input : [input];
  let call = 0;
  return vi.fn((_command: string, _args: string[], _options: object) => {
    void _command;
    void _args;
    void _options;
    const child = new EventEmitter() as EventEmitter & {
      stdout: PassThrough;
      stderr: PassThrough;
      stdin: EventEmitter & { end: ReturnType<typeof vi.fn> };
      kill: ReturnType<typeof vi.fn>;
    };
    const result = results[Math.min(call, results.length - 1)];
    call += 1;
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.stdin = Object.assign(new EventEmitter(), { end: vi.fn() });
    child.kill = vi.fn();
    if (!result.hang) {
      queueMicrotask(() => {
        if (result.error) {
          child.emit('error', result.error);
          return;
        }
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

function limitResult() {
  return successResult({
    is_error: true,
    result: "You've hit your weekly limit - resets 2999-01-01T00:00:00.000Z",
    structured_output: undefined,
  });
}

beforeEach(() => {
  vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-primary-token');
});

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
      status: 'unavailable', reason: 'limit',
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
      { code: 1, stdout: limitResult() }, { stdout: successResult() },
    ]);
    const callClaude = createClaudeCaller({
      spawnImpl, logUsage: (row: unknown) => { rows.push(row); },
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
      status: 'unavailable', reason: 'limit',
      usage: { resetAt: '2999-01-01T00:00:00.000Z' },
    });
    expect(spawnImpl).toHaveBeenCalledOnce();
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

  it('handles spawn ENOENT and cleans up the temporary directory', async () => {
    const error = Object.assign(new Error('spawn claude ENOENT'), { code: 'ENOENT' });
    const spawnImpl = spawnReturning({ error });
    const removeTempDir = vi.fn();
    const callClaude = createClaudeCaller({
      spawnImpl, createTempDir: () => 'test-temp', removeTempDir,
    });
    await expect(callClaude(baseInput)).resolves.toMatchObject({ status: 'unavailable' });
    expect(removeTempDir).toHaveBeenCalledWith('test-temp');
  });

  it('handles an immediate stdin EPIPE while writing a large prompt', async () => {
    const spawnImpl = vi.fn(() => {
      const child = Object.assign(new EventEmitter(), {
        stdout: new PassThrough(), stderr: new PassThrough(), kill: vi.fn(),
      }) as EventEmitter & {
        stdout: PassThrough; stderr: PassThrough; kill: ReturnType<typeof vi.fn>;
        stdin: EventEmitter & { end: ReturnType<typeof vi.fn> };
      };
      child.stdin = Object.assign(new EventEmitter(), {
        end: vi.fn(() => child.stdin.emit('error', Object.assign(new Error('EPIPE'), { code: 'EPIPE' }))),
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
      logUsage: (row: unknown) => { rows.push(row); },
    });
    await callClaude(baseInput);
    expect(rows).toEqual([expect.objectContaining({
      provider: 'claude-subscription', token: 'primary', input_tokens: 10, calls: 1,
    })]);
  });

  it('uses the verified headless flags and writes one usage row per real call', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN_BACKUP', 'test-backup-token');
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-api-key');
    vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-auth-token');
    const rows: unknown[] = [];
    const spawnImpl = spawnReturning({ stdout: successResult({
      result: "You've hit your weekly limit - resets 2999-01-01T00:00:00.000Z",
    }) });
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
      calls: 1,
    }]);
  });
});
