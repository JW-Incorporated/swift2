import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { recordStorySources } from './story-source-store';

describe('recordStorySources', () => {
  it('collapses duplicate conflict keys from different hosts and keeps the best tier', async () => {
    const rawItems = [
      {
        id: 'raw-fan',
        external_id: 'fan-article',
        url: 'https://first-blog.tumblr.com/post/fan-article',
        title: 'Fan article',
        snippet: '',
        author: null,
        publisher: 'Tumblr — #taylorswift',
        publisher_url: 'https://first-blog.tumblr.com',
        resolved_tier: 'fan',
        news_source: { name: 'Tumblr', tier: 'fan' },
      },
      {
        id: 'raw-established',
        external_id: 'established-article',
        url: 'https://second-blog.tumblr.com/post/established-article',
        title: 'Established article',
        snippet: '',
        author: null,
        publisher: 'Tumblr — #taylorswift',
        publisher_url: 'https://second-blog.tumblr.com',
        resolved_tier: 'established',
        news_source: { name: 'Tumblr', tier: 'fan' },
      },
    ];
    let upsertRows: Record<string, unknown>[] = [];
    const db = {
      from(table: string) {
        if (table === 'news_raw_item') {
          return {
            select() {
              return { in: async () => ({ data: rawItems, error: null }) };
            },
          };
        }
        return {
          select() {
            return { in: async () => ({ data: [], error: null }) };
          },
          upsert: async (rows: Record<string, unknown>[]) => {
            upsertRows = rows;
            return { error: null };
          },
        };
      },
    } as unknown as SupabaseClient;
    const errors: string[] = [];

    await recordStorySources(
      db,
      rawItems.map((rawItem) => ({ storyId: 'story-1', rawItem })),
      errors,
    );

    const conflictKeys = upsertRows.map((row) => `${row.story_id}::${row.outlet_name}`);
    expect(errors).toEqual([]);
    expect(new Set(conflictKeys).size).toBe(conflictKeys.length);
    expect(upsertRows).toEqual([
      expect.objectContaining({
        raw_item_id: 'raw-established',
        outlet_name: 'Tumblr — #taylorswift',
        tier: 'established',
        url: 'https://second-blog.tumblr.com/post/established-article',
      }),
    ]);
  });
});
