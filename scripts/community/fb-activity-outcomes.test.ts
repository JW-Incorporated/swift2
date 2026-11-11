import { describe, expect, it, vi } from 'vitest';
import { ingestFacebookActivity } from './fb-activity-outcomes.mjs';

describe('Facebook owner activity outcomes', () => {
  it('writes a community_outcome matched through the lead permalink, with no member text', async () => {
    const written: unknown[] = [];
    const from = vi.fn((table: string) => {
      if (table === 'community_outcome')
        return { upsert: (rows: unknown[]) => (written.push(...rows), Promise.resolve({ error: null })) };
      const rows = table === 'engagement_lead'
        ? [{ id: 'lead-1', url: 'https://www.facebook.com/groups/101/posts/1001/' }]
        : [{ id: 'ledger-1', lead_id: 'lead-1', comment_url: null, posted_at: '2026-10-14T19:00:00Z' }];
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: () => chain,
        in: () => Promise.resolve({ data: rows, error: null }),
      };
      return chain;
    });
    const fixture = [{
      postPermalink: 'https://www.facebook.com/groups/101/posts/1001/',
      commentUrl: 'https://www.facebook.com/groups/101/posts/1001/?comment_id=900',
      commentId: '900', reactionCount: 8, replyCount: 3,
      commentedAt: '2026-10-14T19:00:00Z',
    }];
    const result = await ingestFacebookActivity({ from }, fixture, {
      checkedAt: new Date('2026-10-14T20:00:00Z'),
    });
    expect(result.written).toBeGreaterThanOrEqual(1);
    expect(written[0]).toEqual({
      post_ledger_id: 'ledger-1', platform: 'facebook',
      comment_url: fixture[0].commentUrl, comment_id: '900', score: 8, replies: 3,
      horizon: '1h', checked_at: '2026-10-14T20:00:00.000Z',
    });
    expect(JSON.stringify(written)).not.toMatch(/member|comment body|display name/i);
  });
});
