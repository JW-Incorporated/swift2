import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClaudeCaller } from './claude-call.mjs';
import { baseInput, spawnReturning, successResult } from './claude-call-test-helpers';

const CANARY = 'CANARY-PROMPT-7f3a-do-not-log';

beforeEach(() => {
  vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-primary-token');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('callClaude failure logging', () => {
  it('logs one status-only line on a failed call, never the prompt, stdout or stderr', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const spawnImpl = spawnReturning({ stdout: `{"result":"${CANARY}"}`, stderr: `stderr ${CANARY}`, code: 3 });
    const callClaude = createClaudeCaller({ spawnImpl, getLimitState: () => ({}) });
    const result = await callClaude({ ...baseInput, user: `Answer ${CANARY}`, schema: undefined });
    expect(result).toMatchObject({ status: 'unavailable' });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const line = String(errorSpy.mock.calls[0][0]);
    expect(line).toBe('[claude-call] status=unavailable reason=Claude CLI unavailable exitCode=3 timedOut=false');
    expect(line).not.toContain(CANARY);
  });

  it('logs nothing on a successful call', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const spawnImpl = spawnReturning({ stdout: successResult({ result: 'yes' }) });
    const callClaude = createClaudeCaller({ spawnImpl, getLimitState: () => ({}) });
    await expect(callClaude({ ...baseInput, schema: undefined })).resolves.toMatchObject({ status: 'ok' });
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
