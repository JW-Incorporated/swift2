import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearPrefetchedShareCards, prefetchShareCard, shareCardImage, shareTarget } from './share-payload';

const data = { getContentItem: () => undefined, resolveTrackKey: () => null };
const target = { kind: 'item', itemId: 'interrupted-speech' } as const;
const source = { item: 'interrupted-speech' };

describe('share with a host (WP2.4-A2)', () => {
  const navShare = vi.fn();
  const fetchMock = vi.fn();

  beforeEach(() => {
    clearPrefetchedShareCards();
    navShare.mockReset().mockResolvedValue(undefined);
    fetchMock.mockReset().mockImplementation(async () => new Response(new Uint8Array([1]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('navigator', { share: navShare });
    vi.stubGlobal('window', {
      location: { origin: 'null', pathname: '/' },
      dispatchEvent: () => true,
      matchMedia: () => ({ matches: false }),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shareTarget prefers host.share and builds the URL from host.resolveUrl', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const resolveUrl = (p: string) => `https://www.longlivets.com${p}`;
    expect(await shareTarget(target, data, { share, resolveUrl })).toBe('native');
    expect(navShare).not.toHaveBeenCalled();
    expect(share.mock.calls[0]?.[0]).toMatchObject({ url: expect.stringContaining('https://www.longlivets.com') });
  });

  it('shareTarget without a host keeps the navigator.share path', async () => {
    expect(await shareTarget(target, data)).toBe('native');
    expect(navShare).toHaveBeenCalledTimes(1);
  });

  it('shareCardImage with host.share falls back to a link share and fetches no card', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    expect(await shareCardImage(target, source, 'portrait', data, { share })).toBe('native');
    expect(share).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shareCardImage reports cancelled when host.share rejects with AbortError', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('dismissed', 'AbortError'));
    expect(await shareCardImage(target, source, 'portrait', data, { share })).toBe('cancelled');
  });

  it('shareCardImage reports error when host.share rejects otherwise', async () => {
    const share = vi.fn().mockRejectedValue(new Error('x'));
    expect(await shareCardImage(target, source, 'portrait', data, { share })).toBe('error');
  });

  it('prefetchShareCard fetches the resolved URL', async () => {
    await prefetchShareCard(source, 'portrait', (p) => `https://www.longlivets.com${p}`);
    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/^https:\/\/www\.longlivets\.com\//);
  });
});
