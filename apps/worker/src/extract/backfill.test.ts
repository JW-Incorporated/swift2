import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  backfillOneItem,
  loadBackfillCandidates,
  runBackfill,
  type BackfillCandidateRow,
} from './backfill';
import { ExtractUsageStore, type UsageDb } from './usage-store';

function unlimitedUsageDb(): UsageDb {
  return {
    async todaysCallCount() {
      return 0;
    },
    async incrementToday() {},
  };
}

function htmlResponse(html: string): Response {
  return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

function toolUseResponse(input: unknown) {
  return {
    ok: true,
    json: async () => ({ content: [{ type: 'tool_use', name: 'record_knowledge', input }] }),
  };
}

const GOOD_SOURCES = [{ name: 'Billboard', url: 'https://www.billboard.com/x', tier: 'established' as const }];

function baseItem(overrides: Partial<BackfillCandidateRow> = {}): BackfillCandidateRow {
  return {
    id: 'item-1',
    headline: 'New single announced',
    summary: 'Taylor was seen.',
    detail: 'Short.',
    image_url: null,
    sources: GOOD_SOURCES,
    era_id: 'tloas',
    ...overrides,
  };
}

const ORIGINAL_KEY = process.env.ANTHROPIC_API_KEY;

afterEach(() => {
  process.env.ANTHROPIC_API_KEY = ORIGINAL_KEY;
  vi.unstubAllGlobals();
});

describe('backfillOneItem', () => {
  it('resolves a missing image from the best source og:image', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(htmlResponse('<meta property="og:image" content="https://www.billboard.com/og.jpg">'));
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const { report } = await backfillOneItem(baseItem(), usage, '2026-10-13', fetchImpl as unknown as typeof fetch);
    expect(report.imageBefore).toBe(false);
    expect(report.imageAfter).toBe(true);
    process.env.ANTHROPIC_API_KEY = ORIGINAL_KEY;
  });

  it('leaves an already-allowlisted image untouched, with no image-resolution network call', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const GOOD_SUMMARY =
      'Taylor announced a new single today during a surprise livestream watched by millions of fans. ' +
      'The reveal immediately set off speculation about which era the song belongs to.';
    const GOOD_DETAIL = Array(62).fill('word').join(' ');
    const fetchImpl = vi.fn();
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const item = baseItem({
      image_url: 'https://www.billboard.com/already.jpg',
      summary: GOOD_SUMMARY,
      detail: GOOD_DETAIL,
    });
    const { report, update } = await backfillOneItem(item, usage, '2026-10-13', fetchImpl as unknown as typeof fetch);
    expect(report.imageBefore).toBe(true);
    expect(report.imageAfter).toBe(true);
    expect(update.image_url).toBe('https://www.billboard.com/already.jpg');
    // Copy already clears the floors (good summary/detail), so the only
    // thing left to check is that resolveImageUrl short-circuits on an
    // already-allowlisted image without a network call.
    expect(fetchImpl).not.toHaveBeenCalled();
    process.env.ANTHROPIC_API_KEY = ORIGINAL_KEY;
  });

  it('rewrites thin copy via the shared Haiku extract call, grounded in fetched article text', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const GOOD_SUMMARY =
      'Taylor announced a new single today during a surprise livestream watched by millions of fans. ' +
      'The reveal immediately set off speculation about which era the song belongs to.';
    const GOOD_DETAIL = Array(62).fill('word').join(' ');
    const fetchImpl = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('billboard.com')) {
        return htmlResponse('<meta property="og:image" content="https://www.billboard.com/og.jpg">');
      }
      return new Response('', { status: 404 });
    });
    // fetchTopArticleTexts hits the same source url for text — stub fetch
    // to also return article HTML/text on that same call shape.
    const fetchImplCombined = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (String(url).includes('billboard.com') && init?.headers && (init.headers as Record<string, string>).Accept === 'text/html') {
        // Could be either the image-resolve OR article-text fetch — both
        // accept text/html; respond with a page containing both an
        // og:image meta tag and readable body text.
        return htmlResponse(
          '<html><head><meta property="og:image" content="https://www.billboard.com/og.jpg"></head>' +
            '<body><p>Taylor announced the new single during a surprise livestream event watched by millions of fans worldwide, fueling speculation about the next album.</p></body></html>',
        );
      }
      return new Response('', { status: 404 });
    });
    void fetchImpl;
    const anthropicFetch = vi.fn().mockResolvedValue(
      toolUseResponse({
        kind: 'current_item',
        redline_flags: [],
        current_item: {
          observed_on: '2026-10-13',
          category: 'release',
          headline: 'New single announced',
          summary: GOOD_SUMMARY,
          detail: GOOD_DETAIL,
          status_hint: 'reported',
          tags: [],
          symbols: [],
          entities: [],
        },
      }),
    );
    // Route fetch calls: billboard.com HTML fetches use fetchImplCombined,
    // the Anthropic API call uses the global fetch stub (haiku-client.ts
    // calls the bare `fetch`, not the injected fetchImpl).
    vi.stubGlobal('fetch', anthropicFetch);

    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const { report, update } = await backfillOneItem(
      baseItem(),
      usage,
      '2026-10-13',
      fetchImplCombined as unknown as typeof fetch,
    );

    expect(report.rewroteCopy).toBe(true);
    expect(report.deferred).toBe(false);
    expect(update.summary).toBe(GOOD_SUMMARY);
    expect(update.detail).toBe(GOOD_DETAIL);
    expect(report.summaryLenAfter).toBe(GOOD_SUMMARY.length);

    vi.unstubAllGlobals();
    process.env.ANTHROPIC_API_KEY = ORIGINAL_KEY;
  });

  it('defers (never errors) a thin item when ANTHROPIC_API_KEY is unset', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const fetchImpl = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const { report, update } = await backfillOneItem(baseItem(), usage, '2026-10-13', fetchImpl as unknown as typeof fetch);
    expect(report.deferred).toBe(true);
    expect(report.rewroteCopy).toBe(false);
    // Original thin copy is preserved, not invented, when deferred.
    expect(update.summary).toBe('Taylor was seen.');
    process.env.ANTHROPIC_API_KEY = ORIGINAL_KEY;
  });

  it('skips the Haiku call entirely when copy already clears the floors (idempotent on a good row)', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const anthropicFetch = vi.fn();
    vi.stubGlobal('fetch', anthropicFetch);
    const GOOD_SUMMARY =
      'Taylor announced a new single today during a surprise livestream watched by millions of fans. ' +
      'The reveal immediately set off speculation about which era the song belongs to.';
    const GOOD_DETAIL = Array(62).fill('word').join(' ');
    const fetchImpl = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const item = baseItem({
      summary: GOOD_SUMMARY,
      detail: GOOD_DETAIL,
      image_url: 'https://www.billboard.com/already.jpg',
    });
    const { report } = await backfillOneItem(item, usage, '2026-10-13', fetchImpl as unknown as typeof fetch);
    expect(report.rewroteCopy).toBe(false);
    expect(report.deferred).toBe(false);
    expect(anthropicFetch).not.toHaveBeenCalled();
    expect(report.finalOk).toBe(true);
    vi.unstubAllGlobals();
    process.env.ANTHROPIC_API_KEY = ORIGINAL_KEY;
  });

  it('final verdict stays HOLD when no image can be resolved, even after a copy rewrite', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const GOOD_SUMMARY =
      'Taylor announced a new single today during a surprise livestream watched by millions of fans. ' +
      'The reveal immediately set off speculation about which era the song belongs to.';
    const GOOD_DETAIL = Array(62).fill('word').join(' ');
    const anthropicFetch = vi.fn().mockResolvedValue(
      toolUseResponse({
        kind: 'current_item',
        redline_flags: [],
        current_item: {
          observed_on: '2026-10-13',
          category: 'release',
          headline: 'New single announced',
          summary: GOOD_SUMMARY,
          detail: GOOD_DETAIL,
          status_hint: 'reported',
          tags: [],
          symbols: [],
          entities: [],
        },
      }),
    );
    vi.stubGlobal('fetch', anthropicFetch);
    const fetchImpl = vi.fn().mockResolvedValue(new Response('', { status: 404 })); // no image resolvable
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const item = baseItem({ sources: [] }); // no sources -> no fallback image
    const { report } = await backfillOneItem(item, usage, '2026-10-13', fetchImpl as unknown as typeof fetch);
    expect(report.imageAfter).toBe(false);
    expect(report.finalOk).toBe(false);
    expect(report.holdReason).toBe('missing_image');
    vi.unstubAllGlobals();
    process.env.ANTHROPIC_API_KEY = ORIGINAL_KEY;
  });
});

describe('loadBackfillCandidates', () => {
  it('queries non-promoted, non-expired current_item rows', async () => {
    const calls: { method: string; args: unknown[] }[] = [];
    const chain: Record<string, unknown> = {
      then: (resolve: (r: { data: unknown; error: null }) => void) =>
        resolve({ data: [{ id: 'ci-1' }], error: null }),
    };
    for (const method of ['select', 'is', 'gt', 'order', 'limit']) {
      chain[method] = (...args: unknown[]) => {
        calls.push({ method, args });
        return chain;
      };
    }
    const db = { from: vi.fn(() => chain) } as unknown as Parameters<typeof loadBackfillCandidates>[0];
    const rows = await loadBackfillCandidates(db);
    expect(rows).toEqual([{ id: 'ci-1' }]);
    expect(calls.some((c) => c.method === 'is' && c.args[0] === 'promoted_to')).toBe(true);
  });
});

describe('runBackfill', () => {
  it('dry run never writes current_item, but still produces a full report', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const items = [baseItem({ id: 'a' }), baseItem({ id: 'b', image_url: 'https://www.billboard.com/ok.jpg' })];
    const updateSpy = vi.fn();
    const chain: Record<string, unknown> = {
      then: (resolve: (r: { data: unknown; error: null }) => void) => resolve({ data: items, error: null }),
    };
    for (const method of ['select', 'is', 'gt', 'order', 'limit']) chain[method] = () => chain;
    const updateChain = { eq: (...args: unknown[]) => (updateSpy(...args), Promise.resolve({ error: null })) };
    const db = {
      from: vi.fn(() => ({ ...chain, update: (row: unknown) => (updateSpy('update', row), updateChain) })),
      rpc: vi.fn(() => ({ then: (r: (v: { data: null; error: null }) => void) => r({ data: null, error: null }) })),
    } as unknown as Parameters<typeof runBackfill>[0];

    const fetchImpl = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
    const result = await runBackfill(db, { dryRun: true, fetchImpl: fetchImpl as unknown as typeof fetch });

    expect(result.considered).toBe(2);
    expect(result.wroteBack).toBe(0);
    expect(updateSpy).not.toHaveBeenCalled();
    expect(result.reports).toHaveLength(2);
    process.env.ANTHROPIC_API_KEY = ORIGINAL_KEY;
  });

  it('a live run writes back resolved/rewritten fields for every considered item', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const items = [baseItem({ id: 'a' })];
    const writes: unknown[] = [];
    const selectChain: Record<string, unknown> = {
      then: (resolve: (r: { data: unknown; error: null }) => void) => resolve({ data: items, error: null }),
    };
    for (const method of ['select', 'is', 'gt', 'order', 'limit']) selectChain[method] = () => selectChain;
    const db = {
      from: vi.fn(() => ({
        ...selectChain,
        update: (row: unknown) => ({
          eq: (..._args: unknown[]) => {
            writes.push(row);
            return Promise.resolve({ error: null });
          },
        }),
      })),
      rpc: vi.fn(() => ({ then: (r: (v: { data: null; error: null }) => void) => r({ data: null, error: null }) })),
    } as unknown as Parameters<typeof runBackfill>[0];

    const fetchImpl = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
    const result = await runBackfill(db, { dryRun: false, fetchImpl: fetchImpl as unknown as typeof fetch });

    expect(result.wroteBack).toBe(1);
    expect(writes).toHaveLength(1);
    process.env.ANTHROPIC_API_KEY = ORIGINAL_KEY;
  });
});
