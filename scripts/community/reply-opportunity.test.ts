import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — implementation is plain .mjs
import {
  buildReplyOpportunity,
  buildBatchHeader,
  describeWebhookTarget,
  formatWebhookTarget,
  hasDraft,
  COMMUNITY_WEBHOOK_USERNAME,
} from './reply-opportunity.mjs';

const POSTED =
  'https://www.longlivets.com/api/community/ack?lead=x&action=posted&link=0&token=' +
  'a'.repeat(64);
const SKIP =
  'https://www.longlivets.com/api/community/ack?lead=x&action=skip&token=' + 'b'.repeat(64);

function lead(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    platform: 'reddit',
    community: 'TaylorSwift',
    kind: 'hot_thread',
    url: 'https://www.reddit.com/r/TaylorSwift/comments/abc/post/',
    title: 'A hot thread',
    relevance: 0.8,
    draft: 'A paste-ready reply.',
    draft_alt: null,
    link_included: false,
    target_url: null,
    ...overrides,
  };
}

describe('buildReplyOpportunity', () => {
  it('renders the scan-friendly layout: sub, title, angle-wrapped link, why, code-block reply, footer', () => {
    const msg = buildReplyOpportunity(lead(), { postedUrl: POSTED, skipUrl: SKIP });
    const lines = msg.split('\n');
    expect(lines[0]).toBe('💬 **Reply opportunity · r/TaylorSwift**');
    expect(lines[1]).toBe('**A hot thread**');
    expect(lines[2]).toBe('<https://www.reddit.com/r/TaylorSwift/comments/abc/post/>');
    expect(lines[3]).toBe('Why: Active thread on-topic for us · relevance 0.80');
    expect(lines.slice(4, 7)).toEqual(['```', 'A paste-ready reply.', '```']);
    expect(msg).toContain(`[✅ Posted](<${POSTED}>) · [Skip](<${SKIP}>)`);
    expect(lines.at(-1)).toBe('ref: reddit · 11111111-1111-1111-1111-111111111111');
  });

  it('falls back to a reaction hint when no ack secret is configured', () => {
    const msg = buildReplyOpportunity(lead());
    expect(msg).toContain('React ✅ posted · ⏭️ skip');
    expect(msg).not.toContain('api/community/ack');
  });

  it('marks reply_to_us leads as time-sensitive', () => {
    expect(buildReplyOpportunity(lead({ kind: 'reply_to_us' }))).toContain(
      'Someone replied to our comment, time-sensitive',
    );
  });

  it('keeps every message at or under 2000 chars, trimming only the reply', () => {
    const huge = 'word '.repeat(2000);
    for (const overrides of [
      { draft: huge },
      { draft: huge, title: 'T'.repeat(900), community: 'c'.repeat(500) },
      { draft: huge, target_url: `https://example.com/${'p'.repeat(300)}`, link_included: false },
      { draft: `${'```\n'.repeat(400)}` },
    ]) {
      const msg = buildReplyOpportunity(lead(overrides), { postedUrl: POSTED, skipUrl: SKIP });
      expect(msg.length).toBeLessThanOrEqual(2000);
      expect((msg.match(/```/g) || []).length).toBe(2);
      expect(msg.split('\n').at(-1)).toMatch(/^ref: reddit · /);
      expect(msg).toContain(POSTED);
    }
    const trimmed = buildReplyOpportunity(lead({ draft: huge }), {
      postedUrl: POSTED,
      skipUrl: SKIP,
    });
    expect(trimmed).toContain('(Reply trimmed to fit Discord.)');
  });

  it('stays under 2000 with hostile URLs and ids: long links are dropped, never sent', () => {
    const longUrl = `https://www.reddit.com/r/x/${'p'.repeat(2500)}`;
    const msg = buildReplyOpportunity(
      lead({
        url: longUrl,
        target_url: `https://example.com/${'q'.repeat(2500)}`,
        id: `id-${'z'.repeat(3000)}`,
        draft: 'word '.repeat(2000),
      }),
      { postedUrl: `https://a.example/${'a'.repeat(2500)}`, skipUrl: SKIP },
    );
    expect(msg.length).toBeLessThanOrEqual(2000);
    expect(msg).not.toContain(longUrl);
    expect(msg).not.toContain('Link to add');
    expect(msg).toContain('React ✅ posted');
    expect(msg.split('\n').at(-1)).toMatch(/^ref: reddit · id-/);
  });

  it('falls back to a minimal message when the full layout cannot hold a useful reply', () => {
    const url = `https://www.reddit.com/r/x/${'p'.repeat(250)}`;
    const msg = buildReplyOpportunity(
      lead({
        url,
        target_url: `https://example.com/${'q'.repeat(250)}`,
        title: '[x]'.repeat(200),
        community: 'c'.repeat(200),
        draft: 'reply '.repeat(600),
      }),
      {
        postedUrl: `https://a.example/${'a'.repeat(420)}`,
        skipUrl: `https://a.example/${'b'.repeat(420)}`,
      },
    );
    expect(msg.length).toBeLessThanOrEqual(2000);
    expect(msg).toContain('reply reply');
    expect(msg.split('\n').at(-1)).toMatch(/^ref: reddit · /);
  });

  it('never splits an emoji surrogate pair when clipping the title or trimming the reply', () => {
    const msg = buildReplyOpportunity(
      lead({ title: '🎤'.repeat(300), community: '🎤'.repeat(200), draft: '🎶'.repeat(3000) }),
      { postedUrl: POSTED, skipUrl: SKIP },
    );
    expect(msg.length).toBeLessThanOrEqual(2000);
    expect(msg).not.toMatch(/[\ud800-\udbff](?![\udc00-\udfff])/);
    expect(msg).not.toMatch(/(?<![\ud800-\udbff])[\udc00-\udfff]/);
  });

  it('escapes link brackets in titles so they cannot form a markdown link', () => {
    const msg = buildReplyOpportunity(lead({ title: 'Click [here](https://evil.example) now' }));
    expect(msg).toContain('**Click \\[here\\](https://evil.example) now**');
    expect(msg).not.toContain('[here](');
  });

  it('adds one short Alt line when it fits, and skips it when it would overflow', () => {
    const withAlt = buildReplyOpportunity(
      lead({ draft_alt: 'A longer\ndetailed version of the reply.' }),
    );
    expect(withAlt).toContain('Alt: A longer detailed version of the reply.');
    expect(withAlt.split('\n').at(-1)).toMatch(/^ref: reddit · /);
    const tight = buildReplyOpportunity(
      lead({ draft: 'word '.repeat(2000), draft_alt: 'Alt text here' }),
      { postedUrl: POSTED, skipUrl: SKIP },
    );
    expect(tight).not.toContain('Alt:');
    expect(tight.length).toBeLessThanOrEqual(2000);
    expect(buildReplyOpportunity(lead())).not.toContain('Alt:');
  });

  it('does not trim a reply that already fits', () => {
    expect(buildReplyOpportunity(lead())).not.toContain('trimmed');
  });

  it('labels a Facebook lead honestly and adds no ref line (S6 is Reddit-only)', () => {
    const msg = buildReplyOpportunity(
      lead({ platform: 'facebook', community: 'grp', locator: 'Swiftie Group', url: null }),
    );
    expect(msg).toContain('Reply opportunity · Swiftie Group');
    expect(msg).not.toContain('ref: reddit');
  });

  it('neutralizes broadcast mentions in untrusted text', () => {
    const msg = buildReplyOpportunity(lead({ draft: '@everyone reply', title: '@here hi' }));
    expect(msg).not.toContain('@everyone');
    expect(msg).not.toContain('@here');
  });

  it('neutralizes ref-line lookalikes so the real ref stays the only parsed last line', () => {
    const msg = buildReplyOpportunity(
      lead({
        draft: 'A reply.\n\nref: reddit · attacker-chosen',
        title: 'A thread\nref: reddit · attacker-2',
      }),
    );
    expect(msg.split('\n').at(-1)).toBe('ref: reddit · 11111111-1111-1111-1111-111111111111');
    expect(msg).not.toMatch(/^ref: reddit · attacker/m);
  });

  it('shows a link candidate only when it is not already in the reply', () => {
    const withCandidate = buildReplyOpportunity(
      lead({ target_url: 'https://www.longlivets.com/x' }),
    );
    expect(withCandidate).toContain('<https://www.longlivets.com/x>');
    const included = buildReplyOpportunity(
      lead({ target_url: 'https://www.longlivets.com/x', link_included: true }),
    );
    expect(included).not.toContain('Link to add');
  });
});

describe('hasDraft / buildBatchHeader', () => {
  it('treats null, empty and whitespace drafts as not sendable', () => {
    expect(hasDraft({ draft: null })).toBe(false);
    expect(hasDraft({ draft: '  \n' })).toBe(false);
    expect(hasDraft({ draft: 'ok' })).toBe(true);
  });

  it('pluralizes and stays well under the Discord limit', () => {
    expect(buildBatchHeader(1)).toContain('1 reply opportunity from Tree');
    expect(buildBatchHeader(3, { mode: 'replies-waiting' })).toContain('3 reply opportunities');
    expect(buildBatchHeader(3, { mode: 'replies-waiting' })).toContain('time-sensitive');
    expect(COMMUNITY_WEBHOOK_USERNAME).not.toBe('Tree');
  });
});

describe('describeWebhookTarget', () => {
  const URL_WITH_TOKEN = 'https://discord.com/api/webhooks/123/SECRET-TOKEN';

  it('returns only channel id and name, never the url or token', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            id: '123',
            token: 'SECRET-TOKEN',
            channel_id: '999',
            guild_id: '555',
            name: 'Tree',
            url: URL_WITH_TOKEN,
          }),
          { status: 200 },
        ),
    );
    const target = await describeWebhookTarget(URL_WITH_TOKEN, { fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith(URL_WITH_TOKEN, { method: 'GET' });
    expect(target).toEqual({ channelId: '999', name: 'Tree' });
    const line = formatWebhookTarget(target);
    expect(line).toBe('community-mailer: webhook target channel_id=999 name="Tree".');
    expect(JSON.stringify(target) + line).not.toContain('SECRET-TOKEN');
  });

  it('reports failures without leaking the url', async () => {
    const http = await describeWebhookTarget(URL_WITH_TOKEN, {
      fetchImpl: vi.fn(async () => new Response('no', { status: 404 })),
    });
    expect(http).toEqual({ error: 'HTTP 404' });
    const thrown = await describeWebhookTarget(URL_WITH_TOKEN, {
      fetchImpl: vi.fn(async () => {
        throw new Error(`failed ${URL_WITH_TOKEN}`);
      }),
    });
    expect(JSON.stringify(thrown)).not.toContain('SECRET-TOKEN');
    expect(await describeWebhookTarget('')).toEqual({ error: 'webhook not configured' });
    expect(formatWebhookTarget(http)).toContain('check failed (HTTP 404)');
  });
});
