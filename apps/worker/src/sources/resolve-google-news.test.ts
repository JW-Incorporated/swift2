import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NormalizedNewsItem } from '@swift2/shared/news';
import {
  decodeLegacyArticleId,
  parseBatchExecuteResponse,
  resolveGoogleNewsItem,
  resolveGoogleNewsUrl,
  resolveSourceUrls,
} from './resolve-google-news';
import { resetRunStats, runStats } from '../run-stats';

const NEW_ID = 'AU_yqLPuqxd8opaque';
const GOOGLE_URL = `https://news.google.com/rss/articles/${NEW_ID}`;

beforeEach(() => resetRunStats());

function b64url(bytes: Buffer): string {
  return bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function legacyId(url: string): string {
  return b64url(
    Buffer.concat([
      Buffer.from([0x08, 0x13, 0x22, url.length]),
      Buffer.from(url, 'latin1'),
      Buffer.from([0xd2, 0x01, 0x00]),
    ]),
  );
}

/** Minimal Response-shaped fake for the redirect path. */
function redirectResponse(finalUrl: string): Response {
  return { url: finalUrl, ok: true, body: { cancel: async () => {} } } as unknown as Response;
}

function batchResponse(publisherUrl: string): string {
  const payload = JSON.stringify(['garturlres', publisherUrl, 1]);
  return `)]}'\n\n${JSON.stringify([['wrb.fr', 'Fbv4je', payload, null, null, null, 'generic'], ['di', 7]])}`;
}

const PAGE = '<c-wiz><div data-n-a-id="x" data-n-a-sg="SIG123" data-n-a-ts="1700000000"></div></c-wiz>';

/** Routes by URL/method so call order does not matter. */
function routedFetch(opts: { page?: string; batch?: string; redirectTo?: string }) {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url.includes('batchexecute')) {
      return new Response(opts.batch ?? '', { status: opts.batch ? 200 : 500 });
    }
    if (init?.method === 'HEAD' || init?.method === 'GET') {
      return redirectResponse(opts.redirectTo ?? url);
    }
    return new Response(opts.page ?? '', { status: opts.page ? 200 : 404 });
  }) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}

describe('decodeLegacyArticleId', () => {
  it('extracts the embedded publisher URL from an old-format id', () => {
    const url = 'https://www.forbes.com/sites/x/taylor-swift-story/';
    expect(decodeLegacyArticleId(legacyId(url))).toBe(url);
  });

  it('returns null for an opaque new-format id', () => {
    expect(decodeLegacyArticleId(NEW_ID)).toBeNull();
  });
});

describe('parseBatchExecuteResponse', () => {
  it('parses the publisher URL out of the framed response', () => {
    expect(parseBatchExecuteResponse(batchResponse('https://variety.com/a/'))).toBe('https://variety.com/a/');
  });

  it('returns null on garbage', () => {
    expect(parseBatchExecuteResponse('nope')).toBeNull();
  });
});

describe('resolveGoogleNewsUrl', () => {
  it('returns null immediately for a non-Google-News URL, without calling fetch', async () => {
    const fetchImpl = vi.fn();
    expect(await resolveGoogleNewsUrl('https://www.forbes.com/some-article', fetchImpl)).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('decodes an old-format id without any network call', async () => {
    const url = 'https://www.billboard.com/music/story/';
    const fetchImpl = vi.fn();
    const result = await resolveGoogleNewsUrl(
      `https://news.google.com/rss/articles/${legacyId(url)}?oc=5`,
      fetchImpl,
    );
    expect(result).toEqual({ url, domain: 'billboard.com' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(runStats.gnewsResolved).toBe(1);
  });

  it('resolves a new-format id through the signed batchexecute flow', async () => {
    const fetchImpl = routedFetch({ page: PAGE, batch: batchResponse('https://variety.com/a/') });
    const result = await resolveGoogleNewsUrl(GOOGLE_URL, fetchImpl);
    expect(result).toEqual({ url: 'https://variety.com/a/', domain: 'variety.com' });
    const post = fetchImpl.mock.calls.find(([u]) => String(u).includes('batchexecute'))!;
    const body = decodeURIComponent(String((post[1] as RequestInit).body).replace('f.req=', ''));
    expect(body).toContain('Fbv4je');
    expect(body).toContain('SIG123');
    expect(body).toContain('1700000000');
    expect(body).toContain(NEW_ID);
  });

  it('falls through to the redirect when the page has no signature, then resolves', async () => {
    const fetchImpl = routedFetch({ page: '<html></html>', redirectTo: 'https://variety.com/r/' });
    const result = await resolveGoogleNewsUrl(GOOGLE_URL, fetchImpl);
    expect(result).toEqual({ url: 'https://variety.com/r/', domain: 'variety.com' });
  });

  it('returns null and counts unresolved when nothing redirects (final URL unchanged)', async () => {
    const fetchImpl = routedFetch({ page: PAGE });
    expect(await resolveGoogleNewsUrl(GOOGLE_URL, fetchImpl)).toBeNull();
    expect(runStats.gnewsUnresolved).toBe(1);
  });

  it('never throws when every fetch rejects', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network error'));
    await expect(resolveGoogleNewsUrl(GOOGLE_URL, fetchImpl)).resolves.toBeNull();
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
    const fetchImpl = routedFetch({ redirectTo: 'https://www.billboard.com/music/taylor-swift-story/' });
    const result = await resolveGoogleNewsItem(baseItem, fetchImpl);
    expect(result.resolvedTier).toBe('established');
    expect(result.publisher).toBe('Billboard');
    expect(result.url).toBe('https://www.billboard.com/music/taylor-swift-story/');
    expect(result.publisherUrl).toBe('https://billboard.com');
  });

  it('stays unverified when resolved to a domain with no tier-map entry', async () => {
    const fetchImpl = routedFetch({ redirectTo: 'https://some-random-blog.example.com/post' });
    const result = await resolveGoogleNewsItem(baseItem, fetchImpl);
    expect(result.resolvedTier).toBe('unverified');
    expect(result.url).toBe('https://some-random-blog.example.com/post');
    expect(result.publisher).toBeUndefined();
  });

  it('stays unverified and keeps the original opaque url when resolution fails entirely', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('timeout'));
    const result = await resolveGoogleNewsItem(baseItem, fetchImpl);
    expect(result.resolvedTier).toBe('unverified');
    expect(result.url).toBe(GOOGLE_URL);
  });
});

describe('resolveSourceUrls', () => {
  it('rewrites and re-tiers Google News sources, leaving publisher sources alone', async () => {
    const fetchImpl = routedFetch({ page: PAGE, batch: batchResponse('https://www.billboard.com/x/') });
    const { sources, changed } = await resolveSourceUrls(
      [
        { outletName: 'unknown', url: GOOGLE_URL, tier: 'unverified' as const },
        { outletName: 'Fan', url: 'https://fan.example/p', tier: 'fan' as const },
      ],
      fetchImpl,
    );
    expect(sources[0]).toMatchObject({ url: 'https://www.billboard.com/x/', tier: 'established' });
    expect(sources[1]!.url).toBe('https://fan.example/p');
    expect(changed).toEqual([{ from: GOOGLE_URL, to: 'https://www.billboard.com/x/', tier: 'established' }]);
  });
});
