import { describe, expect, it, vi } from 'vitest';
import { loadStoredStory, markStoryVerified } from './factcheck-store.mjs';

function database() {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  return {
    upsert,
    from(table: string) {
      if (table === 'news_story') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: 'story-1', canonical_title: 'Fixture claim' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'news_story_source') {
        return {
          select: () => ({
            eq: async () => ({
              data: [{
                id: 'source-1',
                story_id: 'story-1',
                raw_item_id: 'raw-1',
                outlet_name: 'BBC News',
                url: 'https://www.bbc.com/news/fixture',
                tier: 'established',
              }],
              error: null,
            }),
          }),
        };
      }
      if (table === 'news_raw_item') {
        return {
          select: () => ({
            in: async () => ({
              data: [{
                id: 'raw-1',
                external_id: 'external-1',
                url: 'https://www.bbc.com/news/fixture',
                title: 'BBC confirms Fixture claim',
                snippet: 'A public fixture summary.',
                author: 'Fixture Reporter',
                publisher: 'BBC News',
                publisher_url: 'https://www.bbc.com',
                resolved_tier: 'established',
                news_source: { name: 'BBC News', tier: 'established', source_type: 'rss' },
              }],
              error: null,
            }),
          }),
        };
      }
      if (table === 'story_timeline') return { upsert };
      throw new Error(`unexpected table ${table}`);
    },
  };
}

describe('fact-check store adapter', () => {
  it('collects story sources with headline and dek anchors', async () => {
    const db = database();
    const result = await loadStoredStory(db, 'story-1', 'critical_breaking');
    expect(result).toMatchObject({
      storyId: 'story-1',
      claim: 'Fixture claim',
      classification: 'critical_breaking',
      sources: [{
        headline: 'BBC confirms Fixture claim',
        dek: 'A public fixture summary.',
        outletName: 'BBC News',
      }],
    });
  });

  it('upserts only the verification timestamp into story_timeline', async () => {
    const db = database();
    await markStoryVerified(db, 'story-1', '2026-10-15T00:00:00.000Z');
    expect(db.upsert).toHaveBeenCalledWith(
      { story_id: 'story-1', verified_at: '2026-10-15T00:00:00.000Z' },
      { onConflict: 'story_id' },
    );
  });
});
