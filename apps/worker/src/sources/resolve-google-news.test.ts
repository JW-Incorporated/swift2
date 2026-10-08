import { describe, expect, it, vi } from 'vitest';
import type { NormalizedNewsItem } from '@swift2/shared/news';
import { resolveGoogleNewsItem, resolveGoogleNewsUrl } from './resolve-google-news';

const GOOGLE_URL = 'https://news.google.com/rss/articles/CBMiXkFVX3lxTFB1cXhkOA';

/** Minimal Response-shaped fake — only `.url` and `.body.cancel` are read. */
function fakeResponse(finalUrl: string): Response {
  return {
    url: finalUrl,
    body: { cancel: async () => {} },
  } as unknown as Response;
}

describe('resolveGoogleNewsUrl', () => {
  it('returns null immediately for a non-Google-News URL, without calling fetch', async () => {
    const fetchImpl = vi.fn();
    const result = await resolveGoogleNewsUrl('https://www.forbes.com/some-article', fetchImpl);
    expect(result).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('resolves via HEAD when the origin follows the redirect', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(fakeResponse('https://www.forbes.com/sites/x/taylor-swift-story/'));
    const result = await resolveGoogleNewsUrl(GOOGLE_URL, fetchImpl);
    expect(result).toEqual({ url: 'https://www.forbes.com/sites/x/taylor-swift-story/', domain: 'forbes.com' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenNthCalledWith(1, GOOGLE_URL, expect.objectContaining({ method: 'HEAD' }));
  });

  it('falls back to GET when HEAD throws', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error('HEAD not supported'))
      .mockResolvedValueOnce(fakeResponse('https://variety.com/some-article/'));
    const result = await resolveGoogleNewsUrl(GOOGLE_URL, fetchImpl);
    expect(result).toEqual({ url: 'https://variety.com/some-article/', domain: 'variety.com' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl).toHaveBeenNthCalledWith(2, GOOGLE_URL, expect.objectContaining({ method: 'GET' }));
  });

  it('returns null when both HEAD and GET fail — never throws', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('network error'));
    await expect(resolveGoogleNewsUrl(GOOGLE_URL, fetchImpl)).resolves.toBeNull();
  });

  it('returns null when the response never actually redirects', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(fakeResponse(GOOGLE_URL))
      .mockResolvedValueOnce(fakeResponse(GOOGLE_URL));
    const result = await resolveGoogleNewsUrl(GOOGLE_URL, fetchImpl);
    expect(result).toBeNull();
  });
});

describe('resolveGoogleNewsItem', () => {
  const baseItem: NormalizedNewsItem = {
    externalId: 'abc',
    url: GOOGLE_URL,
    title: 'Some headline',
    snippet: 'Some snippet',
  };

  it('re-tiers to established and rewrites url/publisher when resolved to a known outlet', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(fakeResponse('https://www.billboard.com/music/taylor-swift-story/'));
    const result = await resolveGoogleNewsItem(baseItem, fetchImpl);
    expect(result.resolvedTier).toBe('established');
    expect(result.publisher).toBe('Billboard');
    expect(result.url).toBe('https://www.billboard.com/music/taylor-swift-story/');
    expect(result.publisherUrl).toBe('https://billboard.com');
  });

  it('stays unverified when resolved to a domain with no tier-map entry', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(fakeResponse('https://some-random-blog.example.com/post'));
    const result = await resolveGoogleNewsItem(baseItem, fetchImpl);
    expect(result.resolvedTier).toBe('unverified');
    // Still attributable to the resolved link, just not a trusted outlet.
    expect(result.url).toBe('https://some-random-blog.example.com/post');
    expect(result.publisher).toBeUndefined();
  });

  it('stays unverified and keeps the original opaque url when resolution fails entirely', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('timeout'));
    const result = await resolveGoogleNewsItem(baseItem, fetchImpl);
    expect(result.resolvedTier).toBe('unverified');
    expect(result.url).toBe(GOOGLE_URL);
    expect(result.publisher).toBeUndefined();
  });
});
