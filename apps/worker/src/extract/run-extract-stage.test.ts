import type { SupabaseClient } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  abandonQuietTheories: vi.fn(),
  createUsage: vi.fn(),
  extractWithLLM: vi.fn(),
  fetchPostComments: vi.fn(),
  refreshSymbolActivity: vi.fn(),
  supabaseExtractUsageDb: vi.fn(),
}));

vi.mock('./haiku-client', () => ({ extractWithLLM: mocks.extractWithLLM }));
vi.mock('../sources/reddit-rss', () => ({ fetchPostComments: mocks.fetchPostComments }));
vi.mock('./usage-store', () => ({
  ExtractUsageStore: { create: mocks.createUsage },
  supabaseExtractUsageDb: mocks.supabaseExtractUsageDb,
}));
vi.mock('./write-knowledge', () => ({
  abandonQuietTheories: mocks.abandonQuietTheories,
  projectKnowledgeDoc: vi.fn(),
  refreshSymbolActivity: mocks.refreshSymbolActivity,
  theoryPassesScreen: vi.fn(),
  upsertLiveTheory: vi.fn(),
  writeCurrentItem: vi.fn(),
  writeFanSignal: vi.fn(),
}));

import { runExtractStage } from './run-extract-stage';

function chain(result: { data?: unknown; error?: unknown }) {
  const query: Record<string, unknown> = {
    then: (resolve: (value: typeof result) => void) => resolve(result),
  };
  for (const method of ['eq', 'is', 'limit', 'not', 'select', 'update'])
    query[method] = () => query;
  return query;
}

function fakeDb(rawItems: unknown[]): SupabaseClient {
  let newsStoryCalls = 0;
  return {
    from: vi.fn((table: string) => {
      if (table === 'symbol_lexicon') return chain({ data: [], error: null });
      if (table === 'news_story') {
        newsStoryCalls++;
        return newsStoryCalls === 1
          ? chain({
              data: [{ id: 'story-1', canonical_title: 'Grammy Museum performance', summary: '' }],
              error: null,
            })
          : chain({ error: null });
      }
      if (table === 'news_raw_item') return chain({ data: rawItems, error: null });
      if (table === 'news_story_source') return chain({ data: [], error: null });
      throw new Error(`unexpected table ${table}`);
    }),
  } as unknown as SupabaseClient;
}

describe('runExtractStage Reddit comment context', () => {
  beforeEach(() => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    mocks.abandonQuietTheories.mockReset().mockResolvedValue(0);
    mocks.createUsage.mockReset().mockResolvedValue({});
    mocks.extractWithLLM.mockReset().mockResolvedValue({ kind: 'skip', redlineFlags: [] });
    mocks.fetchPostComments.mockReset();
    mocks.refreshSymbolActivity.mockReset().mockResolvedValue(undefined);
    mocks.supabaseExtractUsageDb.mockReset().mockReturnValue({});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('fetches only clustered reddit_rss posts and passes their real-shaped comment bodies without identity', async () => {
    const redditUrl =
      'https://www.reddit.com/r/TaylorSwift/comments/1vxjjby/taylor_swift_performance_the_icon_sessions_at_the/';
    mocks.fetchPostComments.mockResolvedValue([
      {
        id: 't1_p5ptlr3',
        author: 'b0af4d52a778f4ed',
        body: 'WAKE THE FCK UP ITS SURPRISE SONG OCLOCK',
        publishedAt: '2026-08-25T01:21:40+00:00',
      },
      {
        id: 't1_p5pe6rz',
        author: '813226c98e87fcae',
        body: 'i miss The Eras Tour piano so much! the idea of mashing up I Knew It, I Knew You x august x All Too Well is genius.',
        publishedAt: '2026-08-24T23:57:52+00:00',
      },
    ]);
    const db = fakeDb([
      {
        title: 'Taylor Swift Performance - The Icon Sessions at the Grammy Museum.',
        snippet: '',
        url: redditUrl,
        news_source: { source_type: 'reddit_rss' },
      },
      {
        title: 'An outlet also covered the performance',
        snippet: 'A short report.',
        url: 'https://example.com/report',
        news_source: { source_type: 'rss' },
      },
    ]);

    const result = await runExtractStage(db);

    expect(mocks.fetchPostComments).toHaveBeenCalledOnce();
    expect(mocks.fetchPostComments).toHaveBeenCalledWith(redditUrl);
    const input = mocks.extractWithLLM.mock.calls[0]?.[1];
    expect(input.commentThreads).toEqual([
      {
        postTitle: 'Taylor Swift Performance - The Icon Sessions at the Grammy Museum.',
        comments: [
          'WAKE THE FCK UP ITS SURPRISE SONG OCLOCK',
          'i miss The Eras Tour piano so much! the idea of mashing up I Knew It, I Knew You x august x All Too Well is genius.',
        ],
      },
    ]);
    expect(JSON.stringify(input)).not.toContain('b0af4d52a778f4ed');
    expect(result.errors).toEqual([]);
  });

  it('continues extraction without comment context when Reddit enrichment throws', async () => {
    mocks.fetchPostComments.mockRejectedValue(new Error('invalid Atom'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const db = fakeDb([
      {
        title: 'A clustered Reddit post',
        snippet: '',
        url: 'https://www.reddit.com/r/TaylorSwift/comments/example/post/',
        news_source: { source_type: 'reddit_rss' },
      },
    ]);

    const result = await runExtractStage(db);

    expect(mocks.extractWithLLM).toHaveBeenCalledOnce();
    expect(mocks.extractWithLLM.mock.calls[0]?.[1]).not.toHaveProperty('commentThreads');
    expect(result.errors).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('comment context unavailable'));
  });

  it('does not request transient comments when the extract model is unavailable', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const db = fakeDb([
      {
        title: 'A clustered Reddit post',
        snippet: '',
        url: 'https://www.reddit.com/r/TaylorSwift/comments/example/post/',
        news_source: { source_type: 'reddit_rss' },
      },
    ]);

    await runExtractStage(db);

    expect(mocks.fetchPostComments).not.toHaveBeenCalled();
    expect(mocks.extractWithLLM.mock.calls[0]?.[1]).not.toHaveProperty('commentThreads');
  });
});
