// Tumblr adapter — public read-only `/v2/tagged` (tag search) and
// `/v2/blog/<identifier>/posts` (a specific blog's own posts) endpoints.
// Consumer-key-only, no OAuth (docs/decisions.md 2026-08-23 vendor entry) —
// TUMBLR_CONSUMER_API_KEY is enough for these two public read paths.
// TUMBLR_SECRET_API_KEY (also a set repo secret) is for a future
// user-authorized OAuth token exchange, deliberately not built here — out
// of scope per this build's brief.
//
// `filter=text` asks Tumblr to return a plain-text `summary` instead of the
// raw Neue Post Format payload — least parsing, and it already matches this
// pipeline's "teaser, never a full body" rule (NormalizedNewsItem.snippet).
// Verified 2026-08-24: both endpoints are live and reachable (401 without a
// real key, the expected "endpoint exists, key required" response) — not
// verified against real data since no key is available outside CI secrets.
//
// Blog identity (`blog_name`) is hashed like every other fan-tier author,
// even for the official taylorswift.tumblr.com blog mode — simpler and more
// consistent than special-casing "this one handle is public," and the
// permalink already carries full attribution for citation purposes.

import type { NormalizedNewsItem } from '@swift2/shared/news';
import type { NewsSourceRow, SourceAdapter } from './types';
import { hashHandle } from './hash-handle';

const MAX_ITEMS_PER_SOURCE = 30;
const TITLE_MAX = 80;

interface TumblrPost {
  id?: number | string;
  post_url?: string;
  title?: string | null;
  summary?: string;
  blog_name?: string;
  timestamp?: number;
}

function normalizePost(post: TumblrPost): NormalizedNewsItem | null {
  if (!post.post_url || post.id === undefined || post.id === null) return null;
  const summary = (post.summary ?? '').slice(0, 2000);
  const title = post.title?.trim() || (summary ? summary.slice(0, TITLE_MAX) : '(untitled)');
  return {
    externalId: String(post.id),
    url: post.post_url,
    title,
    snippet: summary,
    author: post.blog_name ? hashHandle(post.blog_name) : undefined,
    publishedAt: post.timestamp ? new Date(post.timestamp * 1000).toISOString() : undefined,
  };
}

export async function fetchTumblrTag(
  tag: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<NormalizedNewsItem[]> {
  const url = `https://api.tumblr.com/v2/tagged?tag=${encodeURIComponent(tag)}&filter=text&api_key=${encodeURIComponent(apiKey)}`;
  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`tumblr tagged fetch failed for tag "${tag}" (${res.status})`);
  }
  const body = (await res.json()) as { response?: TumblrPost[] };
  return (body.response ?? [])
    .slice(0, MAX_ITEMS_PER_SOURCE)
    .map(normalizePost)
    .filter((i): i is NormalizedNewsItem => i !== null);
}

export async function fetchTumblrBlogPosts(
  blogIdentifier: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<NormalizedNewsItem[]> {
  const url = `https://api.tumblr.com/v2/blog/${encodeURIComponent(blogIdentifier)}/posts?filter=text&api_key=${encodeURIComponent(apiKey)}`;
  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`tumblr blog posts fetch failed for "${blogIdentifier}" (${res.status})`);
  }
  const body = (await res.json()) as { response?: { posts?: TumblrPost[] } };
  return (body.response?.posts ?? [])
    .slice(0, MAX_ITEMS_PER_SOURCE)
    .map(normalizePost)
    .filter((i): i is NormalizedNewsItem => i !== null);
}

export const tumblrAdapter: SourceAdapter = {
  async fetch(source: NewsSourceRow): Promise<NormalizedNewsItem[]> {
    const apiKey = process.env.TUMBLR_CONSUMER_API_KEY;
    if (!apiKey) {
      // Key not configured in this environment — same "no key, no call"
      // posture as classify/openai-client.ts, not a hard failure.
      return [];
    }
    const config = source.config as { mode?: string; tag?: string; blogIdentifier?: string };
    if (config.mode === 'blog') {
      if (typeof config.blogIdentifier !== 'string' || !config.blogIdentifier) {
        throw new Error(`tumblr source "${source.name}" has no config.blogIdentifier`);
      }
      return fetchTumblrBlogPosts(config.blogIdentifier, apiKey);
    }
    if (typeof config.tag !== 'string' || !config.tag) {
      throw new Error(`tumblr source "${source.name}" has no config.tag`);
    }
    return fetchTumblrTag(config.tag, apiKey);
  },
};
