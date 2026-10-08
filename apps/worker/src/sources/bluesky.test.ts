import { describe, expect, it, vi } from 'vitest';
import { blueskyAdapter, fetchBlueskyPosts } from './bluesky';
import type { NewsSourceRow } from './types';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

const REAL_POST = {
  uri: 'at://did:plc:abc123/app.bsky.feed.post/3lz9x',
  author: { handle: 'someswiftie.bsky.social' },
  record: {
    text: 'the clowning today is unreal, easter eggs everywhere',
    createdAt: '2026-08-24T04:23:26.000Z',
  },
  indexedAt: '2026-08-24T04:23:30.000Z',
};

describe('fetchBlueskyPosts', () => {
  it('normalizes a real-shaped post: permalink, hashed author, truncated snippet', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ posts: [REAL_POST] }));
    const items = await fetchBlueskyPosts('taylor swift', fetchImpl);
    expect(items).toHaveLength(1);
    const item = items[0]!;
    expect(item.externalId).toBe(REAL_POST.uri);
    expect(item.url).toBe('https://bsky.app/profile/someswiftie.bsky.social/post/3lz9x');
    expect(item.author).not.toBe('someswiftie.bsky.social');
    expect(item.author).toMatch(/^[0-9a-f]{16}$/);
    expect(item.snippet).toBe(REAL_POST.record.text);
    expect(item.publishedAt).toBe(REAL_POST.record.createdAt);
  });

  it('truncates a long post to an 80-char title with an ellipsis', async () => {
    const longText = 'a'.repeat(200);
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        posts: [{ ...REAL_POST, record: { text: longText, createdAt: REAL_POST.record.createdAt } }],
      }),
    );
    const items = await fetchBlueskyPosts('easter egg', fetchImpl);
    expect(items[0]!.title.length).toBe(80);
    expect(items[0]!.title.endsWith('...')).toBe(true);
  });

  it('drops posts missing a uri, handle, or text rather than throwing', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        posts: [
          { author: { handle: 'x.bsky.social' }, record: { text: 'no uri' } },
          { uri: 'at://did:plc:x/app.bsky.feed.post/1', record: { text: 'no author' } },
          { uri: 'at://did:plc:x/app.bsky.feed.post/2', author: { handle: 'y.bsky.social' } },
        ],
      }),
    );
    const items = await fetchBlueskyPosts('clowning', fetchImpl);
    expect(items).toEqual([]);
  });

  it('fails soft (empty array, no throw) on a non-2xx response — real 403 observed 2026-08-24', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({}, false, 403));
    await expect(fetchBlueskyPosts('taylor swift', fetchImpl)).resolves.toEqual([]);
  });

  it('caps at 30 items even when the feed returns more', async () => {
    const posts = Array.from({ length: 45 }, (_, i) => ({
      uri: `at://did:plc:x/app.bsky.feed.post/${i}`,
      author: { handle: `fan${i}.bsky.social` },
      record: { text: `post ${i}`, createdAt: '2026-08-24T00:00:00.000Z' },
    }));
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ posts }));
    const items = await fetchBlueskyPosts('taylor swift', fetchImpl);
    expect(items).toHaveLength(30);
  });
});

describe('blueskyAdapter', () => {
  it('throws a descriptive error when config.query is missing', async () => {
    const source: NewsSourceRow = { id: '1', name: 'Bluesky search', sourceType: 'bluesky', config: {} };
    await expect(blueskyAdapter.fetch(source)).rejects.toThrow(/config\.query/);
  });
});
