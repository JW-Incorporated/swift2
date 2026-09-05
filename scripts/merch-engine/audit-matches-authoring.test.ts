import { describe, expect, it } from 'vitest';
// @ts-expect-error The executable authoring runner is intentionally plain ESM.
import {
  CAP_STOP_REASON,
  capIssueContent,
  judgePairWithClaude,
  MAX_RUN_COST_USD,
  reSourceIssueContent,
  retailerOgImage,
  RETAILER_FETCH_TIMEOUT_MS,
  RESERVATION_PER_REQUEST_USD,
  requiresApiKey,
  runAuthoring,
  upsertCapIssue,
} from './audit-matches-authoring.mjs';
// @ts-expect-error The deterministic cache helper is intentionally plain ESM.
import { auditCacheKey } from './audit-matches.mjs';

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
      capUsd: RESERVATION_PER_REQUEST_USD * 2,
      judge: async (pair: { cacheKey: string }) => {
        requests.push(pair.cacheKey);
        return validJudgment;
      },
    });

    expect(RESERVATION_PER_REQUEST_USD).toBeCloseTo(0.03408, 8);
    expect(requests).toEqual(['pair-1']);
    expect(result.run.reservedCostUsd).toBeCloseTo(RESERVATION_PER_REQUEST_USD, 8);
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

  it('hydrates an otherwise comparable retailer listing before judging it', async () => {
    const withoutImage = {
      ...source,
      cacheKey: null,
      productImageUrl: null,
      productUrl: 'https://shop.example/dress',
    };
    const result = await runAuthoring({
      receipt: receipt([withoutImage]),
      queue: { queue: [withoutImage] },
      resolveProductImage: async () => 'https://images.example/recovered-product.jpg',
      judge: async () => validJudgment,
    });

    expect(result.judgments[0]).toMatchObject({
      productImageUrl: 'https://images.example/recovered-product.jpg',
      score: 92,
      tier: 'exact',
      kind: 'dress',
    });
  });

  it('reuses a recovered receipt image without refetching a transiently unavailable retailer', async () => {
    const productImageUrl = 'https://images.example/recovered-product.jpg';
    const prior = {
      ...source,
      productImageUrl,
      cacheKey: auditCacheKey({ ...source, productImageUrl }),
      score: 92,
      tier: 'exact',
      kind: 'dress',
      reasons: validJudgment.reasons,
    };
    let hydrations = 0;
    const result = await runAuthoring({
      receipt: receipt([prior]),
      queue: { queue: [{ ...source, productImageUrl: null, cacheKey: null }] },
      resolveProductImage: async () => {
        hydrations += 1;
        throw new Error('retailer temporarily unavailable');
      },
      judge: async () => {
        throw new Error('cached judgment must be reused');
      },
    });

    expect(hydrations).toBe(0);
    expect(result.run.reservedCostUsd).toBe(0);
    expect(result.status).toBe('complete');
    expect(result.judgments[0]).toMatchObject({ productImageUrl, score: 92, tier: 'exact' });
  });

  it('rejudges a recovered product when the moment image changes', async () => {
    const productImageUrl = 'https://images.example/recovered-product.jpg';
    const prior = {
      ...source,
      productImageUrl,
      cacheKey: auditCacheKey({ ...source, productImageUrl }),
      score: 92,
      tier: 'exact',
      kind: 'dress',
      reasons: validJudgment.reasons,
    };
    let judged = false;
    await runAuthoring({
      receipt: receipt([prior]),
      queue: {
        queue: [
          {
            ...source,
            productImageUrl: null,
            cacheKey: null,
            momentImageUrl: 'https://images.example/new-moment.jpg',
          },
        ],
      },
      resolveProductImage: async () => {
        throw new Error('retailer must not be fetched');
      },
      judge: async (pair) => {
        judged = pair.productImageUrl === productImageUrl;
        return validJudgment;
      },
    });

    expect(judged).toBe(true);
  });

  it('bounds retailer image fetches with an abort signal', async () => {
    let init: RequestInit | undefined;
    await retailerOgImage('https://shop.example/dress', {
      fetchImpl: async (_url, options) => {
        init = options;
        return new Response(
          '<meta property="og:image" content="https://images.example/dress.jpg">',
        );
      },
    });

    expect(RETAILER_FETCH_TIMEOUT_MS).toBeGreaterThan(0);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('stops hydrating after its run-level budget is exhausted', async () => {
    let hydrations = 0;
    const missingImage = { ...source, productImageUrl: null, cacheKey: null };
    const result = await runAuthoring({
      receipt: receipt([missingImage]),
      queue: { queue: [missingImage, { ...missingImage, productId: 'another-product' }] },
      hydrationBudgetMs: 0,
      resolveProductImage: async () => {
        hydrations += 1;
        return 'https://images.example/recovered-product.jpg';
      },
      judge: async () => validJudgment,
    });

    expect(hydrations).toBe(0);
    expect(result.judgments.map((judgment) => judgment.reasons)).toEqual([
      ['product image unavailable'],
      ['product image unavailable'],
    ]);
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

  it('leaves a provider response with more than four reasons unresolved', async () => {
    const result = await runAuthoring({
      receipt: receipt(),
      queue,
      judge: async () => ({ ...validJudgment, reasons: ['one', 'two', 'three', 'four', 'five'] }),
    });

    expect(result.judgments[0]).toMatchObject({ score: null, tier: 'unresolved', kind: null });
    expect(result.judgments[0].reasons).toEqual(['invalid judgment response']);
  });

  it('leaves a provider response with an overlong reason unresolved', async () => {
    const result = await runAuthoring({
      receipt: receipt(),
      queue,
      judge: async () => ({ ...validJudgment, reasons: ['x'.repeat(241)] }),
    });

    expect(result.judgments[0]).toMatchObject({ score: null, tier: 'unresolved', kind: null });
    expect(result.judgments[0].reasons).toEqual(['invalid judgment response']);
  });

  it('retries a transient judgment failure before recording the pair unresolved', async () => {
    let attempts = 0;
    const result = await runAuthoring({
      receipt: receipt(),
      queue,
      judge: async () => {
        attempts += 1;
        if (attempts < 3) throw new Error('anthropic vision request failed (429)');
        return validJudgment;
      },
      sleep: async () => {},
    });

    expect(attempts).toBe(3);
    expect(result.judgments[0]).toMatchObject({ score: 92, tier: 'exact', kind: 'dress' });
  });

  it('records the permanent vision HTTP status as unresolved evidence without retrying', async () => {
    let attempts = 0;
    const result = await runAuthoring({
      receipt: receipt(),
      queue,
      judge: async () => {
        attempts += 1;
        throw new Error('anthropic vision request failed (401)');
      },
      sleep: async () => {},
    });

    expect(attempts).toBe(1);
    expect(result.run.reservedCostUsd).toBeCloseTo(RESERVATION_PER_REQUEST_USD, 8);
    expect(result.run.stopReason).toBeNull();
    expect(result.judgments[0].reasons).toEqual(['vision request failed (HTTP 401)']);
  });

  it('records the real network error detail instead of a generic string after exhausting retries', async () => {
    let attempts = 0;
    const result = await runAuthoring({
      receipt: receipt(),
      queue,
      judge: async () => {
        attempts += 1;
        throw new Error('fetch failed: ECONNRESET');
      },
      sleep: async () => {},
    });

    expect(attempts).toBe(3);
    expect(result.judgments[0].reasons).toEqual([
      'vision request failed (fetch failed: ECONNRESET)',
    ]);
  });

  it('truncates an overlong network error detail so the reason stays bounded', async () => {
    const longMessage = `fetch failed: ${'x'.repeat(300)}`;
    const result = await runAuthoring({
      receipt: receipt(),
      queue,
      judge: async () => {
        throw new Error(longMessage);
      },
      sleep: async () => {},
    });

    const reason = result.judgments[0].reasons[0] as string;
    expect(reason.startsWith('vision request failed (fetch failed: ')).toBe(true);
    expect(reason.length).toBeLessThan(longMessage.length);
    expect(reason.endsWith('…)')).toBe(true);
  });

  it('reserves each retry attempt before dispatching it', async () => {
    let attempts = 0;
    const result = await runAuthoring({
      receipt: receipt(),
      queue,
      capUsd: RESERVATION_PER_REQUEST_USD * 2,
      judge: async () => {
        attempts += 1;
        throw new Error('anthropic vision request failed (429)');
      },
      sleep: async () => {},
    });

    expect(attempts).toBe(1);
    expect(result.run.reservedCostUsd).toBeCloseTo(RESERVATION_PER_REQUEST_USD, 8);
    expect(result.run.stopReason).toBe(CAP_STOP_REASON);
    expect(result.judgments[0].reasons).toEqual(['not judged before run cap']);
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

  it('demotes a freshly judged mismatch and carries forward detector-provided demotions', async () => {
    const detectorDemotion = {
      productId: 'already-demoted',
      url: 'https://shop.example/other-dress',
      reason: 'vision-audited-mismatch',
      auditorReasons: ['prior run reasons'],
    };
    const result = await runAuthoring({
      receipt: receipt(),
      queue: { ...queue, demotions: [detectorDemotion] },
      judge: async () => ({ score: 10, kind: 'dress', reasons: ['wrong color entirely'] }),
    });

    expect(result.judgments[0]).toMatchObject({ score: 10, tier: 'mismatch' });
    expect(result.demotions).toEqual([
      detectorDemotion,
      {
        productId: source.productId,
        url: source.productUrl,
        reason: 'vision-audited-mismatch',
        auditorReasons: ['wrong color entirely'],
      },
    ]);
    expect(result.summary.demoted).toBe(2);
  });

  it('records a real url on a fresh mismatch even for an already-image-backed pair (#3447 P2 regression)', async () => {
    // detectAuditQueue() carries productUrl through on every queued entry,
    // including the normal cacheKey-eligible path (a pair that already has
    // productImageUrl and so never needed productUrl for og:image
    // discovery). Without that, apply-demotions.mjs has no url to act on
    // and the demotion never actually gets removed from content.
    const imageBackedPair = { ...source, cacheKey: 'pair-image-backed' };
    const result = await runAuthoring({
      receipt: receipt([]),
      queue: { queue: [imageBackedPair] },
      judge: async () => ({ score: 5, kind: 'dress', reasons: ['completely different garment'] }),
    });

    expect(result.demotions).toEqual([{
      productId: source.productId,
      url: source.productUrl,
      reason: 'vision-audited-mismatch',
      auditorReasons: ['completely different garment'],
    }]);
    expect(result.demotions[0].url).not.toBeNull();
  });

  it('requires an API key for an eligible pair introduced by the detector queue', () => {
    expect(requiresApiKey(receipt([]), queue)).toBe(true);
    expect(
      requiresApiKey(receipt([]), {
        queue: [{ ...source, productImageUrl: null, cacheKey: null }],
      }),
    ).toBe(true);
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
      fetchImpl: async (url: string, init: RequestInit) => {
        if (url === source.productImageUrl || url === source.momentImageUrl) {
          return new Response(Uint8Array.from([137, 80, 78, 71]), {
            headers: { 'content-type': 'image/png' },
          });
        }
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

  it('encodes supported source images before sending a Claude judgment request', async () => {
    let request: Request | undefined;
    const imageBytes = Uint8Array.from([137, 80, 78, 71]);
    const calls: string[] = [];
    const response = await judgePairWithClaude(source, {
      apiKey: 'test-key',
      fetchImpl: async (url: string, init: RequestInit) => {
        calls.push(url);
        if (url === source.productImageUrl || url === source.momentImageUrl) {
          expect(init).toMatchObject({ method: 'GET', redirect: 'follow' });
          return new Response(imageBytes, { headers: { 'content-type': 'image/png' } });
        }
        request = new Request('https://api.anthropic.com/v1/messages', init);
        return new Response(
          JSON.stringify({
            content: [{ type: 'tool_use', name: 'record_match_judgment', input: validJudgment }],
          }),
          { status: 200 },
        );
      },
    });

    const payload = (await request?.json()) as {
      messages: Array<{ content: Array<{ source?: Record<string, string> }> }>;
    };
    expect(calls).toEqual([
      source.productImageUrl,
      source.momentImageUrl,
      'https://api.anthropic.com/v1/messages',
    ]);
    expect(payload.messages[0].content.slice(0, 2)).toEqual([
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: 'iVBORw==',
        },
      },
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: 'iVBORw==',
        },
      },
    ]);
    expect(response).toEqual(validJudgment);
  });

  it('preserves an unsupported image as unresolved evidence without submitting a provider request', async () => {
    let providerRequests = 0;
    const result = await runAuthoring({
      receipt: receipt(),
      queue,
      judge: (pair: Record<string, unknown>) =>
        judgePairWithClaude(pair, {
          apiKey: 'test-key',
          fetchImpl: async (url: string) => {
            if (url === source.productImageUrl) {
              return new Response(Uint8Array.from([0]), {
                headers: { 'content-type': 'image/heic' },
              });
            }
            if (url === source.momentImageUrl) {
              return new Response(Uint8Array.from([137, 80, 78, 71]), {
                headers: { 'content-type': 'image/png' },
              });
            }
            providerRequests += 1;
            return new Response(JSON.stringify({ content: [] }), { status: 200 });
          },
        }),
    });

    expect(providerRequests).toBe(0);
    expect(result.judgments[0].reasons).toEqual(['image source unsupported']);
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

  it('builds a re-source ticket body naming each demoted product and its auditor reasons', () => {
    const content = reSourceIssueContent({
      demotions: [
        {
          productId: 'dress-1',
          url: 'https://shop.example/dress-1',
          reason: 'vision-audited-mismatch',
          auditorReasons: ['wrong silhouette', 'wrong color'],
        },
      ],
    });

    expect(content?.title).toBe('E3 vision judgment: products demoted below match-tier floor');
    expect(content?.body).toContain('dress-1');
    expect(content?.body).toContain('https://shop.example/dress-1');
    expect(content?.body).toContain('wrong silhouette');
    expect(content?.body).toContain('wrong color');
  });

  it('returns null when there are no demotions to report', () => {
    expect(reSourceIssueContent({ demotions: [] })).toBeNull();
    expect(reSourceIssueContent({})).toBeNull();
  });
});
