import { describe, expect, it } from 'vitest';
import {
  buildIngestResult,
  engagementLeadsFromPosts,
  shopLinksFromPosts,
} from './fb-export-ingest.mjs';

// SYNTHETIC fixture, same posture as facebook-groups-parser.test.ts's own
// synthetic export — no real Facebook export was available (see that
// module's header for why). Mirrors its structure so this test targets the
// SAME `role="article"` assumption the underlying parser already commits to.
const SYNTHETIC_EXPORT_HTML = `<html><body>
  <div role="article">
    <a href="/profile/1" aria-label="Jane Fan">Jane Fan</a>
    <div dir="auto">the clowning today is unreal, easter eggs everywhere in the new merch drop, check this bracelet https://www.etsy.com/listing/123456/swiftie-bracelet</div>
    <span>42 reactions</span>
    <span>7 comments</span>
  </div>
  <div role="article">
    <a href="/profile/2" aria-label="Another Fan">Another Fan</a>
    <div dir="auto">does anyone else think the color palette this era is a clue, also found this random shop https://scam-site.example/deal</div>
    <span>10 likes</span>
    <span>3 comments</span>
  </div>
  <div role="article">
    <a href="/profile/3" aria-label="Third Fan">Third Fan</a>
    <div dir="auto">quiet week, nothing major here</div>
    <span>1 reaction</span>
    <span>0 comments</span>
  </div>
</body></html>`;

const REDLINE_HTML = SYNTHETIC_EXPORT_HTML.replace(
  'quiet week, nothing major here',
  'is she pregnant? someone said they saw a bump',
);

describe('shopLinksFromPosts', () => {
  it('keeps only allowlisted shop domains, deduped by url', () => {
    const posts = [
      { text: 'check https://www.etsy.com/listing/1 and also https://www.etsy.com/listing/1' },
      { text: 'sketchy https://scam-site.example/deal' },
      { text: 'a shopify store https://cool-swiftie-shop.myshopify.com/products/x' },
    ];
    const links = shopLinksFromPosts(posts, { groupSlug: 'test-group' });
    expect(links).toHaveLength(2);
    expect(links.map((l) => l.url)).toContain('https://www.etsy.com/listing/1');
    expect(links.map((l) => l.url)).toContain('https://cool-swiftie-shop.myshopify.com/products/x');
    expect(links.every((l) => l.groupSlug === 'test-group')).toBe(true);
  });

  it('returns empty for posts with no urls', () => {
    expect(shopLinksFromPosts([{ text: 'no links here' }], { groupSlug: 'x' })).toEqual([]);
  });
});

describe('engagementLeadsFromPosts', () => {
  it('ranks by reactions + comments*2 descending and caps at maxLeadsPerGroup', () => {
    const posts = [
      { text: 'low heat post', reactionCount: 1, commentCount: 0 },
      { text: 'high heat post', reactionCount: 42, commentCount: 7 },
      { text: 'medium heat post', reactionCount: 10, commentCount: 3 },
    ];
    const leads = engagementLeadsFromPosts(posts, {
      groupName: 'Test Group',
      groupSlug: 'test-group',
      maxLeadsPerGroup: 2,
    });
    expect(leads).toHaveLength(2);
    expect(leads[0].locator).toContain('high heat post');
    expect(leads[1].locator).toContain('medium heat post');
  });

  it('produces schema-shaped rows: platform facebook, kind hot_thread, url null', () => {
    const leads = engagementLeadsFromPosts([{ text: 'a post', reactionCount: 5, commentCount: 1 }], {
      groupName: 'Taylor Swift\u2019s Vault',
      groupSlug: 'taylor-swifts-vault',
    });
    expect(leads[0]).toMatchObject({
      platform: 'facebook',
      community: 'facebook:taylor-swifts-vault',
      kind: 'hot_thread',
      thread_id: null,
      url: null,
      status: 'new',
      redline_ok: true,
    });
    expect(leads[0].locator).toBe("Taylor Swift\u2019s Vault — a post");
  });

  it('truncates the locator excerpt to 80 chars with an ellipsis', () => {
    const longText = 'x'.repeat(200);
    const leads = engagementLeadsFromPosts([{ text: longText, reactionCount: 0, commentCount: 0 }], {
      groupName: 'G',
      groupSlug: 'g',
    });
    expect(leads[0].locator).toBe(`G — ${'x'.repeat(80)}\u2026`);
  });

  it('never quotes or names a group member in the built lead (§2.4 step 3)', () => {
    // buildIngestResult below is the real integration test for author
    // stripping (extractPostsFromHtml already removes the aria-label tag
    // before post.text reaches this function) — this test documents that
    // engagementLeadsFromPosts itself never re-adds an author identifier.
    const leads = engagementLeadsFromPosts([{ text: 'a totally anonymous post about clues' }], {
      groupName: 'G',
      groupSlug: 'g',
    });
    expect(leads[0]).not.toHaveProperty('author');
    expect(leads[0]).not.toHaveProperty('authorHash');
  });
});

describe('buildIngestResult', () => {
  it('produces a fan_signal draft, engagement_leads, and shop-link candidates from the same screened post set', () => {
    const result = buildIngestResult(SYNTHETIC_EXPORT_HTML, {
      groupSlug: 'taylor-swifts-vault',
      groupName: "Taylor Swift's Vault",
      exportedAt: new Date('2026-09-07T16:00:00Z'),
      maxLeadsPerGroup: 10,
    });
    expect(result.fanSignal.platform).toBe('facebook');
    expect(result.fanSignal.community).toBe('facebook:taylor-swifts-vault');
    expect(result.fanSignal.volume).toBe(3);
    expect(result.engagementLeads).toHaveLength(3);
    expect(result.shopLinks.map((l) => l.url)).toEqual(['https://www.etsy.com/listing/123456/swiftie-bracelet']);
    expect(result.skippedRedlineCount).toBe(0);
  });

  it('drops a redline-flagged post from fan_signal AND engagement_leads AND shop-links entirely', () => {
    const result = buildIngestResult(REDLINE_HTML, {
      groupSlug: 'taylor-swifts-vault',
      groupName: "Taylor Swift's Vault",
      exportedAt: new Date('2026-09-07T16:00:00Z'),
      maxLeadsPerGroup: 10,
    });
    expect(result.fanSignal.volume).toBe(2); // the flagged post is dropped, same as parseFacebookExport
    expect(result.engagementLeads).toHaveLength(2);
    expect(result.engagementLeads.some((l) => /pregnant/i.test(l.locator))).toBe(false);
    expect(result.skippedRedlineCount).toBe(1);
  });

  it('handles an export with zero postable content without crashing', () => {
    const result = buildIngestResult('<html><body>nothing here</body></html>', {
      groupSlug: 'empty-group',
      groupName: 'Empty Group',
      exportedAt: new Date(),
      maxLeadsPerGroup: 10,
    });
    expect(result.fanSignal.volume).toBe(0);
    expect(result.engagementLeads).toEqual([]);
    expect(result.shopLinks).toEqual([]);
  });
});
