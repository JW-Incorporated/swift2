import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HandlerContext } from '@swift2/ui';
import { createHandlers } from './bridge-handlers-ui';
import { createUiDeps, type ShareCardPorts, type UiDepsEnv } from './ui-deps';

const ctx: HandlerContext = { signal: new AbortController().signal };
const CARD = 'https://www.longlivets.com/api/share-card?item=a&size=story';
const payload = (image: { url: string }) => ({ title: 'T', text: 'x', url: 'https://www.longlivets.com/?item=a', image });

function setup(platformOS: string, cards?: Partial<ShareCardPorts>) {
  const ports: ShareCardPorts = {
    download: vi.fn(async () => ({ uri: 'file:///cache/share/story.png', base64: () => 'B64' })),
    copyImage: vi.fn(async () => {}),
    prune: vi.fn(async () => {}),
    ...cards,
  };
  const env = {
    linking: { openURL: vi.fn(async () => true) },
    share: { share: vi.fn(async () => ({})) },
    platformOS,
    log: vi.fn(),
    cards: ports,
  } satisfies UiDepsEnv;
  return { env, ports, h: createHandlers(createUiDeps(env)) };
}

afterEach(() => vi.useRealTimers());

describe('share with an image', () => {
  it.each([
    'https://evil.example/api/share-card?size=story',
    'http://www.longlivets.com/api/share-card?size=story',
    'https://www.longlivets.com.evil.example/x',
    'https://u:p@www.longlivets.com/x',
    'not a url',
  ])('rejects image.url %s as invalid and downloads nothing', async (u) => {
    const { h, ports, env } = setup('ios');
    expect(await h.share(payload({ url: u }), ctx)).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(ports.download).not.toHaveBeenCalled();
    expect(env.share.share).not.toHaveBeenCalled();
  });

  it('iOS downloads <size>.png and shares it as a file:// url', async () => {
    const { h, ports, env } = setup('ios');
    expect(await h.share(payload({ url: CARD }), ctx)).toEqual({ ok: true, value: { imageCopied: false } });
    expect(ports.download).toHaveBeenCalledWith(CARD, expect.stringMatching(/^\d+-1-story$/));
    expect(ports.prune).toHaveBeenCalledWith(2);
    const arg = (env.share.share as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as { url: string };
    expect(arg.url).toMatch(/^file:\/\//);
  });

  it('Android copies the card to the clipboard, then shares the message', async () => {
    const { h, ports, env } = setup('android');
    const order: string[] = [];
    (ports.copyImage as ReturnType<typeof vi.fn>).mockImplementation(async () => void order.push('copy'));
    (env.share.share as ReturnType<typeof vi.fn>).mockImplementation(async () => void order.push('share'));
    expect(await h.share(payload({ url: CARD }), ctx)).toEqual({ ok: true, value: { imageCopied: true } });
    expect(ports.copyImage).toHaveBeenCalledWith('B64');
    expect(order).toEqual(['copy', 'share']);
    expect(env.share.share).toHaveBeenCalledWith({ title: 'T', message: 'x\nhttps://www.longlivets.com/?item=a' });
  });

  it('a failed download falls back to the link share and still resolves ok', async () => {
    const { h, env } = setup('ios', { download: vi.fn(async () => { throw new Error('offline'); }) });
    expect(await h.share(payload({ url: CARD }), ctx)).toEqual({ ok: true, value: null });
    expect(env.share.share).toHaveBeenCalledWith({ title: 'T', message: 'x', url: 'https://www.longlivets.com/?item=a' });
  });

  it('a hung download times out at 8 s and falls back to the link share', async () => {
    vi.useFakeTimers();
    const { h, env } = setup('android', { download: () => new Promise(() => {}) });
    const p = h.share(payload({ url: CARD }), ctx);
    await vi.advanceTimersByTimeAsync(8000);
    expect(await p).toEqual({ ok: true, value: null });
    expect(env.share.share).toHaveBeenCalledWith({ title: 'T', message: 'x\nhttps://www.longlivets.com/?item=a' });
  });

  it.each([
    ['clipboard rejects', { copyImage: vi.fn(async () => { throw new Error('denied'); }) }],
    ['base64 fails', { download: vi.fn(async () => ({ uri: 'file:///c.png', base64: () => { throw new Error('read'); } })) }],
  ])('Android: %s -> no imageCopied, text share still happens', async (_n, over) => {
    const { h, env } = setup('android', over);
    expect(await h.share(payload({ url: CARD }), ctx)).toEqual({ ok: true, value: { imageCopied: false } });
    expect(env.share.share).toHaveBeenCalledWith({ title: 'T', message: 'x\nhttps://www.longlivets.com/?item=a' });
  });

  it('a download resolving after its timeout and after a newer share started is never shared', async () => {
    vi.useFakeTimers();
    let late: (v: { uri: string; base64(): string }) => void = () => {};
    const download = vi
      .fn()
      .mockImplementationOnce(() => new Promise((r) => (late = r)))
      .mockImplementationOnce(async () => ({ uri: 'file:///cache/share/second.png', base64: () => 'B64' }));
    const { h, env } = setup('ios', { download });
    const first = h.share(payload({ url: CARD }), ctx);
    await vi.advanceTimersByTimeAsync(8000);
    await first;
    const second = await h.share(payload({ url: CARD }), ctx);
    late({ uri: 'file:///cache/share/first.png', base64: () => 'OLD' });
    await vi.advanceTimersByTimeAsync(0);
    expect(second).toEqual({ ok: true, value: { imageCopied: false } });
    const urls = (env.share.share as ReturnType<typeof vi.fn>).mock.calls.map((c) => (c[0] as { url: string }).url);
    expect(urls).toEqual(['https://www.longlivets.com/?item=a', 'file:///cache/share/second.png']);
    expect(download.mock.calls[0]?.[1]).not.toBe(download.mock.calls[1]?.[1]);
  });
});
