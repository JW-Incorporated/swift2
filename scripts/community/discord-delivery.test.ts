import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — implementation is plain .mjs
import {
  buildCommunityPrompt,
  postCommunityPrompts,
  deliveryStatusFromResult,
} from './discord-delivery.mjs';

describe('buildCommunityPrompt', () => {
  it('creates a paste-ready Reddit prompt with a non-secret identifier and a manual-only approval instruction', () => {
    const prompt = buildCommunityPrompt({
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
      discord_ack_id: '22222222-2222-2222-2222-222222222222',
    });

    expect(prompt).toContain('Community prompt · Reddit · r/TaylorSwift');
    expect(prompt).toContain('ID: 11111111-1111-1111-1111-111111111111');
    expect(prompt).toContain('A paste-ready reply.');
    expect(prompt).toContain('Nothing is posted automatically.');
    expect(prompt).toContain('Posted manually');
    expect(prompt).toContain('Skip');
  });

  it('neutralizes broadcast mentions in untrusted draft text', () => {
    const prompt = buildCommunityPrompt({
      id: '11111111-1111-1111-1111-111111111111',
      platform: 'reddit',
      community: 'TaylorSwift',
      kind: 'hot_thread',
      url: null,
      title: null,
      relevance: null,
      draft: '@everyone reply',
      draft_alt: null,
      link_included: false,
      target_url: null,
    });

    expect(prompt).not.toContain('@everyone');
  });
});

describe('postCommunityPrompts', () => {
  it('posts every prompt with mentions disabled and returns Discord message ids for durable receipts', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: 'discord-message-1' }), { status: 200 }));
    const result = await postCommunityPrompts(
      [{ id: 'lead-1', content: 'Prompt one' }],
      { webhook: 'https://discord.example/webhook', fetchImpl },
    );

    expect(result.status).toBe('delivered');
    expect(result.delivered).toEqual([{ leadId: 'lead-1', messageId: 'discord-message-1' }]);
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://discord.example/webhook?wait=true');
    expect(JSON.parse(String(init.body))).toMatchObject({ allowed_mentions: { parse: [] } });
  });

  it('fails closed before posting when the configured social-channel webhook is absent', async () => {
    const fetchImpl = vi.fn();
    const result = await postCommunityPrompts([{ id: 'lead-1', content: 'Prompt one' }], { webhook: '', fetchImpl });

    expect(result).toEqual({ status: 'unconfigured', delivered: [] });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reports delivery state without claiming an unverified webhook send', () => {
    expect(deliveryStatusFromResult({ status: 'delivered', delivered: [{ leadId: 'lead-1', messageId: 'm-1' }] })).toBe('delivered');
    expect(deliveryStatusFromResult({ status: 'unconfigured', delivered: [] })).toBe('unconfigured');
  });
});
