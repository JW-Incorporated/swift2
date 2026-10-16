import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  backfillOneItem,
  type BackfillCandidateRow,
} from './backfill';
import { ExtractUsageStore, type UsageDb } from './usage-store';

const mocks = vi.hoisted(() => ({ callWorkerClaude: vi.fn() }));
vi.mock('../claude-call', () => ({
  callWorkerClaude: mocks.callWorkerClaude,
  hasClaudeSubscriptionToken: () => Boolean(process.env.CLAUDE_CODE_OAUTH_TOKEN),
}));

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
  return { status: 'ok', data: input };
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

const ORIGINAL_KEY = process.env.CLAUDE_CODE_OAUTH_TOKEN;

afterEach(() => {
  process.env.CLAUDE_CODE_OAUTH_TOKEN = ORIGINAL_KEY;
  mocks.callWorkerClaude.mockReset();
  vi.unstubAllGlobals();
});

describe('backfillOneItem', () => {
  it('resolves a missing image from the best source og:image', async () => {
    delete process.env.CLAUDE_CODE_OAUTH_TOKEN;
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(htmlResponse('<meta property="og:image" content="https://www.billboard.com/og.jpg">'));
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const { report } = await backfillOneItem(baseItem(), usage, '2026-10-13', fetchImpl as unknown as typeof fetch);
    expect(report.imageBefore).toBe(false);
    expect(report.imageAfter).toBe(true);
    process.env.CLAUDE_CODE_OAUTH_TOKEN = ORIGINAL_KEY;
  });

  it('leaves an already-allowlisted image untouched, with no image-resolution network call', async () => {
    delete process.env.CLAUDE_CODE_OAUTH_TOKEN;
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
    process.env.CLAUDE_CODE_OAUTH_TOKEN = ORIGINAL_KEY;
  });

  it('rewrites thin copy via the shared Haiku extract call, grounded in fetched article text', async () => {
    process.env.CLAUDE_CODE_OAUTH_TOKEN = 'test-token';
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
    mocks.callWorkerClaude.mockImplementation(anthropicFetch);

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
    process.env.CLAUDE_CODE_OAUTH_TOKEN = ORIGINAL_KEY;
  });

  it('defers (never errors) a thin item when the subscription token is unset', async () => {
    delete process.env.CLAUDE_CODE_OAUTH_TOKEN;
    const fetchImpl = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const { report, update } = await backfillOneItem(baseItem(), usage, '2026-10-13', fetchImpl as unknown as typeof fetch);
    expect(report.deferred).toBe(true);
    expect(report.rewroteCopy).toBe(false);
    // Original thin copy is preserved, not invented, when deferred.
    expect(update.summary).toBe('Taylor was seen.');
    process.env.CLAUDE_CODE_OAUTH_TOKEN = ORIGINAL_KEY;
  });

  it('skips the Haiku call entirely when copy already clears the floors (idempotent on a good row)', async () => {
    process.env.CLAUDE_CODE_OAUTH_TOKEN = 'test-token';
    const anthropicFetch = vi.fn();
    mocks.callWorkerClaude.mockImplementation(anthropicFetch);
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
    process.env.CLAUDE_CODE_OAUTH_TOKEN = ORIGINAL_KEY;
  });

  it('final verdict stays HOLD when no image can be resolved, even after a copy rewrite', async () => {
    process.env.CLAUDE_CODE_OAUTH_TOKEN = 'test-token';
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
    mocks.callWorkerClaude.mockImplementation(anthropicFetch);
    const fetchImpl = vi.fn().mockResolvedValue(new Response('', { status: 404 })); // no image resolvable
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const item = baseItem({ sources: [] }); // no sources -> no fallback image
    const { report } = await backfillOneItem(item, usage, '2026-10-13', fetchImpl as unknown as typeof fetch);
    expect(report.imageAfter).toBe(false);
    expect(report.finalOk).toBe(false);
    expect(report.holdReason).toBe('missing_image');
    vi.unstubAllGlobals();
    process.env.CLAUDE_CODE_OAUTH_TOKEN = ORIGINAL_KEY;
  });
});
