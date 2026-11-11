import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export function normalizeComments(comments = []) {
  if (!Array.isArray(comments)) throw new Error('crawl bundle comments must be an array');
  return comments.map((comment) => ({
    author: null,
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
  if (!post?.postId || !post?.permalink) {
    throw new Error('crawl bundle post is missing id or permalink');
  }
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
    score: post.score != null && Number.isFinite(Number(post.score)) ? Number(post.score) : null,
    numComments:
      post.numComments != null && Number.isFinite(Number(post.numComments))
        ? Number(post.numComments)
        : null,
    ageHours:
      post.ageHours != null && Number.isFinite(Number(post.ageHours))
        ? Number(post.ageHours)
        : null,
    depth: post.depth === 'full' ? 'full' : 'partial',
    comments: normalizeComments(post.comments),
  };
}

export function acceptHomeBundle(input) {
  if (!Array.isArray(input?.subreddits)) throw new Error('home bundle has no subreddits array');
  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    budget: 0,
    relayUsedTotal: 0,
    subreddits: input.subreddits.map((entry) => {
      const subreddit = String(entry?.subreddit ?? '');
      if (!/^reddit:[A-Za-z0-9_]+$/.test(subreddit)) {
        throw new Error('home bundle subreddit id is invalid');
      }
      return {
        subreddit,
        posts: (entry.posts ?? []).map((post) => normalizePost(post, subreddit)),
        relayUsed: 0,
      };
    }),
  };
}

export async function readHomeBundle(file) {
  return acceptHomeBundle(JSON.parse(await readFile(file, 'utf8')));
}

export async function writeCrawlBundle(file, bundle) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(acceptHomeBundle(bundle), null, 2)}\n`);
}
