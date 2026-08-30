import { describe, expect, it } from 'vitest';
// @ts-expect-error The executable authoring runner is intentionally plain ESM.
import {
  CAP_STOP_REASON,
  capIssueContent,
  judgePairWithClaude,
  MAX_RUN_COST_USD,
  RESERVATION_PER_PAIR_USD,
  requiresApiKey,
  runAuthoring,
  upsertCapIssue,
} from './audit-matches-authoring.mjs';

const source: Record<string, unknown> = {
  productId: 'moment-1:0:https://shop.example/dress',
  cacheKey: 'pair-1',
  productUrl: 'https://shop.example/dress',
  productImageUrl: 'https://images.example/product.jpg',
  momentImageUrl: 'https://images.example/moment.jpg',
  score: null,
  tier: 'unresolved',
  kind: null,
  reasons: ['not judged before run cap'],
};

function receipt(judgments: Record<string, unknown>[] = [source]) {
  return {
    schemaVersion: 1,
    providerModel: 'claude-sonnet-5',
    thinking: 'disabled',
    status: 'partial',
    detectorReceipt: { records: 133, queued: 125, reused: 0, unscored: 8 },
    run: { capUsd: 5, observedCostUsd: 0, completedJudgments: 0 },
    judgments,
    unscored: Array.from({ length: 8 }, (_, index) => ({
      productId: `unscored-${index}`,
      tier: 'unscored',
    })),
  };
}

const queue = { queue: [{ ...source }] };

const validJudgment = {
  score: 92,
  kind: 'dress',
  reasons: ['same black sequined mini-dress silhouette'],
};

describe('E3 authoring runner cost reservation', () => {
  it('reserves a worst-case pair cost before the request and stops before reaching the cap', async () => {
    const requests: string[] = [];
    const result = await runAuthoring({
      receipt: receipt([
        { ...source },
        { ...source, productId: 'moment-2:0:https://shop.example/top', cacheKey: 'pair-2' },
      ]),
      queue: {
        queue: [
          { ...source },
          { ...source, productId: 'moment-2:0:https://shop.example/top', cacheKey: 'pair-2' },
        ],
      },
      capUsd: RESERVATION_PER_PAIR_USD * 2,
      judge: async (pair: { cacheKey: string }) => {
        requests.push(pair.cacheKey);
        return validJudgment;
      },
    });

    expect(RESERVATION_PER_PAIR_USD).toBeCloseTo(0.03408, 8);
    expect(requests).toEqual(['pair-1']);
    expect(result.run.reservedCostUsd).toBeCloseTo(RESERVATION_PER_PAIR_USD, 8);
    expect(result.run.reservedCostUsd).toBeLessThan(MAX_RUN_COST_USD);
    expect(result.run.stopReason).toBe('run cap would be reached before next request');
    expect(result.judgments.map((judgment: { tier: string }) => judgment.tier)).toEqual([
      'exact',
      'unresolved',
    ]);
    expect(result.judgments[1].score).toBeNull();
  });

  it('logs a zero-spend run when there are no eligible image pairs', async () => {
    const unavailable = { ...source, productImageUrl: null, cacheKey: null };
    const result = await runAuthoring({
      receipt: receipt([unavailable]),
      queue: { queue: [unavailable] },
      judge: async () => {
        throw new Error('unavailable pairs must never be judged');
      },
    });

    expect(result.run.reservedCostUsd).toBe(0);
    expect(result.run.completedJudgments).toBe(0);
    expect(result.run.stopReason).toBe('no eligible image pairs');
    expect(result.judgments[0]).toMatchObject({ score: null, tier: 'unresolved', kind: null });
    expect(result.judgments[0].reasons).toEqual(['product image unavailable']);
  });

  it('writes a schema-valid scored judgment from an available fixture pair without fabricating fields', async () => {
    const result = await runAuthoring({
      receipt: receipt(),
      queue,
      judge: async () => validJudgment,
    });

    expect(result).toMatchObject({
      schemaVersion: 1,
      providerModel: 'claude-sonnet-5',
      thinking: 'disabled',
      detectorReceipt: { records: 133, queued: 125, reused: 0, unscored: 8 },
    });
    expect(result.judgments).toEqual([
      {
        ...source,
        score: 92,
        tier: 'exact',
        kind: 'dress',
        reasons: validJudgment.reasons,
      },
    ]);
    expect(result.status).toBe('complete');
  });

  it('uses a newly detected queue pair even when the earlier receipt has no judgment for it', async () => {
    const result = await runAuthoring({
      receipt: receipt([]),
      queue,
      judge: async () => validJudgment,
    });

    expect(result.judgments).toHaveLength(1);
    expect(result.judgments[0]).toMatchObject({
      productId: source.productId,
      score: 92,
      tier: 'exact',
    });
  });

  it('requires an API key for an eligible pair introduced by the detector queue', () => {
    expect(requiresApiKey(receipt([]), queue)).toBe(true);
    expect(
      requiresApiKey(receipt([]), {
        queue: [{ ...source, productImageUrl: null, cacheKey: null }],
      }),
    ).toBe(false);
    expect(requiresApiKey(receipt(), { queue: [] })).toBe(false);
  });

  it('reuses a completed detector-pair cache entry without another request', async () => {
    const resolved = {
      ...source,
      score: 71,
      tier: 'close',
      kind: 'top',
      reasons: ['matching red blouse'],
    };
    const result = await runAuthoring({
      receipt: receipt([resolved, { ...source, productId: 'other', cacheKey: 'pair-1' }]),
      queue: { queue: [source, { ...source, productId: 'other', cacheKey: 'pair-1' }] },
      judge: async () => {
        throw new Error('cached detector pair must not be judged twice');
      },
    });

    expect(result.run.reservedCostUsd).toBe(0);
    expect(result.judgments[1]).toMatchObject({ score: 71, tier: 'close', kind: 'top' });
  });

  it('makes only one request for duplicate unresolved detector cache keys', async () => {
    const requests: string[] = [];
    await runAuthoring({
      receipt: receipt([source, { ...source, productId: 'duplicate-product' }]),
      queue: { queue: [source, { ...source, productId: 'duplicate-product' }] },
      judge: async (pair: { cacheKey: string }) => {
        requests.push(pair.cacheKey);
        return null;
      },
    });

    expect(requests).toEqual(['pair-1']);
  });

  it('uses a one-pair Claude request with thinking explicitly disabled', async () => {
    let request: Request | undefined;
    const response = await judgePairWithClaude(source, {
      apiKey: 'test-key',
      fetchImpl: async (_url: string, init: RequestInit) => {
        request = new Request('https://api.anthropic.com/v1/messages', init);
        return new Response(
          JSON.stringify({
            content: [{ type: 'tool_use', name: 'record_match_judgment', input: validJudgment }],
          }),
          { status: 200 },
        );
      },
    });

    const payload = (await request?.json()) as Record<string, unknown>;
    expect(payload).toMatchObject({
      model: 'claude-sonnet-5',
      max_tokens: 256,
      thinking: { type: 'disabled' },
    });
    expect((payload.messages as Array<{ content: unknown[] }>)[0].content).toHaveLength(3);
    expect(response).toEqual(validJudgment);
  });

  it('creates one exact-title follow-up issue when a cap stop leaves pairs unresolved', async () => {
    const artifact = {
      run: {
        stopReason: CAP_STOP_REASON,
        reservedCostUsd: 0.03408,
        capUsd: 0.06816,
        completedJudgments: 1,
      },
      judgments: [
        { ...source, reasons: ['not judged before run cap'] },
        {
          ...source,
          productId: 'resolved',
          score: 92,
          tier: 'exact',
          kind: 'dress',
          reasons: ['same dress'],
        },
      ],
    };
    const content = capIssueContent(artifact);
    const calls: string[][] = [];
    const url = await upsertCapIssue(content, {
      execImpl: async (args: string[]) => {
        calls.push(args);
        return args[1] === 'list'
          ? { stdout: '[]' }
          : { stdout: 'https://github.com/JW-Incorporated/Swift2/issues/999\n' };
      },
    });

    expect(content?.body).toContain(source.productId);
    expect(url).toBe('https://github.com/JW-Incorporated/Swift2/issues/999');
    expect(calls).toHaveLength(2);
    expect(calls[1]).toContain('create');
    expect(calls[1]).toContain(content?.title);
  });

  it('comments on an exact-title cap issue instead of creating another one', async () => {
    const content = capIssueContent({
      run: {
        stopReason: CAP_STOP_REASON,
        reservedCostUsd: 0.03408,
        capUsd: 0.06816,
        completedJudgments: 0,
      },
      judgments: [{ ...source, reasons: ['not judged before run cap'] }],
    });
    const calls: string[][] = [];
    await upsertCapIssue(content, {
      execImpl: async (args: string[]) => {
        calls.push(args);
        return args[1] === 'list'
          ? {
              stdout: JSON.stringify([
                {
                  number: 44,
                  url: 'https://github.com/JW-Incorporated/Swift2/issues/44',
                  title: content?.title,
                },
              ]),
            }
          : { stdout: 'https://github.com/JW-Incorporated/Swift2/issues/44\n' };
      },
    });

    expect(calls).toHaveLength(2);
    expect(calls[1]).toContain('comment');
    expect(calls[1]).not.toContain('create');
  });

  it('does not prepare a follow-up issue for a non-cap artifact', () => {
    expect(
      capIssueContent({ run: { stopReason: 'no eligible image pairs' }, judgments: [] }),
    ).toBeNull();
  });
});
