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
    expect(await h.share(payload({ url: CARD }), ctx)).toEqual({ ok: true, value: null });
    expect(ports.download).toHaveBeenCalledWith(CARD, 'story');
    const arg = (env.share.share as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as { url: string };
    expect(arg.url).toMatch(/^file:\/\//);
  });

  it('Android copies the card to the clipboard, then shares the message', async () => {
    const { h, ports, env } = setup('android');
    const order: string[] = [];
    (ports.copyImage as ReturnType<typeof vi.fn>).mockImplementation(async () => void order.push('copy'));
    (env.share.share as ReturnType<typeof vi.fn>).mockImplementation(async () => void order.push('share'));
    expect(await h.share(payload({ url: CARD }), ctx)).toEqual({ ok: true, value: null });
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
});
