import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — implementation is plain .mjs
import {
  postCommunityPrompts,
  postBatchHeader,
  deliveryStatusFromResult,
  chunkForDiscord,
} from './discord-delivery.mjs';

describe('chunkForDiscord', () => {
  it('returns a single unchanged chunk when content is under the limit', () => {
    const result = chunkForDiscord('short content', 2000);
    expect(result).toEqual(['short content']);
  });

  it('splits on a paragraph boundary when content is just over the limit', () => {
    const paraA = 'a'.repeat(1200);
    const paraB = 'b'.repeat(1200);
    const content = `${paraA}\n\n${paraB}`;
    const result = chunkForDiscord(content, 2000);
    expect(result).toEqual([paraA, paraB]);
    for (const chunk of result) expect(chunk.length).toBeLessThanOrEqual(2000);
  });

  it('hard-splits a single paragraph that alone exceeds the limit', () => {
    const words = Array.from({ length: 400 }, (_, i) => `word${i}`);
    const giant = words.join(' ');
    const result = chunkForDiscord(giant, 2000);
    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) expect(chunk.length).toBeLessThanOrEqual(2000);
    expect(result.join(' ')).toBe(giant);
  });

  it('never cuts an emoji or ZWJ sequence at the hard-split boundary', () => {
    const family = '\u{1f468}‍\u{1f469}‍\u{1f467}';
    for (const emoji of ['\u{1f3a4}', family]) {
      for (let pad = 1990; pad <= 2000; pad += 1) {
        const text = `${'a'.repeat(pad)}${emoji}${'b'.repeat(50)}`;
        const result = chunkForDiscord(text, 2000);
        expect(result.join('')).toBe(text);
        for (const chunk of result) {
          expect(chunk.length).toBeLessThanOrEqual(2000);
          expect(chunk).not.toMatch(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/);
          expect(chunk.endsWith('‍')).toBe(false);
        }
        expect(result.some((chunk) => chunk.includes(emoji))).toBe(true);
      }
    }
  });

  it('keeps fences balanced when a fenced code block would straddle a chunk boundary', () => {
    const paraA = 'intro '.repeat(300); // well under the limit on its own
    const fenced = '```\n' + 'code line\n'.repeat(120) + '```'; // pushes past the limit combined
    const content = `${paraA}\n\n${fenced}`;
    const result = chunkForDiscord(content, 2000);
    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(2000);
      const fenceCount = (chunk.match(/```/g) || []).length;
      expect(fenceCount % 2).toBe(0);
    }
  });

  it('regression: a fenced body with an internal blank line never overflows the limit after balancing (round-1 review finding)', () => {
    // Reproduces the exact shape Codex found: a fence whose CONTENT has a
    // blank line (a real caption paragraph break), so `\n\n`-splitting cuts
    // inside the still-open fence — the packer must reserve room for
    // balanceFences's reopen/close markers even on chunks it never predicted
    // would need one.
    const fenced = '```\n' + 'a'.repeat(1911) + '\n\n' + 'b'.repeat(30) + '\n```';
    const result = chunkForDiscord(fenced, 2000);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(2000);
      const fenceCount = (chunk.match(/```/g) || []).length;
      expect(fenceCount % 2).toBe(0);
    }
  });
});

describe('postBatchHeader', () => {
  it('posts with embeds suppressed and never throws on a Discord failure', async () => {
    const ok = vi.fn(async () => new Response('{}', { status: 200 }));
    expect(await postBatchHeader('hi', { webhook: 'https://d.example/w', fetchImpl: ok })).toBe(true);
    expect(JSON.parse(String(ok.mock.calls[0][1].body))).toMatchObject({ content: 'hi', flags: 4 });
    const boom = vi.fn(async () => {
      throw new Error('net');
    });
    expect(await postBatchHeader('hi', { webhook: 'https://d.example/w', fetchImpl: boom })).toBe(false);
    expect(await postBatchHeader('hi', { webhook: '', fetchImpl: ok })).toBe(false);
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
    expect(JSON.parse(String(init.body))).toMatchObject({
      allowed_mentions: { parse: [] },
      username: 'Tree',
      avatar_url: 'https://www.longlivets.com/social/tree-avatar.png',
      flags: 4,
    });
  });

  it('honours a custom display name and still suppresses embeds', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: 'm' }), { status: 200 }));
    await postCommunityPrompts([{ id: 'lead-1', content: 'x' }], {
      webhook: 'https://discord.example/webhook',
      fetchImpl,
      username: 'Tree · Reply opportunities',
    });
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1].body))).toMatchObject({
      username: 'Tree · Reply opportunities',
      flags: 4,
    });
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
