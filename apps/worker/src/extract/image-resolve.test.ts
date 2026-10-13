import { describe, expect, it, vi } from 'vitest';
import {
  bestSourceForImage,
  extractPageImage,
  fetchPageImage,
  isAllowedImageHost,
  resolveFallbackImage,
  resolveImageUrl,
} from './image-resolve';
import type { ClusterSource } from './write-knowledge';

describe('isAllowedImageHost', () => {
  it('accepts a host on CONFIG.hostAllowlist', () => {
    expect(isAllowedImageHost('https://www.billboard.com/photo.jpg')).toBe(true);
  });

  it('accepts a host on PHOTO_HOST_LEGACY (the grandfathered set)', () => {
    expect(isAllowedImageHost('https://storage.googleapis.com/some/bucket/photo.jpg')).toBe(true);
  });

  it('rejects a host on neither list', () => {
    expect(isAllowedImageHost('https://evil-cdn.example.com/photo.jpg')).toBe(false);
  });

  it('rejects an unparseable URL', () => {
    expect(isAllowedImageHost('not a url')).toBe(false);
  });
});

describe('extractPageImage', () => {
  it('prefers og:image over twitter:image', () => {
    const html =
      '<meta name="twitter:image" content="https://t.example/t.jpg"><meta content="https://og.example/og.jpg" property="og:image">';
    expect(extractPageImage(html, 'https://news.example.com/a1')).toBe('https://og.example/og.jpg');
  });

  it('falls back to twitter:image when og:image is absent', () => {
    const html = '<meta name="twitter:image" content="https://t.example/t.jpg">';
    expect(extractPageImage(html, 'https://news.example.com/a1')).toBe('https://t.example/t.jpg');
  });

  it('resolves a relative image URL against the page URL', () => {
    const html = '<meta property="og:image" content="/img/og.jpg?a=1&amp;b=2">';
    expect(extractPageImage(html, 'https://news.example.com/a1')).toBe(
      'https://news.example.com/img/og.jpg?a=1&b=2',
    );
  });

  it('returns null when neither tag exists', () => {
    expect(extractPageImage('<meta property="og:title" content="X">', 'https://news.example.com/a1')).toBeNull();
  });
});

function htmlResponse(html: string): Response {
  return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

describe('fetchPageImage', () => {
  it('returns the og:image found in the page', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      htmlResponse('<meta property="og:image" content="https://cdn.example.com/og.jpg">'),
    );
    const image = await fetchPageImage('https://news.example.com/a1', fetchImpl as unknown as typeof fetch);
    expect(image).toBe('https://cdn.example.com/og.jpg');
  });

  it('returns null on a non-OK response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
    expect(await fetchPageImage('https://news.example.com/a1', fetchImpl as unknown as typeof fetch)).toBeNull();
  });

  it('returns null on a non-HTML response', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
    expect(await fetchPageImage('https://news.example.com/a1', fetchImpl as unknown as typeof fetch)).toBeNull();
  });

  it('returns null (never throws) on a network failure', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'));
    await expect(
      fetchPageImage('https://news.example.com/a1', fetchImpl as unknown as typeof fetch),
    ).resolves.toBeNull();
  });
});

const sources: ClusterSource[] = [
  { outletName: 'Fan Blog', url: 'https://fanblog.example/x', tier: 'fan' },
  { outletName: 'Billboard', url: 'https://www.billboard.com/x', tier: 'established' },
  { outletName: 'Official', url: 'https://taylorswift.com/x', tier: 'official' },
];

describe('bestSourceForImage', () => {
  it('picks the highest-tier source', () => {
    expect(bestSourceForImage(sources)?.outletName).toBe('Official');
  });

  it('never picks a news.google redirect', () => {
    const onlyGoogle: ClusterSource[] = [
      { outletName: 'Google News', url: 'https://news.google.com/rss/articles/abc', tier: 'official' },
    ];
    expect(bestSourceForImage(onlyGoogle)).toBeUndefined();
  });

  it('returns undefined for an empty source list', () => {
    expect(bestSourceForImage([])).toBeUndefined();
  });
});

describe('resolveFallbackImage', () => {
  it('fetches the best source and returns its allowlisted og:image', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      htmlResponse('<meta property="og:image" content="https://www.billboard.com/wp-content/og.jpg">'),
    );
    const image = await resolveFallbackImage(sources, fetchImpl as unknown as typeof fetch);
    expect(image).toBe('https://www.billboard.com/wp-content/og.jpg');
    expect(fetchImpl).toHaveBeenCalledWith('https://taylorswift.com/x', expect.anything());
  });

  it('rejects an og:image from a disallowed host', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      htmlResponse('<meta property="og:image" content="https://evil-cdn.example.com/og.jpg">'),
    );
    expect(await resolveFallbackImage(sources, fetchImpl as unknown as typeof fetch)).toBeUndefined();
  });

  it('returns undefined when there are no sources', async () => {
    const fetchImpl = vi.fn();
    expect(await resolveFallbackImage([], fetchImpl as unknown as typeof fetch)).toBeUndefined();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('resolveImageUrl', () => {
  it('prefers the story top_image_url when it is allowlisted', async () => {
    const fetchImpl = vi.fn();
    const image = await resolveImageUrl(
      'https://www.billboard.com/top.jpg',
      sources,
      fetchImpl as unknown as typeof fetch,
    );
    expect(image).toBe('https://www.billboard.com/top.jpg');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('falls back to og:image when top_image_url is on a disallowed host', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      htmlResponse('<meta property="og:image" content="https://www.billboard.com/og.jpg">'),
    );
    const image = await resolveImageUrl(
      'https://evil-cdn.example.com/top.jpg',
      sources,
      fetchImpl as unknown as typeof fetch,
    );
    expect(image).toBe('https://www.billboard.com/og.jpg');
  });

  it('falls back to og:image when there is no top_image_url', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      htmlResponse('<meta property="og:image" content="https://www.billboard.com/og.jpg">'),
    );
    const image = await resolveImageUrl(null, sources, fetchImpl as unknown as typeof fetch);
    expect(image).toBe('https://www.billboard.com/og.jpg');
  });

  it('resolves to undefined when nothing yields an allowlisted image', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('', { status: 500 }));
    expect(await resolveImageUrl(undefined, sources, fetchImpl as unknown as typeof fetch)).toBeUndefined();
  });
});
