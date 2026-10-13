// Card 2: bounded, fail-soft article-text fetch for the extract stage's top
// 1-3 publisher sources. Every test below asserts the "never throws, never
// hangs the caller" contract — same discipline as resolve-google-news.test.ts.

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_ARTICLE_SOURCES,
  MAX_CHARS_PER_ARTICLE,
  fetchArticleText,
  fetchTopArticleTexts,
  stripHtml,
} from './fetch-article-text';

function htmlResponse(html: string, opts: { ok?: boolean; status?: number; contentType?: string } = {}) {
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    headers: { get: (name: string) => (name === 'content-type' ? (opts.contentType ?? 'text/html; charset=utf-8') : null) },
    text: async () => html,
  } as unknown as Response;
}

function robotsAllowAll() {
  return { ok: false } as unknown as Response; // non-OK robots.txt -> fail open
}

describe('stripHtml', () => {
  it('removes script/style blocks and tags, decodes entities, collapses whitespace', () => {
    const html = `<html><head><style>.a{color:red}</style></head><body>
      <script>trackStuff();</script>
      <h1>Taylor announces   new single</h1>
      <p>She said it&#39;s &quot;a surprise&quot; &amp; fans are thrilled.</p>
    </body></html>`;
    const text = stripHtml(html);
    expect(text).not.toContain('trackStuff');
    expect(text).not.toContain('color:red');
    expect(text).toContain('Taylor announces new single');
    expect(text).toContain(`a surprise" & fans are thrilled`);
  });

  it('strips html comments', () => {
    expect(stripHtml('<p>Real text<!-- hidden note --></p>')).toBe('Real text');
  });
});

describe('fetchArticleText', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns stripped body text on a normal HTML page', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(robotsAllowAll())
      .mockResolvedValueOnce(htmlResponse('<p>Taylor performed a surprise song tonight in Nashville.</p>'));
    const text = await fetchArticleText('https://example.com/article', fetchImpl);
    expect(text).toContain('Taylor performed a surprise song tonight in Nashville.');
  });

  it('caps article text at MAX_CHARS_PER_ARTICLE', async () => {
    const longBody = `<p>${'word '.repeat(5000)}</p>`;
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(robotsAllowAll())
      .mockResolvedValueOnce(htmlResponse(longBody));
    const text = await fetchArticleText('https://example.com/long', fetchImpl);
    expect(text).not.toBeNull();
    expect(text!.length).toBeLessThanOrEqual(MAX_CHARS_PER_ARTICLE);
  });

  it('returns null, never throws, on a network error', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('ECONNRESET'));
    await expect(fetchArticleText('https://example.com/down', fetchImpl)).resolves.toBeNull();
  });

  it('returns null on a non-OK status', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(robotsAllowAll())
      .mockResolvedValueOnce(htmlResponse('<p>paywalled</p>', { ok: false, status: 403 }));
    const text = await fetchArticleText('https://example.com/paywalled', fetchImpl);
    expect(text).toBeNull();
  });

  it('returns null for a non-HTML content type', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(robotsAllowAll())
      .mockResolvedValueOnce(htmlResponse('{}', { contentType: 'application/json' }));
    const text = await fetchArticleText('https://example.com/api', fetchImpl);
    expect(text).toBeNull();
  });

  it('returns null when robots.txt explicitly disallows all crawling', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => 'User-agent: *\nDisallow: /\n',
    } as unknown as Response);
    const text = await fetchArticleText('https://example.com/blocked', fetchImpl);
    expect(text).toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(1); // never fetched the article itself
  });

  it('fails open (fetches the article) when robots.txt itself cannot be fetched', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error('robots unreachable'))
      .mockResolvedValueOnce(htmlResponse('<p>Still fetched despite robots.txt failing.</p>'));
    const text = await fetchArticleText('https://example.com/ok', fetchImpl);
    expect(text).toContain('Still fetched despite robots.txt failing.');
  });
});

describe('fetchTopArticleTexts', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('fetches only the top MAX_ARTICLE_SOURCES sources, best tier first', async () => {
    const fetchImpl = vi.fn().mockImplementation(async (url: string) => {
      if (String(url).endsWith('robots.txt')) return robotsAllowAll();
      return htmlResponse(`<p>Body for ${url}</p>`);
    });
    const sources = [
      { url: 'https://fan-blog.example/a', tier: 'fan' as const, outletName: 'Fan Blog' },
      { url: 'https://official.example/b', tier: 'official' as const, outletName: 'Official' },
      { url: 'https://unverified.example/c', tier: 'unverified' as const },
      { url: 'https://established.example/d', tier: 'established' as const, outletName: 'Established Outlet' },
      { url: 'https://established2.example/e', tier: 'established' as const },
    ];
    const results = await fetchTopArticleTexts(sources, fetchImpl);
    expect(results.length).toBeLessThanOrEqual(MAX_ARTICLE_SOURCES);
    expect(results[0]?.url).toBe('https://official.example/b');
    expect(results.map((r) => r.url)).not.toContain('https://unverified.example/c');
  });

  it('omits a failing source without dropping the others', async () => {
    const fetchImpl = vi.fn().mockImplementation(async (url: string) => {
      if (String(url).endsWith('robots.txt')) return robotsAllowAll();
      if (String(url).includes('down')) throw new Error('timeout');
      return htmlResponse(`<p>Body for ${url}</p>`);
    });
    const sources = [
      { url: 'https://down.example/a', tier: 'official' as const },
      { url: 'https://ok.example/b', tier: 'established' as const },
    ];
    const results = await fetchTopArticleTexts(sources, fetchImpl);
    expect(results).toHaveLength(1);
    expect(results[0]?.url).toBe('https://ok.example/b');
  });

  it('returns an empty array, never throws, when given no sources', async () => {
    await expect(fetchTopArticleTexts([], vi.fn())).resolves.toEqual([]);
  });
});
