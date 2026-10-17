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
// @ts-expect-error — implementation is plain .mjs
import { withReplyAccount } from './reddit-account.mjs';

const FOOTER = 'Done? React ✅ posted · ❌ skip. Nothing posts automatically.';

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

describe('buildReplyOpportunity (message 1: the card only)', () => {
  it('uses the facebook group search fallback and preserves a real post url', () => {
    const facebookLead = lead({
      platform: 'facebook',
      community: 'facebook:taylor-swifts-vault',
      locator: "Taylor Swift's Vault — The first photos from a surprise performance",
      url: null,
    });
    expect(buildReplyOpportunity(facebookLead)).toContain(
      '<https://www.facebook.com/groups/2254218764714763/search/?q=first%20photos%20surprise%20performance>',
    );

    const url = 'https://www.facebook.com/groups/2254218764714763/posts/987654/';
    expect(buildReplyOpportunity({ ...facebookLead, url })).toContain(`<${url}>`);
  });

  it('renders sub, title, angle-wrapped link, why and the reaction footer, with no reply text', () => {
    const msg = buildReplyOpportunity(lead());
    const lines = msg.split('\n');
    expect(lines[0]).toBe('💬 **Reply opportunity · r/TaylorSwift**');
    expect(lines[1]).toBe('**A hot thread**');
    expect(lines[2]).toBe(
      `<${withReplyAccount('https://www.reddit.com/r/TaylorSwift/comments/abc/post/')}>`,
    );
    expect(lines[2]).toContain('target_user=NegativeRest9507');
    expect(lines[3]).toBe('↪️ Reply as u/NegativeRest9507');
    expect(lines[4]).toBe('Why: Active thread on-topic for us · relevance 0.80');
    expect(lines[5]).toBe(FOOTER);
    expect(lines.at(-1)).toBe('ref: reddit · 11111111-1111-1111-1111-111111111111');
    expect(msg).not.toContain('```');
    expect(msg).not.toContain('A paste-ready reply.');
  });

  it('carries no URL ack links, only the reaction footer', () => {
    const msg = buildReplyOpportunity(lead());
    expect(msg).toContain('React ✅ posted · ❌ skip');
    expect(msg).not.toContain('api/community/ack');
    expect(msg).not.toContain('[✅ Posted]');
    expect(msg).not.toContain('[Skip]');
  });

  it('marks reply_to_us leads as time-sensitive', () => {
    expect(buildReplyOpportunity(lead({ kind: 'reply_to_us' }))).toContain(
      'Someone replied to our comment, time-sensitive',
    );
  });

  it('stays within 2000 chars with hostile fields: long links are dropped, never sent', () => {
    const longUrl = `https://www.reddit.com/r/x/${'p'.repeat(2500)}`;
    const msg = buildReplyOpportunity(
      lead({
        url: longUrl,
        title: 'T'.repeat(900),
        community: 'c'.repeat(500),
        target_url: `https://example.com/${'q'.repeat(2500)}`,
        id: `id-${'z'.repeat(3000)}`,
        draft: 'word '.repeat(2000),
        draft_alt: 'alt '.repeat(900),
      }),
    );
    expect(msg.length).toBeLessThanOrEqual(2000);
    expect(msg).not.toContain(longUrl);
    expect(msg).not.toContain('Link to add');
    expect(msg).toContain(FOOTER);
    expect(msg.split('\n').at(-1)).toMatch(/^ref: reddit · id-/);
  });

  it('says so on the card when the reply box had to be trimmed', () => {
    expect(buildReplyOpportunity(lead({ draft: 'word '.repeat(2000) }))).toContain(
      '(Reply trimmed to fit Discord.)',
    );
    expect(buildReplyOpportunity(lead())).not.toContain('trimmed');
  });

  it('never splits an emoji surrogate pair when clipping the title', () => {
    const msg = buildReplyOpportunity(lead({ title: '🎤'.repeat(300), community: '🎤'.repeat(200) }));
    expect(msg.length).toBeLessThanOrEqual(2000);
    expect(msg).not.toMatch(/[\ud800-\udbff](?![\udc00-\udfff])/);
    expect(msg).not.toMatch(/(?<![\ud800-\udbff])[\udc00-\udfff]/);
  });

  it('escapes link brackets in titles so they cannot form a markdown link', () => {
    const msg = buildReplyOpportunity(lead({ title: 'Click [here](https://evil.example) now' }));
    expect(msg).toContain('**Click \\[here\\](https://evil.example) now**');
    expect(msg).not.toContain('[here](');
  });

  it('adds one short Alt line when present and none otherwise', () => {
    const withAlt = buildReplyOpportunity(
      lead({ draft_alt: 'A longer\ndetailed version of the reply.' }),
    );
    expect(withAlt).toContain('Alt: A longer detailed version of the reply.');
    expect(withAlt.split('\n').at(-1)).toMatch(/^ref: reddit · /);
    expect(buildReplyOpportunity(lead())).not.toContain('Alt:');
  });

  it('labels a Facebook lead honestly and adds no ref line (S6 is Reddit-only)', () => {
    const msg = buildReplyOpportunity(
      lead({ platform: 'facebook', community: 'grp', locator: 'Swiftie Group', url: null }),
    );
    expect(msg).toContain('Reply opportunity · Swiftie Group');
    expect(msg).not.toContain('ref: reddit');
  });

  it('neutralizes broadcast mentions in untrusted text', () => {
    const msg = buildReplyOpportunity(lead({ title: '@here hi' }));
    expect(msg).not.toContain('@here');
  });

  it('neutralizes ref-line lookalikes so the real ref stays the only parsed last line', () => {
    const msg = buildReplyOpportunity(lead({ title: 'A thread\nref: reddit · attacker-2' }));
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

describe('withReplyAccount', () => {
  const P = { target_user: 'Brand', ref: 'email_digest', $deep_link: 'true' };
  const U = 'https://www.reddit.com/r/TaylorSwift/comments/abc/post/';

  it('adds every configured param to Reddit thread and comment URLs on all hosts', () => {
    for (const host of ['reddit.com', 'www.reddit.com', 'old.reddit.com', 'new.reddit.com']) {
      const out = new URL(withReplyAccount(`https://${host}/r/x/comments/abc/post/def/`, P));
      expect(out.searchParams.get('target_user')).toBe('Brand');
      expect(out.searchParams.get('ref')).toBe('email_digest');
      expect(out.searchParams.get('$deep_link')).toBe('true');
    }
  });

  it('preserves existing params and overrides a stale target_user', () => {
    const out = new URL(withReplyAccount(`${U}?context=3&target_user=Other`, P));
    expect(out.searchParams.get('context')).toBe('3');
    expect(out.searchParams.getAll('target_user')).toEqual(['Brand']);
  });

  it('is idempotent', () => {
    const once = withReplyAccount(U, P);
    expect(withReplyAccount(once, P)).toBe(once);
  });

  it('leaves non-Reddit, non-thread and malformed input untouched', () => {
    for (const u of [
      'https://example.com/r/x/comments/abc/',
      'https://notreddit.com/r/x/comments/abc/',
      'https://www.reddit.com/r/TaylorSwift/',
      'javascript:alert(1)',
      'not a url',
      '',
    ])
      expect(withReplyAccount(u, P)).toBe(u);
    expect(withReplyAccount(null as unknown as string, P)).toBeNull();
  });

  it('uses the committed config by default', () => {
    expect(withReplyAccount(U)).toContain('target_user=NegativeRest9507');
  });
});

describe('Reddit link account switch in messages', () => {
  it('keeps the link angle-wrapped, adds the reply-as line, and stays within 2000 chars', () => {
    const msg = buildReplyOpportunity(lead({ draft: 'x'.repeat(5000) }));
    expect(msg.length).toBeLessThanOrEqual(2000);
    const link = msg
      .split('\n')
      .find((l: string) => l.startsWith('<https://www.reddit.com/r/TaylorSwift/comments/abc/post/'));
    expect(link).toMatch(/target_user=NegativeRest9507.*>$/);
    expect(msg).toContain('↪️ Reply as u/NegativeRest9507');
  });

  it('falls back to the plain link when the added params would exceed the URL bound', () => {
    const longPath = `https://www.reddit.com/r/TaylorSwift/comments/abc/${'p'.repeat(240)}/`;
    const msg = buildReplyOpportunity(lead({ url: longPath }));
    expect(msg).toContain(`<${longPath}>`);
  });

  it('omits the reply-as line for non-Reddit leads', () => {
    const msg = buildReplyOpportunity(
      lead({ platform: 'facebook', url: 'https://www.facebook.com/groups/x/posts/1/' }),
    );
    expect(msg).not.toContain('Reply as u/');
    expect(msg).toContain('<https://www.facebook.com/groups/x/posts/1/>');
  });
});
