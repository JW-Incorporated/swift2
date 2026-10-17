import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — implementation is plain .mjs
import { buildDraftBox, escapeBackticks, REACTION_FOOTER } from './reply-card.mjs';
// @ts-expect-error — implementation is plain .mjs
import { buildReplyOpportunity } from './reply-opportunity.mjs';
// @ts-expect-error — implementation is plain .mjs
import { postCommunityPrompts } from './discord-delivery.mjs';
// @ts-expect-error — implementation is plain .mjs
import { mailerRouteFor } from './mailer.mjs';

const FENCE = '```';

describe('buildDraftBox (message 2)', () => {
  it('holds only the draft, inside a code box', () => {
    expect(buildDraftBox('  Hello there.  ')).toEqual({
      text: `${FENCE}\nHello there.\n${FENCE}`,
      trimmed: false,
    });
  });

  it('breaks every run of 3+ backticks so the box cannot close early', () => {
    for (const draft of [`a ${FENCE} b`, `a ${FENCE}${FENCE} b`, `x\n${FENCE}js\ny\n${FENCE}`, '`'.repeat(9)]) {
      const { text } = buildDraftBox(draft);
      expect(text.startsWith(`${FENCE}\n`)).toBe(true);
      expect(text.endsWith(`\n${FENCE}`)).toBe(true);
      expect((text.match(/```/g) || []).length).toBe(2);
    }
    expect(escapeBackticks('``')).toBe('``');
  });

  it('trims an over-long draft to the Discord limit and flags it', () => {
    const { text, trimmed } = buildDraftBox('word '.repeat(2000));
    expect(trimmed).toBe(true);
    expect(text.length).toBeLessThanOrEqual(2000);
    expect(text.endsWith(`\n${FENCE}`)).toBe(true);
  });

  it('returns empty text for an empty draft', () => {
    expect(buildDraftBox('  \n').text).toBe('');
  });
});

describe('mailer lane routing and two-message delivery', () => {
  const env = { DISCORD_BOT_TOKEN: 'bot' };

  function mockDiscord() {
    let n = 0;
    const calls: { url: string; content: string }[] = [];
    const fetchImpl = vi.fn(async (url: string, init: { body: string }) => {
      calls.push({ url: String(url), content: JSON.parse(init.body).content });
      n += 1;
      return new Response(JSON.stringify({ id: `m${n}` }), { status: 200 });
    });
    return { fetchImpl, calls };
  }

  const lead = (platform: string) => ({
    id: `lead-${platform}`,
    platform,
    community: platform === 'reddit' ? 'TaylorSwift' : 'grp',
    locator: 'Swiftie Group',
    kind: 'hot_thread',
    url:
      platform === 'reddit'
        ? 'https://www.reddit.com/r/TaylorSwift/comments/abc/post/'
        : 'https://www.facebook.com/groups/1/posts/2/',
    title: 'A thread',
    relevance: 0.7,
    draft: `Reply for ${platform} ${FENCE} done`,
    draft_alt: null,
    link_included: false,
    target_url: null,
  });

  it('routes Facebook to tree-facebook and keeps Reddit on tree-main', () => {
    expect(mailerRouteFor('facebook')).toBe('tree-facebook');
    expect(mailerRouteFor('reddit')).toBe('tree-main');
  });

  it.each([
    ['facebook', '1558093113807999026'],
    ['reddit', '1558093607393562644'],
  ])('%s lead: card first, then only the draft box, in the right channel', async (platform, channel) => {
    const { fetchImpl, calls } = mockDiscord();
    const l = lead(platform);
    const result = await postCommunityPrompts(
      [{ id: l.id, content: buildReplyOpportunity(l), followUp: buildDraftBox(l.draft).text }],
      { route: mailerRouteFor(platform), env, fetchImpl: fetchImpl as never },
    );
    expect(result.status).toBe('delivered');
    expect(result.delivered).toEqual([{ leadId: l.id, messageId: 'm1' }]);
    expect(calls).toHaveLength(2);
    for (const c of calls) expect(c.url).toBe(`https://discord.com/api/v10/channels/${channel}/messages`);
    expect(calls[0].content).toContain('Reply opportunity');
    expect(calls[0].content).toContain(REACTION_FOOTER);
    expect(calls[0].content).not.toContain(FENCE);
    expect(calls[0].content).not.toContain('api/community/ack');
    expect(calls[1].content.startsWith(`${FENCE}\nReply for ${platform}`)).toBe(true);
    expect(calls[1].content.endsWith(`\n${FENCE}`)).toBe(true);
    expect((calls[1].content.match(/```/g) || []).length).toBe(2);
  });

  it('keeps the card delivered but reports a failed reply box', async () => {
    let n = 0;
    const fetchImpl = vi.fn(async () => {
      n += 1;
      return n === 1
        ? new Response(JSON.stringify({ id: 'm1' }), { status: 200 })
        : new Response('{}', { status: 500 });
    });
    const result = await postCommunityPrompts(
      [{ id: 'lead-1', content: 'card', followUp: `${FENCE}\nx\n${FENCE}` }],
      { route: 'tree-main', env, fetchImpl: fetchImpl as never },
    );
    expect(result.delivered).toHaveLength(1);
    expect(result.failed).toHaveLength(1);
    expect(result.status).toBe('partial');
  });
});
