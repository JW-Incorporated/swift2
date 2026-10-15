import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { vi } from 'vitest';

export const schema = {
  type: 'object',
  properties: { answer: { type: 'string' } },
  required: ['answer'],
  additionalProperties: false,
};

export const baseInput = {
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
  stdout?: string;
  stderr?: string;
  code?: number;
  hang?: boolean;
  error?: Error;
};

export function spawnReturning(input: SpawnResult | SpawnResult[]) {
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

export function successResult(overrides: Record<string, unknown> = {}) {
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

export function limitResult() {
  return successResult({
    is_error: true,
    result: "You've hit your weekly limit - resets 2999-01-01T00:00:00.000Z",
    structured_output: undefined,
  });
}

export function sessionLimitResult() {
  return successResult({
    is_error: true,
    result: 'hit your session limit',
    structured_output: undefined,
  });
}
