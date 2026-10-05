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

  it.each([
    ['iOS', '/private/var/containers/Bundle/Application/ABCD-1234/LongLive.app/dom/index.html'],
    ['Android', '/data/user/0/com.longlive.app/files/ExponentExperienceData/dom/index.html'],
  ])('shareTarget in the app (%s file:// bundle) shares the logical path, never the local one', async (_os, local) => {
    vi.stubGlobal('window', {
      location: { origin: 'null', pathname: local, search: '?x=1', href: `file://${local}?x=1` },
      dispatchEvent: () => true,
    });
    const share = vi.fn().mockResolvedValue(undefined);
    const resolveUrl = (p: string) => `https://www.longlivets.com${p}`;
    const currentUrl = () => 'https://www.longlivets.com/privacy?item=old#frag';
    expect(await shareTarget(target, data, { share, resolveUrl, currentUrl })).toBe('native');
    expect(share.mock.calls[0]?.[0]).toMatchObject({ url: 'https://www.longlivets.com/privacy?item=interrupted-speech' });
    const root = vi.fn().mockResolvedValue(undefined);
    await shareTarget(target, data, { share: root, resolveUrl, currentUrl: () => 'https://www.longlivets.com/?era=x' });
    expect(root.mock.calls[0]?.[0]).toMatchObject({ url: 'https://www.longlivets.com?item=interrupted-speech' });
    const noLogical = vi.fn().mockResolvedValue(undefined);
    await shareTarget(target, data, { share: noLogical, resolveUrl });
    expect(JSON.stringify(noLogical.mock.calls[0]?.[0])).not.toContain('Bundle');
    expect(JSON.stringify(noLogical.mock.calls[0]?.[0])).not.toContain('ExponentExperienceData');
  });

  it('shareTarget without a host keeps the navigator.share path', async () => {
    expect(await shareTarget(target, data)).toBe('native');
    expect(navShare).toHaveBeenCalledTimes(1);
  });

  it('shareTarget copies via host.clipboard.writeText when no share is available', async () => {
    vi.stubGlobal('navigator', {});
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await shareTarget(target, data, { clipboard: { writeText } })).toBe('fallback');
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0]?.[0]).toMatch(/^null\?item=/);
  });

  it('shareTarget does not crash when window is unavailable', async () => {
    vi.stubGlobal('window', undefined);
    const share = vi.fn().mockResolvedValue(undefined);
    const resolveUrl = (p: string) => `https://www.longlivets.com${p}`;
    expect(await shareTarget(target, data, { share, resolveUrl })).toBe('native');
    expect(share.mock.calls[0]?.[0]).toMatchObject({ url: expect.stringContaining('https://www.longlivets.com?item=') });
  });

  it('shareCardImage with host.share + resolveUrl passes the card URL, no bytes', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const resolveUrl = (p: string) => `https://www.longlivets.com${p}`;
    expect(await shareCardImage(target, source, 'story', data, { share, resolveUrl })).toBe('native');
    const arg = share.mock.calls[0]?.[0] as { image?: { url: string } };
    expect(arg.image?.url).toMatch(/^https:\/\/www\.longlivets\.com\/api\/share-card\?.*size=story$/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shareCardImage reports copied only when the host says imageCopied', async () => {
    const resolveUrl = (p: string) => `https://www.longlivets.com${p}`;
    const yes = vi.fn().mockResolvedValue({ imageCopied: true });
    const no = vi.fn().mockResolvedValue({ imageCopied: false });
    expect(await shareCardImage(target, source, 'story', data, { share: yes, resolveUrl })).toBe('copied');
    expect(await shareCardImage(target, source, 'story', data, { share: no, resolveUrl })).toBe('native');
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
