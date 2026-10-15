import { describe, expect, it } from 'vitest';
import { mapLead, mapTheory } from './adapters/community.mjs';
import { mapMerch, mapMoment, mapReply, mapSocialPost } from './adapters/files.mjs';
import { mapIssue } from './adapters/issues.mjs';
import { mapNews } from './adapters/news.mjs';

const at = '2026-10-15T18:00:00.000Z';

describe('Tidewatch adapters', () => {
  it('maps clustered and unclustered news rows', () => {
    const rows = mapNews({
      stories: [{ id: 's1', canonical_title: 'Album news', summary: 'Confirmed.', first_seen_at: at }],
      rawItems: [
        { id: 'r1', source_id: 'src', external_id: 'e1', story_id: 's1', url: 'https://news.test/a', title: 'Album news', snippet: 'One.', created_at: at },
        { id: 'r2', source_id: 'src', external_id: 'e2', story_id: null, url: 'https://news.test/b', title: 'Fresh lead', snippet: 'Two.', created_at: at },
      ],
    });
    expect(rows.map((row) => row.item.item_key)).toEqual(['news:s1', 'news-raw:src:e2']);
    expect(rows[0].item.story_id).toBe('s1');
  });

  it('maps appearance and ordinary intake issues', () => {
    const appearance = mapIssue({ number: 12, title: 'intake: YouTube appearance — interview', body: '**Watch URL:** https://youtu.be/abc123XYZ', url: 'https://github.test/12', createdAt: at });
    const intake = mapIssue({ number: 13, title: 'intake: award', body: 'A lead', url: 'https://github.test/13', createdAt: at });
    expect(appearance.item).toMatchObject({ item_key: 'yt:abc123XYZ', source: 'youtube' });
    expect(intake.item).toMatchObject({ item_key: 'issue:13', source: 'intake' });
  });

  it('maps Reddit and Facebook leads without retaining Facebook text', () => {
    const reddit = mapLead({ id: 'l1', platform: 'reddit', community: 'TaylorSwift', kind: 'hot_thread', thread_id: 't3_a', url: 'https://reddit.test/a', title: 'Thread', context: 'Our summary', created_at: at });
    const facebook = mapLead({ id: 'l2', platform: 'facebook', community: 'Swift Group', kind: 'hot_thread', locator: 'Member name: verbatim text', title: 'Private member title', context: 'Verbatim quote', created_at: at });
    expect(reddit.item).toMatchObject({ item_key: 'lead:reddit:t3_a', excerpt: 'Our summary' });
    expect(facebook.item.item_key).toMatch(/^fb:swift-group:/);
    expect(facebook.item.excerpt).toBeNull();
  });

  it('maps theory candidates', () => {
    const row = mapTheory({ id: 't1', theory_key: 'orange-door', claim: 'The orange door signals a release.', evidence_summary: 'Fans connected two visuals.', sample_urls: ['https://reddit.test/t'], created_at: at });
    expect(row.item).toMatchObject({ item_key: 'theory:orange-door', source: 'theory' });
  });

  it('maps merch, social posts, replies, and merged moments', () => {
    expect(mapMerch({ sourceId: '99', item: 'Cardigan', brand: 'Official', retailer: 'store.test', url: 'https://store.test/P/1?utm_source=x' }, 'official', at).item.item_key).toBe('merch:official:https://store.test/p/1');
    expect(mapSocialPost({ platform: 'x', platformPostId: '42', body: 'Hello', postedAt: at, url: 'https://x.test/42' }, 'post.json').item.item_key).toBe('post:x:42');
    expect(mapReply(['ig-comment:77', at]).item.item_key).toBe('reply:instagram:77');
    expect(mapMoment({ slug: 'award-night', title: 'Award night', snippet: 'A moment.', sourceUrl: 'https://news.test/award' }, 'midnights', at).item.item_key).toBe('moment:award-night');
  });
});
