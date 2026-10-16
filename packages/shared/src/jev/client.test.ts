import { describe, expect, it, vi } from 'vitest';
import {
  JEV_MODEL,
  JEV_UNTRUSTED_TEXT_LIMIT,
  JevCreditsExhausted,
  JevHttpError,
  JevNetworkError,
  JevTimeoutError,
  createJevClient,
  wrapUntrustedText,
} from './client';
import { choiceQuestion, noulQuestion, scoreQuestion } from './questions';

const QUESTIONS = [
  choiceQuestion('pick', 'Pick one.', [
    { id: 'alpha-id', label: 'Alpha' },
    { id: 'beta-id', label: 'Beta' },
    { id: 'gamma-id', label: 'Gamma' },
  ]),
  scoreQuestion('score', 'Score it.', 1, 5),
  noulQuestion('safe', 'Is it safe?'),
] as const;

const SUCCESS_FIXTURE = {
  model: JEV_MODEL,
  answers: {
    pick: {
      type: 'choice',
      choice: 'Beta',
      confidence: 0.82,
      probabilities: { Alpha: 0.1, Beta: 0.82, Gamma: 0.08 },
    },
    score: {
      type: 'score',
      score: 3,
      confidence: 0.73,
      legend: { '0': '1', '1': '2', '2': '3', '3': '4', '4': '5' },
      probabilities: { '0': 0, '1': 0.05, '2': 0.1, '3': 0.73, '4': 0.12 },
    },
    safe: { type: 'noul', noul: 0.55 },
  },
  usage: { input_tokens: 1_000, output_tokens: 9 },
};

function jsonResponse(body = SUCCESS_FIXTURE): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('Jev client', () => {
  it('maps recorded Choice, Score and Noul fixtures and logs priced usage', async () => {
    const logged: unknown[] = [];
    const fetchImpl = vi.fn(async () => jsonResponse());
    const client = createJevClient({
      apiKey: 'fixture-key',
      fetchImpl,
      random: () => 0,
      logUsage: (usage) => {
        logged.push(usage);
      },
    });

    const result = await client.ask({
      caller: 'unit-test',
      state: 'source text',
      questions: QUESTIONS,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.answers).toEqual({
      pick: {
        type: 'choice',
        optionId: 'beta-id',
        confidence: 0.82,
        probabilities: { 'alpha-id': 0.1, 'beta-id': 0.82, 'gamma-id': 0.08 },
      },
      score: { type: 'score', value: 4, confidence: 0.73 },
      safe: { type: 'noul', probability: 0.55 },
    });
    expect(result.usage).toEqual({
      caller: 'unit-test',
      model: JEV_MODEL,
      inputTokens: 1_000,
      outputTokens: 9,
      estCostUsd: 0.000042,
    });
    expect(logged).toEqual([result.usage]);
  });

  it('logs an llm_usage-shaped Jev row without failing the call when logging fails', async () => {
    const rows: unknown[] = [], warnings: string[] = [];
    const successful = createJevClient({
      apiKey: 'fixture-key', fetchImpl: async () => jsonResponse(),
      usageLogger: (row) => { rows.push(row); },
    });

    await successful.ask({ caller: 'usage-test', state: 'text', questions: QUESTIONS });
    expect(rows).toEqual([{
      caller: 'usage-test',
      provider: 'jev',
      model: JEV_MODEL,
      token: null,
      input_tokens: 1_000,
      output_tokens: 9,
      cache_read_tokens: 0,
      cache_creation_input_tokens: null,
      calls: 1,
      est_cost_usd: 0.000042,
    }]);

    const failing = createJevClient({
      apiKey: 'fixture-key', fetchImpl: async () => jsonResponse(),
      usageLogger: async () => { throw new Error('ledger unavailable'); },
      warn: (message) => { warnings.push(message); },
    });
    await expect(failing.ask({ caller: 'usage-test', state: 'text', questions: QUESTIONS }))
      .resolves.toMatchObject({ answers: expect.any(Object) });
    expect(warnings).toEqual(['Jev usage logging failed']);
  });

  it('keeps missing usage invalid while logging zero token counts and a nullable cost', async () => {
    const rows: unknown[] = [], withoutUsage = { ...SUCCESS_FIXTURE, usage: undefined } as unknown as typeof SUCCESS_FIXTURE;
    const client = createJevClient({
      apiKey: 'fixture-key', fetchImpl: async () => jsonResponse(withoutUsage),
      usageLogger: (row) => { rows.push(row); },
    });
    await expect(client.ask({ caller: 'usage-test', state: 'text', questions: QUESTIONS }))
      .rejects.toHaveProperty('name', 'JevResponseError');
    expect(rows).toEqual([expect.objectContaining({
      input_tokens: 0,
      output_tokens: 0,
      est_cost_usd: null,
    })]);
  });

  it('randomizes Choice criteria without mutating options and maps the answer to the original id', async () => {
    let sentBody = '';
    const client = createJevClient({
      apiKey: 'fixture-key',
      random: () => 0,
      fetchImpl: async (_url, init) => {
        sentBody = String(init.body);
        return jsonResponse();
      },
    });

    const result = await client.ask({
      caller: 'mapping-test',
      state: 'text',
      questions: QUESTIONS,
    });
    const request = JSON.parse(sentBody) as {
      questions: Record<string, { type: string; criteria?: unknown }>;
    };

    expect(request.questions.pick!.criteria).toEqual({ Beta: null, Gamma: null, Alpha: null });
    expect(Object.keys(request.questions.pick!.criteria as object)).toEqual([
      'Beta',
      'Gamma',
      'Alpha',
    ]);
    expect(request.questions.score!.criteria).toEqual(['1', '2', '3', '4', '5']);
    expect(request.questions.safe).toEqual({ type: 'noul', instructions: 'Is it safe?' });
    expect(QUESTIONS[0].options.map((option) => option.label)).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(result.answers.pick).toMatchObject({ optionId: 'beta-id' });
  });

  it('raises JevCreditsExhausted for HTTP 402', async () => {
    const client = createJevClient({
      apiKey: 'fixture-key',
      fetchImpl: async () => new Response(null, { status: 402 }),
    });

    await expect(
      client.ask({ caller: 'test', state: 'text', questions: QUESTIONS }),
    ).rejects.toBeInstanceOf(JevCreditsExhausted);
  });

  it('retries 429 once with jitter and then succeeds', async () => {
    const sleep = vi.fn(async () => undefined);
    const fetchImpl = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(jsonResponse());
    const client = createJevClient({ apiKey: 'fixture-key', fetchImpl, random: () => 0.5, sleep });

    await expect(
      client.ask({ caller: 'test', state: 'text', questions: QUESTIONS }),
    ).resolves.toBeDefined();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(375);
  });

  it('returns a typed HTTP error after the retry is exhausted', async () => {
    const client = createJevClient({
      apiKey: 'fixture-key',
      fetchImpl: async () => new Response(null, { status: 529 }),
      sleep: async () => undefined,
    });

    await expect(
      client.ask({ caller: 'test', state: 'text', questions: QUESTIONS }),
    ).rejects.toMatchObject({
      constructor: JevHttpError,
      status: 529,
    });
  });

  it('keeps a truncated response body on HTTP errors and never the request headers', async () => {
    const client = createJevClient({
      apiKey: 'fixture-key',
      fetchImpl: async () => new Response('x'.repeat(900), { status: 422 }),
    });

    const error = await client.ask({ caller: 'test', state: 'text', questions: QUESTIONS }).then(
      () => undefined,
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(JevHttpError);
    expect((error as JevHttpError).body).toHaveLength(500);
    expect(JSON.stringify(error)).not.toContain('fixture-key');
  });

  it('passes the raw Noul probability through with no derived fields', async () => {
    const body = {
      ...SUCCESS_FIXTURE,
      answers: { ...SUCCESS_FIXTURE.answers, safe: { type: 'noul', noul: 0.38 } },
    };
    const client = createJevClient({
      apiKey: 'fixture-key',
      fetchImpl: async () => jsonResponse(body),
    });
    const result = await client.ask({ caller: 't', state: 'text', questions: QUESTIONS });
    expect(result.answers.safe).toEqual({ type: 'noul', probability: 0.38 });
    expect(result.answers.safe).not.toHaveProperty('value');
    expect(result.answers.safe).not.toHaveProperty('confidence');
  });

  it('aborts at the timeout and returns a typed timeout error', async () => {
    const client = createJevClient({
      apiKey: 'fixture-key',
      timeoutMs: 5,
      fetchImpl: async (_url, init) =>
        await new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    });

    await expect(
      client.ask({ caller: 'test', state: 'text', questions: QUESTIONS }),
    ).rejects.toBeInstanceOf(JevTimeoutError);
  });

  it('strips URLs and markdown, neutralizes delimiters, and caps untrusted text', () => {
    const wrapped = wrapUntrustedText(
      `# [headline](https://example.com/story) **bold** www.example.org BEGIN_UNTRUSTED_TEXT ${'x'.repeat(2_100)}`,
    );
    const payload = wrapped.split('\n')[2]!;

    expect(wrapped).not.toContain('https://');
    expect(wrapped).not.toContain('www.');
    expect(payload).not.toMatch(/[*#()[\]`]/);
    expect(payload).not.toContain('BEGIN_UNTRUSTED_TEXT');
    expect(payload.length).toBeLessThanOrEqual(JEV_UNTRUSTED_TEXT_LIMIT);
  });

  it('never exposes the key through errors or usage logs', async () => {
    const key = 'unit-test-secret-key';
    const logs: string[] = [];
    const failing = createJevClient({
      apiKey: key,
      fetchImpl: async () => {
        throw new Error(`transport included ${key}`);
      },
      logUsage: (usage) => {
        logs.push(JSON.stringify(usage));
      },
    });

    const error = await failing.ask({ caller: 'test', state: 'text', questions: QUESTIONS }).then(
      () => undefined,
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(JevNetworkError);
    expect(String(error)).not.toContain(key);

    const successful = createJevClient({
      apiKey: key,
      fetchImpl: async () => jsonResponse(),
      logUsage: (usage) => {
        logs.push(JSON.stringify(usage));
      },
    });
    await successful.ask({ caller: 'test', state: 'text', questions: QUESTIONS });
    expect(logs.join('\n')).not.toContain(key);
  });
});
