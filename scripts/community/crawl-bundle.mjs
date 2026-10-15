import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/** Deterministic, non-reversible author handle for persisted crawl comments. */
export function hashAuthor(author) {
  if (!author) return null;
  return createHash('sha256').update(String(author)).digest('hex').slice(0, 16);
}

export function normalizeComments(comments = []) {
  if (!Array.isArray(comments)) throw new Error('crawl bundle comments must be an array');
  return comments.map((comment) => ({
    author:
      comment.author == null || /^[0-9a-f]{16}$/i.test(comment.author)
        ? (comment.author ?? null)
        : null,
    body: typeof comment.body === 'string' ? comment.body : null,
    score:
      comment.score != null && Number.isFinite(Number(comment.score))
        ? Number(comment.score)
        : null,
    depth:
      comment.depth != null && Number.isInteger(Number(comment.depth))
        ? Number(comment.depth)
        : null,
    publishedAt: typeof comment.publishedAt === 'string' ? comment.publishedAt : null,
  }));
}

function normalizePost(post, subreddit) {
  if (!post?.postId || !post?.permalink)
    throw new Error('crawl bundle post is missing id or permalink');
  const permalink = new URL(post.permalink);
  if (
    !['http:', 'https:'].includes(permalink.protocol) ||
    !/(^|\.)reddit\.com$/i.test(permalink.hostname)
  ) {
    throw new Error('crawl bundle permalink must be a public Reddit URL');
  }
  return {
    subreddit,
    postId: String(post.postId),
    title: typeof post.title === 'string' ? post.title : null,
    permalink: permalink.toString(),
    createdAt: typeof post.createdAt === 'string' ? post.createdAt : null,
    rank: post.rank != null && Number.isFinite(Number(post.rank)) ? Number(post.rank) : null,
    depth: post.depth === 'full' ? 'full' : 'partial',
    comments: normalizeComments(post.comments),
  };
}

/** Validate a home-reader bundle into the existing community-crawl artifact shape. */
export function acceptHomeBundle(input) {
  if (!Array.isArray(input?.subreddits)) throw new Error('home bundle has no subreddits array');
  const subreddits = input.subreddits.map((entry) => {
    const subreddit = String(entry?.subreddit ?? '');
    if (!/^reddit:[A-Za-z0-9_]+$/.test(subreddit)) {
      throw new Error('home bundle subreddit id is invalid');
    }
    return {
      subreddit,
      posts: (entry.posts ?? []).map((post) => normalizePost(post, subreddit)),
      relayUsed: 0,
    };
  });
  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    budget: 0,
    relayUsedTotal: 0,
    subreddits,
  };
}

export async function readHomeBundle(file) {
  return acceptHomeBundle(JSON.parse(await readFile(file, 'utf8')));
}

export async function writeCrawlBundle(file, bundle) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(bundle, null, 2)}\n`);
}
