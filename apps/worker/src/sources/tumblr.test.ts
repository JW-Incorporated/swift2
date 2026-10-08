import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fetchTumblrTag, fetchTumblrBlogPosts, tumblrAdapter } from './tumblr';
import type { NewsSourceRow } from './types';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

const TAG_POST = {
  id: 123456789,
  post_url: 'https://someswiftie.tumblr.com/post/123456789/theory',
  title: 'a new theory',
  summary: 'lots of clowning happening today',
  blog_name: 'someswiftie',
  timestamp: 1756000000,
};

describe('fetchTumblrTag', () => {
  it('normalizes a tagged post: permalink, hashed blog_name, ISO timestamp', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ response: [TAG_POST] }));
    const items = await fetchTumblrTag('taylor swift theory', 'test-key', fetchImpl);
    expect(items).toHaveLength(1);
    const item = items[0]!;
    expect(item.externalId).toBe('123456789');
    expect(item.url).toBe(TAG_POST.post_url);
    expect(item.title).toBe('a new theory');
    expect(item.author).not.toBe('someswiftie');
    expect(item.author).toMatch(/^[0-9a-f]{16}$/);
    expect(item.publishedAt).toBe(new Date(TAG_POST.timestamp * 1000).toISOString());
  });

  it('falls back to a truncated summary as the title when the post has none', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ response: [{ ...TAG_POST, title: null }] }));
    const items = await fetchTumblrTag('easter egg', 'test-key', fetchImpl);
    expect(items[0]!.title).toBe('lots of clowning happening today');
  });

  it('drops posts missing a post_url or id', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ response: [{ title: 'no url or id' }] }));
    const items = await fetchTumblrTag('taylor swift', 'test-key', fetchImpl);
    expect(items).toEqual([]);
  });

  it('throws with the real endpoint-exists 401 shape when the key is rejected', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({}, false, 401));
    await expect(fetchTumblrTag('taylor swift', 'bad-key', fetchImpl)).rejects.toThrow(/401/);
  });
});

describe('fetchTumblrBlogPosts', () => {
  it('reads the nested response.posts shape (different from the tagged endpoint)', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ response: { posts: [TAG_POST], blog: { name: 'taylorswift' } } }));
    const items = await fetchTumblrBlogPosts('taylorswift.tumblr.com', 'test-key', fetchImpl);
    expect(items).toHaveLength(1);
    expect(items[0]!.url).toBe(TAG_POST.post_url);
  });
});

describe('tumblrAdapter', () => {
  beforeEach(() => {
    vi.stubEnv('TUMBLR_CONSUMER_API_KEY', 'env-key');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns empty (no throw) when no key is configured', async () => {
    vi.unstubAllEnvs();
    const source: NewsSourceRow = {
      id: '1',
      name: 'Tumblr tag',
      sourceType: 'tumblr',
      config: { tag: 'taylor swift' },
    };
    await expect(tumblrAdapter.fetch(source)).resolves.toEqual([]);
  });

  it('throws a descriptive error when tag mode is missing config.tag', async () => {
    const source: NewsSourceRow = { id: '1', name: 'Tumblr tag', sourceType: 'tumblr', config: {} };
    await expect(tumblrAdapter.fetch(source)).rejects.toThrow(/config\.tag/);
  });

  it('throws a descriptive error when blog mode is missing config.blogIdentifier', async () => {
    const source: NewsSourceRow = {
      id: '1',
      name: 'Tumblr blog',
      sourceType: 'tumblr',
      config: { mode: 'blog' },
    };
    await expect(tumblrAdapter.fetch(source)).rejects.toThrow(/config\.blogIdentifier/);
  });
});
