// Regression test for #3746: attaching and verifying existing rows must use
// UPDATE, because a partial UPSERT validates unrelated NOT NULL columns.

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { runCycle } from './run-cycle';

function notNullViolation(column: string, relation: string) {
  return {
    message: `null value in column "${column}" of relation "${relation}" violates not-null constraint`,
  };
}

function chain(result: { data?: unknown; error?: unknown } = { data: null, error: null }) {
  const query: Record<string, unknown> = {
    then: (resolve: (value: typeof result) => void) => resolve(result),
  };
  for (const method of ['eq', 'is', 'not', 'gte', 'in', 'limit', 'select', 'order']) {
    query[method] = () => query;
  }
  return query;
}

describe('runCycle cluster/verify stages (#3746 regression)', () => {
  it('attaches and verifies via update, not partial upsert', async () => {
    const updateCalls: { table: string; payload: unknown; id: unknown }[] = [];
    const upsertCalls: string[] = [];
    const db = {
      from: vi.fn((table: string) => {
        if (table === 'news_source') return chain({ data: [], error: null });
        if (table === 'news_raw_item') {
          return {
            select: () => chain({
              data: [{
                id: 'raw-1',
                title: 'Story A',
                url: 'https://a.example/1',
                snippet: '',
                image_url: null,
                published_at: null,
              }],
              error: null,
            }),
            update: (payload: unknown) => ({
              eq: (_column: string, id: unknown) => {
                updateCalls.push({ table, payload, id });
                return Promise.resolve({ error: null });
              },
            }),
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
            update: (payload: unknown) => ({
              eq: (_column: string, id: unknown) => {
                updateCalls.push({ table, payload, id });
                return Promise.resolve({ error: null });
              },
            }),
            upsert: () => {
              upsertCalls.push(table);
              return Promise.resolve({
                error: notNullViolation('canonical_title', 'news_story'),
              });
            },
          };
        }
        if (table === 'news_story_source') return chain({ data: [], error: null });
        throw new Error(`unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient;

    const result = await runCycle(db);

    expect(upsertCalls).toEqual([]);
    expect(result.errors.filter((error) => error.includes('not-null constraint'))).toEqual([]);
    expect(updateCalls.find((call) => call.table === 'news_raw_item')?.payload).toMatchObject({
      story_id: 'story-1',
    });
    const verifyUpdate = updateCalls.find((call) => call.table === 'news_story');
    expect(verifyUpdate?.id).toBe('story-1');
    expect(verifyUpdate?.payload).toMatchObject({ source_count: expect.any(Number) });
  });
});
