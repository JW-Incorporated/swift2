import { describe, expect, it, vi } from 'vitest';
import {
  HOST_DENYLIST,
  buildPressCandidate,
  extFromUrl,
  extractPageImage,
  isAcceptableImageUrl,
  isOnTopicArticle,
  fetchPageImage,
  pressCandidateId,
  readCapped,
  resolveExtension,
  searchGnews,
  sourcePressPhotos,
} from './source-press-photos.mjs';

const article = (over: Record<string, unknown> = {}) => ({
  title: 'Taylor Swift lights up the stage',
  description: 'The singer performed',
  url: 'https://news.example.com/a1',
  image: 'https://cdn.example.com/lead-small.jpg',
  source: { name: 'Example News' },
  ...over,
});

const html = (head: string) => `<html><head>${head}</head><body></body></html>`;

function fakeFetch(routes: Record<string, () => Response | Promise<Response>>) {
  return vi.fn(async (url: string) => {
    const key = Object.keys(routes).find((k) => url.startsWith(k));
    if (!key) return new Response('nope', { status: 404 });
    return routes[key]();
  }) as unknown as typeof fetch;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('extractPageImage', () => {
  it('prefers og:image over twitter:image, either attribute order, and resolves relative URLs', () => {
    expect(
      extractPageImage(html('<meta name="twitter:image" content="https://t.example/t.jpg"><meta content="/img/og.jpg?a=1&amp;b=2" property="og:image">'), 'https://news.example.com/a1'),
    ).toBe('https://news.example.com/img/og.jpg?a=1&b=2');
  });
  it('falls back to twitter:image and returns null when neither exists', () => {
    expect(extractPageImage(html('<meta name="twitter:image" content="https://t.example/t.jpg">'), 'https://x.example/a')).toBe('https://t.example/t.jpg');
    expect(extractPageImage(html('<meta name="description" content="x">'), 'https://x.example/a')).toBeNull();
  });
});

describe('image URL filters', () => {
  it('denies watermark/comp stock hosts and subdomains', () => {
    for (const host of HOST_DENYLIST) expect(isAcceptableImageUrl(`https://media.${host}/p/x.jpg`)).toBe(false);
    expect(isAcceptableImageUrl('https://image.shutterstock.com/z/stock-photo-1.jpg')).toBe(false);
  });
  it('denies preview/logo/placeholder paths and non-http URLs, accepts a normal CDN photo', () => {
    expect(isAcceptableImageUrl('https://cdn.example.com/preview/x.jpg')).toBe(false);
    expect(isAcceptableImageUrl('https://cdn.example.com/site-logo.png')).toBe(false);
    expect(isAcceptableImageUrl('data:image/png;base64,AAAA')).toBe(false);
    expect(isAcceptableImageUrl('https://cdn.example.com/2026/10/taylor-swift-stage.jpg')).toBe(true);
  });
  it('maps extensions: jpg/png/webp accepted, gif/svg rejected, none -> null', () => {
    expect(extFromUrl('https://a.example/x.JPEG')).toBe('jpg');
    expect(extFromUrl('https://a.example/x.webp?w=1')).toBe('webp');
    expect(extFromUrl('https://a.example/x.gif')).toBe(false);
    expect(extFromUrl('https://a.example/image')).toBeNull();
  });
  it('asks the host for the content type when the path has no extension', async () => {
    const head = (type: string) => vi.fn(async () => new Response(null, { status: 200, headers: { 'content-type': type } })) as unknown as typeof fetch;
    expect(await resolveExtension('https://a.example/image', { fetchImpl: head('image/webp') })).toBe('webp');
    expect(await resolveExtension('https://a.example/image', { fetchImpl: head('image/avif') })).toBeNull();
    expect(await resolveExtension('https://a.example/x.gif', { fetchImpl: head('image/jpeg') })).toBeNull();
  });
});

describe('isOnTopicArticle', () => {
  it('requires Taylor Swift in the title or description', () => {
    expect(isOnTopicArticle(article())).toBe(true);
    expect(isOnTopicArticle(article({ title: 'Stocks rally', description: 'Taylor Swift fans buy' }))).toBe(true);
    expect(isOnTopicArticle(article({ title: 'Local news', description: 'A swift taylor shop' }))).toBe(false);
  });
});

describe('buildPressCandidate', () => {
  it('emits the importer shape with outlet credit, stable id and a pixel floor', () => {
    const c = buildPressCandidate(article(), 'https://cdn.example.com/a/lead.jpg?w=1', 'jpg')!;
    expect(c).toMatchObject({
      id: pressCandidateId('https://cdn.example.com/a/lead.jpg?w=2'),
      source: 'https://news.example.com/a1',
      sourceUrl: 'https://cdn.example.com/a/lead.jpg?w=1',
      credit: 'via Example News',
      tags: ['press-photo'],
      minLongEdge: 1080,
    });
    expect(c.mediaPath).toBe(`/social/library/photos/${c.id}.jpg`);
  });
  it('omits credit when the outlet is unknown and returns null for denied hosts or unknown extensions', () => {
    expect(buildPressCandidate(article({ source: undefined }), 'https://cdn.example.com/a.jpg', 'jpg')).not.toHaveProperty('credit');
    expect(buildPressCandidate(article(), 'https://media.gettyimages.com/a.jpg', 'jpg')).toBeNull();
    expect(buildPressCandidate(article(), 'https://cdn.example.com/a.jpg', null)).toBeNull();
  });
});

describe('searchGnews', () => {
  it('throws a quota-style error on 403/429 instead of returning garbage', async () => {
    await expect(searchGnews('q', 'k', { fetchImpl: fakeFetch({ 'https://gnews.io': () => json({}, 403) }) })).rejects.toThrow(/403/);
  });
});

describe('sourcePressPhotos', () => {
  const page = (og: string) => () => new Response(html(`<meta property="og:image" content="${og}">`), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
  const opts = { sleepImpl: async () => {}, now: Date.UTC(2026, 9, 7) };

  it('turns GNews JSON into candidates: og:image first, GNews image second, off-topic and denied hosts dropped', async () => {
    const warn = vi.fn();
    const fetchImpl = fakeFetch({
      'https://gnews.io': () =>
        json({
          articles: [
            article(),
            article({ url: 'https://news.example.com/off', title: 'Cat show', description: 'cats', image: 'https://cdn.example.com/cat.jpg' }),
            article({ url: 'https://news.example.com/getty', image: 'https://media.gettyimages.com/x.jpg' }),
          ],
        }),
      'https://news.example.com/a1': page('https://cdn.example.com/og-big.jpg'),
      'https://news.example.com/getty': page('https://media.gettyimages.com/og.jpg'),
    });
    const out = await sourcePressPhotos({ apiKey: 'k', maxRequests: 1, fetchImpl, warn, ...opts });
    expect(out.map((c: { sourceUrl: string }) => c.sourceUrl)).toEqual(['https://cdn.example.com/og-big.jpg', 'https://cdn.example.com/lead-small.jpg']);
    expect(warn).not.toHaveBeenCalled();
  });

  it('dedupes the same image across queries/outlets and spends at most maxRequests GNews calls', async () => {
    const fetchImpl = fakeFetch({
      'https://gnews.io': () => json({ articles: [article()] }),
      'https://news.example.com/a1': page('https://cdn.example.com/og-big.jpg'),
    });
    const out = await sourcePressPhotos({ apiKey: 'k', maxRequests: 2, fetchImpl, warn: vi.fn(), ...opts });
    expect(out).toHaveLength(2);
    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(([u]: [string]) => u.startsWith('https://gnews.io'));
    expect(calls).toHaveLength(2);
  });

  it('an expired/rejected key (401/403) logs ::error:: but still returns []', async () => {
    const warn = vi.fn();
    const out = await sourcePressPhotos({ apiKey: 'k', fetchImpl: fakeFetch({ 'https://gnews.io': () => json({ errors: ['quota'] }, 403) }), warn, ...opts });
    expect(out).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/::error::.*403/));
  });

  it('a 429 stays a warning', async () => {
    const warn = vi.fn();
    expect(await sourcePressPhotos({ apiKey: 'k', fetchImpl: fakeFetch({ 'https://gnews.io': () => json({}, 429) }), warn, ...opts })).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/::warning::.*429/));
  });

  it('a network failure also warns and returns []', async () => {
    const warn = vi.fn();
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNRESET');
    }) as unknown as typeof fetch;
    expect(await sourcePressPhotos({ apiKey: 'k', fetchImpl, warn, ...opts })).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/ECONNRESET/));
  });

  it('no API key warns and returns [] without any request', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const warn = vi.fn();
    expect(await sourcePressPhotos({ apiKey: '', fetchImpl, warn, ...opts })).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe('bounded page reads', () => {
  const oversized = (pulled: { n: number; cancelled: boolean }) =>
    new Response(
      new ReadableStream({
        pull(controller) {
          pulled.n += 1;
          controller.enqueue(new TextEncoder().encode('x'.repeat(100_000)));
        },
        cancel() {
          pulled.cancelled = true;
        },
      }),
      { headers: { 'content-type': 'text/html' } },
    );

  it('readCapped stops pulling and cancels the stream once the cap is reached', async () => {
    const pulled = { n: 0, cancelled: false };
    const text = await readCapped(oversized(pulled), 250_000);
    expect(text.length).toBe(250_000);
    expect(pulled.cancelled).toBe(true);
    expect(pulled.n).toBeLessThan(10);
  });

  it('fetchPageImage finds og:image in the first bytes of an endless page and skips non-HTML', async () => {
    const head = '<meta property="og:image" content="https://cdn.example.com/og.jpg">';
    const body = new ReadableStream({
      pull(controller) {
        controller.enqueue(new TextEncoder().encode(head + '<p>' + 'x'.repeat(200_000)));
      },
    });
    const page = vi.fn(async () => new Response(body, { headers: { 'content-type': 'text/html' } })) as unknown as typeof fetch;
    expect(await fetchPageImage('https://news.example.com/a', { fetchImpl: page })).toBe('https://cdn.example.com/og.jpg');
    const pdf = vi.fn(async () => new Response('%PDF', { headers: { 'content-type': 'application/pdf' } })) as unknown as typeof fetch;
    expect(await fetchPageImage('https://news.example.com/a', { fetchImpl: pdf })).toBeNull();
  });
});
