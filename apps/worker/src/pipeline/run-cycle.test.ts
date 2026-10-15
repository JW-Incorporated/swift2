// Regression test for #3746: news-worker.yml failed on every scheduled run
// because the cluster/verify stages used `.upsert()` on rows whose id always
// already existed. Supabase's upsert issues `INSERT ... ON CONFLICT DO
// UPDATE`, and Postgres validates the INSERT branch's NOT NULL columns even
// though the row always resolves to the UPDATE branch — so a partial-column
// upsert on news_raw_item (missing source_id) or news_story (missing
// canonical_title) always threw, even for rows that already had those
// columns populated. This test fakes a Supabase client that raises that
// exact error on `.upsert()` and asserts `runCycle` uses `.update()` (whose
// payload never triggers NOT NULL insert validation) instead.

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { recordFirstPublicAt, runCycle } from './run-cycle';

/** Mimics Postgres rejecting a partial-column upsert with a NOT NULL violation. */
function notNullViolation(column: string, relation: string) {
  return { message: `null value in column "${column}" of relation "${relation}" violates not-null constraint` };
}

function chain(result: { data?: unknown; error?: unknown } = { data: null, error: null }) {
  const query: Record<string, unknown> = {
    then: (resolve: (value: typeof result) => void) => resolve(result),
  };
  for (const method of ['eq', 'is', 'not', 'gte', 'in', 'limit', 'select', 'order'])
    query[method] = () => query;
  return query;
}

describe('runCycle cluster/verify stages (#3746 regression)', () => {
  it('attaches raw items to stories via update, not upsert (would 500 on NOT NULL if upsert)', async () => {
    const updateCalls: { table: string; payload: unknown; id: unknown }[] = [];
    const upsertCalls: string[] = [];

    const db = {
      from: vi.fn((table: string) => {
        if (table === 'news_source') return chain({ data: [], error: null });
        if (table === 'news_raw_item') {
          return {
            select: () =>
              chain({
                data: [
                  { id: 'raw-1', title: 'Story A', url: 'https://a.example/1', snippet: '', image_url: null, published_at: null },
                ],
                error: null,
              }),
            update: (payload: unknown) => {
              const eqChain = {
                eq: (_col: string, id: unknown) => {
                  updateCalls.push({ table, payload, id });
                  return Promise.resolve({ error: null });
                },
              };
              return eqChain;
            },
            upsert: () => {
              upsertCalls.push(table);
              return Promise.resolve({ error: notNullViolation('source_id', 'news_raw_item') });
            },
          };
        }
        if (table === 'news_story') {
          return {
            select: () => chain({ data: [], error: null }),
            insert: () => ({
              select: () => Promise.resolve({ data: [{ id: 'story-1' }], error: null }),
            }),
            update: (payload: unknown) => {
              const eqChain = {
                eq: (_col: string, id: unknown) => {
                  updateCalls.push({ table, payload, id });
                  return Promise.resolve({ error: null });
                },
              };
              return eqChain;
            },
            upsert: () => {
              upsertCalls.push(table);
              return Promise.resolve({ error: notNullViolation('canonical_title', 'news_story') });
            },
          };
        }
        if (table === 'news_story_source') return chain({ data: [], error: null });
        throw new Error(`unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient;

    const result = await runCycle(db);

    // The bug: if either stage still used .upsert(), it would hit our fake
    // NOT NULL violation and show up in `errors`.
    expect(upsertCalls).toEqual([]);
    expect(result.errors.filter((e) => e.includes('not-null constraint'))).toEqual([]);

    // Positive assertion: the attach stage updated news_raw_item.story_id,
    // and the verify stage updated news_story.verification_status — both via
    // .update(), proving the fix path actually ran end to end.
    const attachUpdate = updateCalls.find((c) => c.table === 'news_raw_item');
    expect(attachUpdate).toBeDefined();
    expect(attachUpdate?.payload).toMatchObject({ story_id: 'story-1' });

    const verifyUpdate = updateCalls.find((c) => c.table === 'news_story');
    expect(verifyUpdate).toBeDefined();
    expect(verifyUpdate?.id).toBe('story-1');
    expect(verifyUpdate?.payload).toMatchObject({ source_count: expect.any(Number) });
  });
});

describe('primary fast cycle', () => {
  it('polls only primary rows and stops before classification/extraction', async () => {
    const fetched: string[] = [];
    const sources = [
      { id: 'primary', name: 'Official feed', source_type: 'rss', config: { primary: true } },
      { id: 'normal', name: 'Normal feed', source_type: 'rss', config: {} },
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
          return { select: () => chain({ data: [], error: null }) };
        }
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
      [
        'normal::article-1',
        {
          source_id: 'normal',
          external_id: 'article-1',
          url: 'https://publisher.example/resolved-story',
        },
      ],
    ]);
    const sources = [
      {
        id: 'normal',
        name: 'Google News — "Taylor Swift" search',
        source_type: 'google_news',
        config: {},
      },
      {
        id: 'fast',
        name: 'Google News — "Taylor Swift" fast lane',
        source_type: 'google_news',
        config: { primary: true },
      },
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
        fetch: async () => [
          {
            externalId: 'article-1',
            url: 'https://news.google.com/rss/articles/opaque',
            title: 'Taylor Swift announces a project',
          },
        ],
      }),
    });

    expect(stored.get('normal::article-1')?.url).toBe(
      'https://publisher.example/resolved-story',
    );
    expect(stored.get('fast::article-1')?.url).toBe(
      'https://news.google.com/rss/articles/opaque',
    );
  });

  it('records each story\'s earliest item timestamp without moving it later', async () => {
    const upserts: unknown[] = [];
    const db = {
      from: vi.fn((table: string) => {
        expect(table).toBe('story_timeline');
        return {
          select: () =>
            chain({
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

    await recordFirstPublicAt(
      db,
      [
        { storyId: 'story-a', publishedAt: '2026-10-03T00:00:00Z' },
        { storyId: 'story-a', publishedAt: '2026-10-01T00:00:00Z' },
        { storyId: 'story-b', publishedAt: '2026-10-04T12:30:00-07:00' },
        { storyId: 'story-b', publishedAt: 'not-a-date' },
      ],
      errors,
    );

    expect(errors).toEqual([]);
    expect(upserts).toEqual([
      [
        { story_id: 'story-a', first_public_at: '2026-10-01T00:00:00.000Z' },
        { story_id: 'story-b', first_public_at: '2026-10-04T19:30:00.000Z' },
      ],
    ]);
  });
});
