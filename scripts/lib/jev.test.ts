import { describe, expect, it, vi } from 'vitest';
import { createJevClient, createJevUsageLogger, noulQuestion } from './jev.mjs';

const RESPONSE = {
  answers: { decision: { type: 'noul', noul: 0.75 } },
  usage: { input_tokens: 12, output_tokens: 3 },
};
const QUESTIONS = [noulQuestion('decision', 'Is this relevant?')] as const;

function jsonResponse(): Response {
  return new Response(JSON.stringify(RESPONSE), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('createJevUsageLogger', () => {
  it('inserts the llm_usage row produced by the Jev client', async () => {
    const insert = vi.fn(async () => ({ error: null }));
    const from = vi.fn(() => ({ insert }));
    const client = createJevClient({
      apiKey: 'fixture-key',
      fetchImpl: async () => jsonResponse(),
      usageLogger: createJevUsageLogger({ from }),
    });

    await client.ask({ caller: 'jev-unit-test', state: 'text', questions: QUESTIONS });

    expect(from).toHaveBeenCalledWith('llm_usage');
    expect(insert).toHaveBeenCalledWith({
      caller: 'jev-unit-test',
      provider: 'jev',
      model: 'jev-1.13.0',
      token: null,
      input_tokens: 12,
      output_tokens: 3,
      cache_read_tokens: 0,
      cache_creation_input_tokens: null,
      calls: 1,
      est_cost_usd: 5.04e-7,
    });
  });

  it('surfaces insert errors for safelyLog to swallow and warn about', async () => {
    const error = new Error('insert failed');
    const insert = vi.fn(async () => ({ error }));
    const logger = createJevUsageLogger({ from: vi.fn(() => ({ insert })) });
    const warn = vi.fn();
    const client = createJevClient({
      apiKey: 'fixture-key',
      fetchImpl: async () => jsonResponse(),
      usageLogger: logger,
      warn,
    });

    await expect(client.ask({ caller: 'jev-unit-test', state: 'text', questions: QUESTIONS }))
      .resolves.toMatchObject({ answers: { decision: { probability: 0.75 } } });
    expect(warn).toHaveBeenCalledWith('Jev usage logging failed');
  });

  it('returns after two seconds when usage logging never settles', async () => {
    vi.useFakeTimers();
    try {
      const warn = vi.fn();
      const client = createJevClient({
        apiKey: 'fixture-key',
        fetchImpl: async () => jsonResponse(),
        usageLogger: () => new Promise<void>(() => undefined),
        warn,
      });

      const result = client.ask({ caller: 'jev-unit-test', state: 'text', questions: QUESTIONS });
      await vi.advanceTimersByTimeAsync(2_000);

      await expect(result).resolves.toMatchObject({ answers: expect.any(Object) });
      expect(warn).toHaveBeenCalledWith('Jev usage logging failed');
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
