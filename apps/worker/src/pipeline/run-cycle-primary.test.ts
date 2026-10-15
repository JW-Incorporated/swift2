import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { recordFirstPublicAt, runCycle } from './run-cycle';

function chain(result: { data?: unknown; error?: unknown } = { data: null, error: null }) {
  const query: Record<string, unknown> = {
    then: (resolve: (value: typeof result) => void) => resolve(result),
  };
  for (const method of ['eq', 'is', 'not', 'gte', 'in', 'limit', 'select', 'order']) {
    query[method] = () => query;
  }
  return query;
}

describe('primary fast cycle', () => {
  it("never polls the migration's enabled primary-only fast-lane row in the normal cycle", async () => {
    const fetched: string[] = [];
    const sources = [
      { id: 'youtube', name: 'YouTube', source_type: 'rss', config: { primary: true }, is_enabled: true },
      { id: 'site', name: 'Site', source_type: 'site_diff', config: { primary: true }, is_enabled: true },
      { id: 'store', name: 'Store', source_type: 'site_diff', config: { primary: true }, is_enabled: true },
      {
        id: 'fast',
        name: 'Fast Google News',
        source_type: 'google_news',
        config: { primary: true, primaryOnly: true, newestFirst: true },
        is_enabled: true,
      },
      { id: 'republic', name: 'Republic', source_type: 'rss', config: { primary: true }, is_enabled: true },
      { id: 'umg', name: 'UMG', source_type: 'rss', config: { primary: true }, is_enabled: true },
    ];
    const sourceQuery = chain({ data: sources, error: null });
    sourceQuery.eq = (column: string, value: unknown) =>
      chain({
        data: sources.filter((source) => source[column as 'is_enabled'] === value),
        error: null,
      });
    const db = {
      from: vi.fn((table: string) => {
        if (table === 'news_source') {
          return {
            select: () => sourceQuery,
            update: () => ({ eq: () => Promise.resolve({ error: null }) }),
          };
        }
        if (table === 'news_raw_item' || table === 'news_story') {
          return { select: () => chain({ data: [], error: null }) };
        }
        throw new Error(`normal mode reached unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient;

    await runCycle(db, {
      adapterFor: () => ({
        fetch: async (source) => {
          fetched.push(source.id);
          return [];
        },
      }),
    });

    expect(fetched).toEqual(['youtube', 'site', 'store', 'republic', 'umg']);
    expect(fetched).not.toContain('fast');
  });

  it('polls only primary rows and stops before classification/extraction', async () => {
    const fetched: string[] = [];
    const sources = [
      { id: 'primary', name: 'Official', source_type: 'rss', config: { primary: true }, is_enabled: false },
      { id: 'normal', name: 'Normal', source_type: 'rss', config: {}, is_enabled: true },
    ];
    const db = {
      from: vi.fn((table: string) => {
        if (table === 'news_source') {
          return {
            select: () => chain({ data: sources, error: null }),
            update: () => ({ eq: () => Promise.resolve({ error: null }) }),
          };
        }
        if (table === 'news_raw_item') return { select: () => chain({ data: [], error: null }) };
        throw new Error(`primary mode reached unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient;

    const result = await runCycle(db, {
      primary: true,
      adapterFor: () => ({
        fetch: async (source) => {
          fetched.push(source.id);
          return [];
        },
      }),
    });

    expect(fetched).toEqual(['primary']);
    expect(result.sourcesPolled).toBe(1);
    expect(result.storiesClassified).toBe(0);
    expect(result.extract.clustersConsidered).toBe(0);
  });

  it('stores a fast-lane Google News copy under its own source identity', async () => {
    const stored = new Map<string, { source_id: string; external_id: string; url: string }>([
      ['normal::article-1', {
        source_id: 'normal',
        external_id: 'article-1',
        url: 'https://publisher.example/resolved-story',
      }],
    ]);
    const sources = [
      { id: 'normal', name: 'Normal Google', source_type: 'google_news', config: {} },
      { id: 'fast', name: 'Fast Google', source_type: 'google_news', config: { primary: true } },
    ];
    const db = {
      from: vi.fn((table: string) => {
        if (table === 'news_source') {
          return {
            select: () => chain({ data: sources, error: null }),
            update: () => ({ eq: () => Promise.resolve({ error: null }) }),
          };
        }
        if (table === 'news_raw_item') {
          return {
            upsert: (rows: { source_id: string; external_id: string; url: string }[]) => {
              for (const row of rows) {
                const key = `${row.source_id}::${row.external_id}`;
                if (!stored.has(key)) stored.set(key, row);
              }
              return Promise.resolve({ error: null });
            },
            select: () => chain({ data: [], error: null }),
          };
        }
        throw new Error(`primary mode reached unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient;

    await runCycle(db, {
      primary: true,
      adapterFor: () => ({
        fetch: async () => [{
          externalId: 'article-1',
          url: 'https://news.google.com/rss/articles/opaque',
          title: 'Taylor Swift announces a project',
        }],
      }),
    });

    expect(stored.get('normal::article-1')?.url).toBe('https://publisher.example/resolved-story');
    expect(stored.get('fast::article-1')?.url).toBe('https://news.google.com/rss/articles/opaque');
  });

  it('records each story\'s earliest item timestamp without moving it later', async () => {
    const upserts: unknown[] = [];
    const db = {
      from: vi.fn((table: string) => {
        expect(table).toBe('story_timeline');
        return {
          select: () => chain({
            data: [{ story_id: 'story-a', first_public_at: '2026-10-02T00:00:00.000Z' }],
            error: null,
          }),
          upsert: (rows: unknown) => {
            upserts.push(rows);
            return Promise.resolve({ error: null });
          },
        };
      }),
    } as unknown as SupabaseClient;

    const errors: string[] = [];
    await recordFirstPublicAt(db, [
      { storyId: 'story-a', publishedAt: '2026-10-03T00:00:00Z' },
      { storyId: 'story-a', publishedAt: '2026-10-01T00:00:00Z' },
      { storyId: 'story-b', publishedAt: '2026-10-04T12:30:00-07:00' },
      { storyId: 'story-b', publishedAt: 'not-a-date' },
    ], errors);

    expect(errors).toEqual([]);
    expect(upserts).toEqual([[
      { story_id: 'story-a', first_public_at: '2026-10-01T00:00:00.000Z' },
      { story_id: 'story-b', first_public_at: '2026-10-04T19:30:00.000Z' },
    ]]);
  });
});
