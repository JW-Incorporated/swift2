// Synthetic fixtures only — every name and text below is invented.
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { commentSummary, normalizeComments, storeComments } from './fb-comments.mjs';

const payload = () => [
  {
    postKey: 'pos:1',
    postUrl: 'https://www.facebook.com/groups/1/posts/11/',
    comments: [
      {
        id: '101',
        author: '  Test Fan A ',
        text: '  Synthetic comment one  ',
        ts: '2d',
        reactions: 4,
        replies: [
          { id: '201', author: 'Test Fan B', text: 'Synthetic reply', ts: null, reactions: '2' },
          { id: '101', author: 'Dup', text: 'dup id', ts: null, reactions: 0 },
          { id: '202', author: 'Test Fan C', text: '   ', ts: null, reactions: 0 },
        ],
      },
      { id: 102, author: 'Test Fan D', text: 'Synthetic two', ts: '1h', reactions: -3 },
      { id: '', author: 'x', text: 'no id' },
      'not-an-object',
      { id: '101', author: 'Dup', text: 'dup', ts: null, reactions: 0 },
    ],
  },
  { postKey: 'pos:1', postUrl: null, comments: [{ id: '9', author: 'a', text: 'dup post' }] },
  {
    postKey: 'pos:2',
    postUrl: 'javascript:alert(1)',
    comments: [{ id: '1', text: 'Synthetic', author: 'a' }],
  },
  { postKey: 'pos:3', postUrl: null, comments: [] },
  { postKey: '', comments: [{ id: '1', text: 'x' }] },
  null,
  { postKey: 'pos:4' },
];

describe('normalizeComments', () => {
  it('validates, trims, dedupes and drops malformed entries', () => {
    const posts = normalizeComments(payload());
    expect(posts.map((p) => p.postKey)).toEqual(['pos:1', 'pos:2']);
    expect(posts[1].postUrl).toBeNull();
    expect(posts[0].comments).toEqual([
      {
        id: '101',
        author: 'Test Fan A',
        text: 'Synthetic comment one',
        ts: '2d',
        reactions: 4,
        replies: [
          { id: '201', author: 'Test Fan B', text: 'Synthetic reply', ts: null, reactions: 2 },
        ],
      },
      {
        id: '102',
        author: 'Test Fan D',
        text: 'Synthetic two',
        ts: '1h',
        reactions: 0,
        replies: [],
      },
    ]);
  });

  it('accepts wrapped payloads and garbage', () => {
    expect(normalizeComments({ comments: payload() })).toHaveLength(2);
    expect(normalizeComments(undefined)).toEqual([]);
    expect(normalizeComments('nope')).toEqual([]);
  });

  it('caps sizes', () => {
    const many = [
      {
        postKey: 'pos:1',
        postUrl: null,
        comments: Array.from({ length: 80 }, (_, i) => ({
          id: String(i),
          author: 'a'.repeat(500),
          text: 'x'.repeat(9000),
          ts: null,
          reactions: 1,
          replies: Array.from({ length: 70 }, (_, j) => ({
            id: `r${i}-${j}`,
            author: 'b',
            text: 'y',
          })),
        })),
      },
    ];
    const [post] = normalizeComments(many);
    expect(post.comments).toHaveLength(50);
    expect(post.comments[0].replies).toHaveLength(50);
    expect(post.comments[0].text).toHaveLength(5000);
    expect(post.comments[0].author).toHaveLength(200);
  });
});

describe('commentSummary', () => {
  it('returns counts only', () => {
    const summary = commentSummary({ posts: normalizeComments(payload()) });
    expect(summary).toEqual({ posts: 2, comments: 3, replies: 1 });
    expect(JSON.stringify(summary)).not.toMatch(/Synthetic|Test Fan/);
    expect(commentSummary(null)).toEqual({ posts: 0, comments: 0, replies: 0 });
  });
});

describe('storeComments', () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'llfb-comments-'));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('writes the private file atomically and returns counts', async () => {
    const result = await storeComments({
      root,
      week: '2026-09-27',
      slug: 'example-group',
      comments: payload(),
      now: new Date('2026-09-30T12:00:00Z'),
    });
    expect(result).toEqual({
      path: join(root, 'comments', '2026-09-27', 'example-group.json'),
      posts: 2,
      comments: 3,
      replies: 1,
    });
    const stored = JSON.parse(await readFile(result.path, 'utf8'));
    expect(stored).toMatchObject({
      v: 1,
      week: '2026-09-27',
      slug: 'example-group',
      storedAt: '2026-09-30T12:00:00.000Z',
    });
    expect(commentSummary(stored)).toEqual({ posts: 2, comments: 3, replies: 1 });
    expect(await readdir(join(root, 'comments', '2026-09-27'))).toEqual(['example-group.json']);

    const again = await storeComments({
      root,
      week: '2026-09-27',
      slug: 'example-group',
      comments: [],
    });
    expect(again).toMatchObject({ posts: 0, comments: 0, replies: 0 });
    expect(await readdir(join(root, 'comments', '2026-09-27'))).toEqual(['example-group.json']);
  });

  it('rejects unsafe slugs and weeks', async () => {
    await expect(
      storeComments({ root, week: '2026-09-27', slug: '../x', comments: [] }),
    ).rejects.toThrow(/slug/);
    await expect(
      storeComments({ root, week: '../../x', slug: 'ok', comments: [] }),
    ).rejects.toThrow(/week/);
    await expect(
      storeComments({ root: '', week: '2026-09-27', slug: 'ok', comments: [] }),
    ).rejects.toThrow(/root/);
  });
});
