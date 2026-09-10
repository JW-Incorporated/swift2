import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — implementation is plain .mjs
import {
  buildCommunityPrompt,
  postCommunityPrompts,
  deliveryStatusFromResult,
} from './discord-delivery.mjs';

describe('buildCommunityPrompt', () => {
  it('creates a paste-ready Reddit prompt with signed ack links wrapped to suppress unfurls', () => {
    const prompt = buildCommunityPrompt(
      {
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
      },
      {
        postedUrl:
          'https://www.longlivets.com/api/community/ack?lead=x&action=posted&link=0&token=abc',
        skipUrl: 'https://www.longlivets.com/api/community/ack?lead=x&action=skip&token=def',
      },
    );

    expect(prompt).toContain('Community prompt · Reddit · r/TaylorSwift');
    expect(prompt).toContain('ID: 11111111-1111-1111-1111-111111111111');
    expect(prompt).toContain('A paste-ready reply.');
    expect(prompt).toContain('Nothing is posted automatically.');
    // Angle-bracket-wrapped so Discord's unfurler never fires its own GET
    // against the signed ack route (Fable ruling: false-acknowledgement risk).
    expect(prompt).toContain(
      '[Posted manually](<https://www.longlivets.com/api/community/ack?lead=x&action=posted&link=0&token=abc>)',
    );
    expect(prompt).toContain(
      '[Skip](<https://www.longlivets.com/api/community/ack?lead=x&action=skip&token=def>)',
    );
  });

  it('never mints or references an unsigned ack capability when links are absent', () => {
    const prompt = buildCommunityPrompt({
      id: '11111111-1111-1111-1111-111111111111',
      platform: 'reddit',
      community: 'TaylorSwift',
      kind: 'hot_thread',
      url: null,
      title: null,
      relevance: null,
      draft: 'A paste-ready reply.',
      draft_alt: null,
      link_included: false,
      target_url: null,
    });

    expect(prompt).toContain('Acknowledgement control unavailable');
    expect(prompt).not.toContain('discord_ack_id');
    expect(prompt).not.toContain('ack=');
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
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ id: 'discord-message-1' }), { status: 200 }),
    );
    const result = await postCommunityPrompts([{ id: 'lead-1', content: 'Prompt one' }], {
      webhook: 'https://discord.example/webhook',
      fetchImpl,
    });

    expect(result.status).toBe('delivered');
    expect(result.delivered).toEqual([{ leadId: 'lead-1', messageId: 'discord-message-1' }]);
    expect(result.failed).toEqual([]);
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://discord.example/webhook?wait=true');
    expect(JSON.parse(String(init.body))).toMatchObject({ allowed_mentions: { parse: [] } });
  });

  it('fails closed before posting when the configured social-channel webhook is absent', async () => {
    const fetchImpl = vi.fn();
    const result = await postCommunityPrompts([{ id: 'lead-1', content: 'Prompt one' }], {
      webhook: '',
      fetchImpl,
    });

    expect(result).toEqual({ status: 'unconfigured', delivered: [], failed: [] });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('persists a partial delivery: one failure never loses the confirmed deliveries around it', async () => {
    let call = 0;
    const fetchImpl = vi.fn(async () => {
      call += 1;
      if (call === 2) return new Response('boom', { status: 500 });
      return new Response(JSON.stringify({ id: `msg-${call}` }), { status: 200 });
    });
    const onDelivered = vi.fn();
    const result = await postCommunityPrompts(
      [
        { id: 'lead-1', content: 'one' },
        { id: 'lead-2', content: 'two' },
        { id: 'lead-3', content: 'three' },
      ],
      { webhook: 'https://discord.example/webhook', fetchImpl, onDelivered },
    );

    expect(result.status).toBe('partial');
    expect(result.delivered).toEqual([
      { leadId: 'lead-1', messageId: 'msg-1' },
      { leadId: 'lead-3', messageId: 'msg-3' },
    ]);
    expect(result.failed).toEqual([
      { leadId: 'lead-2', message: expect.stringContaining('HTTP 500') },
    ]);
    // Each confirmed delivery is persisted immediately, not batched at the end.
    expect(onDelivered).toHaveBeenCalledTimes(2);
    expect(onDelivered).toHaveBeenNthCalledWith(1, { leadId: 'lead-1', messageId: 'msg-1' });
    expect(onDelivered).toHaveBeenNthCalledWith(2, { leadId: 'lead-3', messageId: 'msg-3' });
  });

  it('reports delivery state without claiming an unverified webhook send', () => {
    expect(
      deliveryStatusFromResult({
        status: 'delivered',
        delivered: [{ leadId: 'lead-1', messageId: 'm-1' }],
        failed: [],
      }),
    ).toBe('delivered');
    expect(deliveryStatusFromResult({ status: 'unconfigured', delivered: [], failed: [] })).toBe(
      'unconfigured',
    );
    expect(
      deliveryStatusFromResult({
        status: 'partial',
        delivered: [],
        failed: [{ leadId: 'l', message: 'x' }],
      }),
    ).toBe('partial');
  });
});
