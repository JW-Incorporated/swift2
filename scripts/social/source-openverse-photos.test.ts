import { describe, expect, it, vi } from 'vitest';
import {
  PAGES_PER_QUERY,
  buildOpenverseCandidate,
  planRequests,
  sourceOpenversePhotos,
} from './source-openverse-photos.mjs';
import { candidateKeys } from './lib/photo-source-common.mjs';

const item = (over: Record<string, unknown> = {}) => ({
  id: 'abc-1',
  title: 'Taylor Swift Eras Tour Reputation Era',
  foreign_landing_url: 'https://www.flickr.com/photos/x/1',
  url: 'https://live.staticflickr.com/1/1_b.jpg',
  creator: 'Jane Doe',
  license: 'by',
  license_version: '2.0',
  provider: 'flickr',
  source: 'flickr',
  category: 'photograph',
  filetype: 'jpg',
  width: 1024,
  height: 683,
  tags: [{ name: 'concert' }],
  mature: false,
  ...over,
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('buildOpenverseCandidate', () => {
  it('maps an item to the importer shape with creator + license credit', () => {
    const c = buildOpenverseCandidate(item())!;
    expect(c).toMatchObject({
      id: 'openverse-abc-1',
      mediaPath: '/social/library/photos/openverse-abc-1.jpg',
      credit: 'Jane Doe (CC BY 2.0), via Openverse',
      source: 'https://www.flickr.com/photos/x/1',
      sourceUrl: 'https://live.staticflickr.com/1/1_b.jpg',
      minLongEdge: 800,
    });
    expect(c.tags).toEqual(['fan-photo', 'reputation']);
  });

  it('keeps only by / by-sa / cc0 / pdm', () => {
    for (const license of ['by', 'by-sa', 'cc0', 'pdm']) expect(buildOpenverseCandidate(item({ license }))).not.toBeNull();
    for (const license of ['by-nc', 'by-nd', 'by-nc-sa', 'nc-sampling+', undefined]) expect(buildOpenverseCandidate(item({ license }))).toBeNull();
  });

  it('drops small images, non-raster types, non-photographs, off-topic, mature and Wikimedia mirrors', () => {
    expect(buildOpenverseCandidate(item({ width: 640, height: 480 }))).toBeNull();
    expect(buildOpenverseCandidate(item({ filetype: 'gif' }))).toBeNull();
    expect(buildOpenverseCandidate(item({ category: 'illustration' }))).toBeNull();
    expect(buildOpenverseCandidate(item({ title: 'A cat', tags: [] }))).toBeNull();
    expect(buildOpenverseCandidate(item({ mature: true }))).toBeNull();
    expect(buildOpenverseCandidate(item({ provider: 'wikimedia', source: 'wikimedia' }))).toBeNull();
  });

  it('never ingests AI-generated images (hard bar)', () => {
    expect(buildOpenverseCandidate(item({ title: 'I said I want it in the style of Taylor Swift!', tags: [{ name: 'ai' }, { name: 'aigenerated' }] }))).toBeNull();
    expect(buildOpenverseCandidate(item({ title: 'Taylor Swift Midjourney portrait' }))).toBeNull();
  });

  it('drops known AI-art hosts, AI tags (any case) and items with no title and no tags', () => {
    expect(buildOpenverseCandidate(item({ provider: 'rawpixel', source: 'rawpixel' }))).toBeNull();
    expect(buildOpenverseCandidate(item({ provider: 'WordPress', source: 'wordpress' }))).toBeNull();
    for (const name of ['AI', 'AI-Generated', 'Midjourney', 'Stable Diffusion', 'DALL-E']) {
      expect(buildOpenverseCandidate(item({ tags: [{ name }] }))).toBeNull();
    }
    expect(buildOpenverseCandidate(item({ title: '', tags: [] }))).toBeNull();
    expect(buildOpenverseCandidate(item({ title: '  ', tags: [] }))).toBeNull();
  });

  it('uses the provider as credit when the creator is missing', () => {
    expect(buildOpenverseCandidate(item({ creator: null }))!.credit).toBe('flickr (CC BY 2.0), via Openverse');
  });
});

describe('planRequests', () => {
  it('returns maxRequests (query, page) pairs and advances with the day, wrapping', () => {
    const queries = ['a', 'b'];
    const day0 = planRequests(queries, 6, 0);
    const day1 = planRequests(queries, 6, 86_400_000);
    expect(day0).toHaveLength(6);
    expect(day0[0]).toEqual({ query: 'a', page: 1 });
    expect(day1[0]).toEqual({ query: 'a', page: 7 });
    expect(planRequests(queries, 6, 86_400_000 * 4)[0]).toEqual({ query: 'a', page: 1 });
    expect(PAGES_PER_QUERY * queries.length).toBe(24);
  });
});

describe('sourceOpenversePhotos', () => {
  const base = { queries: ['Taylor Swift'], maxRequests: 3, sleepImpl: async () => {}, now: 0 };

  it('merges pages serially and dedupes against excluded (Wikimedia) keys', async () => {
    const pages = [
      { results: [item({ id: 'a' }), item({ id: 'b', url: 'https://upload.wikimedia.org/x/Taylor.jpg', foreign_landing_url: 'https://www.flickr.com/photos/x/9' })] },
      { results: [item({ id: 'a' }), item({ id: 'c', foreign_landing_url: 'https://commons.wikimedia.org/wiki/File:Taylor.jpg', url: 'https://live.staticflickr.com/c.jpg' })] },
      { results: [] },
    ];
    const fetchImpl = vi.fn(async () => json(pages.shift())) as unknown as typeof fetch;
    const excludeKeys = candidateKeys([
      { id: 'wikimedia-1', source: 'https://commons.wikimedia.org/wiki/File:Taylor.jpg', sourceUrl: 'https://upload.wikimedia.org/x/Taylor.jpg' },
    ]);
    const out = await sourceOpenversePhotos({ ...base, fetchImpl, excludeKeys, warn: vi.fn() });
    expect(out.map((c: { id: string }) => c.id)).toEqual(['openverse-a']);
  });

  it('429 warns, stops requesting and keeps what it had', async () => {
    const responses = [json({ results: [item({ id: 'a' })] }), json({ detail: 'throttled' }, 429), json({ results: [item({ id: 'z' })] })];
    const fetchImpl = vi.fn(async () => responses.shift()!) as unknown as typeof fetch;
    const warn = vi.fn();
    const out = await sourceOpenversePhotos({ ...base, fetchImpl, warn });
    expect(out.map((c: { id: string }) => c.id)).toEqual(['openverse-a']);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/::warning::.*429/));
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(2);
  });

  it('a network failure or 5xx warns and yields [] rather than throwing', async () => {
    const warn = vi.fn();
    const down = vi.fn(async () => {
      throw new Error('ENOTFOUND');
    }) as unknown as typeof fetch;
    expect(await sourceOpenversePhotos({ ...base, fetchImpl: down, warn })).toEqual([]);
    const boom = vi.fn(async () => json({}, 503)) as unknown as typeof fetch;
    expect(await sourceOpenversePhotos({ ...base, fetchImpl: boom, warn })).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });
});
