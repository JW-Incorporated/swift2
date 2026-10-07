import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearPrefetchedShareCards, prefetchShareCard, shareCardImage } from './share-payload';

const shareData = { getContentItem: () => undefined, resolveTrackKey: () => null };
const target = { kind: 'item', itemId: 'interrupted-speech' } as const;
const source = { item: 'interrupted-speech' };

function pngResponse(): Response {
  return new Response(new Uint8Array([137, 80, 78, 71]), {
    status: 200,
    headers: { 'content-type': 'image/png' },
  });
}

describe('shareCardImage prefetching', () => {
  const fetchMock = vi.fn();
  const share = vi.fn();
  const download = vi.fn();

  beforeEach(() => {
    clearPrefetchedShareCards();
    fetchMock.mockReset().mockImplementation(async () => pngResponse());
    share.mockReset().mockResolvedValue(undefined);
    download.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('navigator', { share, canShare: () => true });
    vi.stubGlobal('window', {
      location: { origin: 'https://www.longlivets.com', pathname: '/' },
      matchMedia: () => ({ matches: true }),
      setTimeout: () => 0,
    });
    vi.stubGlobal(
      'URL',
      Object.assign(URL, { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} }),
    );
    vi.stubGlobal('document', {
      createElement: () => ({ click: download, remove: () => {} }),
      body: { appendChild: () => {} },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls navigator.share synchronously in the tap when the card was prefetched', async () => {
    await prefetchShareCard(source, 'story');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const pending = shareCardImage(target, source, 'story', shareData);
    // No await has happened yet: the share call must already be in flight, or
    // iOS Safari would have dropped the click's transient activation.
    expect(share).toHaveBeenCalledTimes(1);
    const data = share.mock.calls[0][0];
    expect(data.files[0]).toBeInstanceOf(File);
    expect(data.files[0].name).toBe('long-live-story.png');
    expect(data.files[0].type).toBe('image/png');
    await expect(pending).resolves.toBe('native');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('prefetch is deduped and keyed per size', async () => {
    const [a, b] = await Promise.all([
      prefetchShareCard(source, 'story'),
      prefetchShareCard(source, 'story'),
    ]);
    expect(a).toBe(b);
    await prefetchShareCard(source, 'portrait');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map((c) => c[0]).sort()).toEqual([
      '/api/share-card?item=interrupted-speech&size=portrait',
      '/api/share-card?item=interrupted-speech&size=story',
    ]);
  });

  it('still fetches on demand when nothing was prefetched', async () => {
    await expect(shareCardImage(target, source, 'portrait', shareData)).resolves.toBe('native');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(share).toHaveBeenCalledTimes(1);
  });

  it('keeps the download fallback on non-touch devices, prefetched or not', async () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://www.longlivets.com', pathname: '/' },
      matchMedia: () => ({ matches: false }),
      setTimeout: () => 0,
    });
    await prefetchShareCard(source, 'story');
    await expect(shareCardImage(target, source, 'story', shareData)).resolves.toBe('downloaded');
    expect(share).not.toHaveBeenCalled();
    expect(download).toHaveBeenCalledOnce();
  });

  it('does not cache a failed prefetch, so the tap retries and can still error cleanly', async () => {
    fetchMock.mockImplementationOnce(async () => new Response('nope', { status: 503 }));
    await expect(prefetchShareCard(source, 'story')).resolves.toBeNull();
    await expect(shareCardImage(target, source, 'story', shareData)).resolves.toBe('native');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    clearPrefetchedShareCards();
    fetchMock.mockImplementation(async () => {
      throw new Error('offline');
    });
    await expect(shareCardImage(target, source, 'story', shareData)).resolves.toBe('error');
  });
});
