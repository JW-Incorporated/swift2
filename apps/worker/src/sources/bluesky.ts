// Bluesky adapter — public `app.bsky.feed.searchPosts` (AT Protocol),
// nominally no key needed for public search (proposal issue 7 / PLAN.md
// Stage 6). Same output shape as the rss adapter: title/snippet (<=2000
// chars)/permalink/publishedAt — author is reduced to an opaque hash, never
// the raw handle (docs/architecture.md's "no individuals" rule).
//
// Verified 2026-08-24: `public.api.bsky.app` resolves to Bluesky's own edge
// (CNAME bsky-api-public.b-cdn.net) and other public reads on that host
// (getProfile) return 200 unauthenticated, but `searchPosts` itself
// currently returns a bare 403 for every unauthenticated request tried
// (no params, with Referer/Origin set to bsky.app, all identical) — Bluesky
// appears to have tightened public search access since the proposal was
// written, this is not a sandbox/network artifact. Built to the documented
// public contract and fails soft (empty result) on a non-2xx rather than
// throwing, so one blocked source never takes the run cycle down — if this
// 403 persists in production, an authenticated app-password session is the
// real fix and a separate, larger adapter, not something to build blind here.

import type { NormalizedNewsItem } from '@swift2/shared/news';
import type { NewsSourceRow, SourceAdapter } from './types';
import { hashHandle } from './hash-handle';

const SEARCH_URL = 'https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts';
const MAX_ITEMS_PER_SOURCE = 30;
const TITLE_MAX = 80;

interface BlueskyPost {
  uri?: string;
  author?: { handle?: string };
  record?: { text?: string; createdAt?: string };
  indexedAt?: string;
}

interface BlueskySearchResponse {
  posts?: BlueskyPost[];
}

/** `at://did:plc:xxxx/app.bsky.feed.post/<rkey>` -> the public bsky.app permalink. */
function permalinkFor(uri: string, handle: string): string {
  const rkey = uri.split('/').pop() ?? '';
  return `https://bsky.app/profile/${handle}/post/${rkey}`;
}

function normalizePost(post: BlueskyPost): NormalizedNewsItem | null {
  const handle = post.author?.handle;
  const text = post.record?.text;
  if (!post.uri || !handle || !text) return null;
  return {
    externalId: post.uri,
    url: permalinkFor(post.uri, handle),
    title: text.length > TITLE_MAX ? `${text.slice(0, TITLE_MAX - 3)}...` : text,
    snippet: text.slice(0, 2000),
    author: hashHandle(handle),
    publishedAt: post.record?.createdAt ?? post.indexedAt,
  };
}

export async function fetchBlueskyPosts(
  query: string,
  fetchImpl: typeof fetch = fetch,
): Promise<NormalizedNewsItem[]> {
  const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&limit=${MAX_ITEMS_PER_SOURCE}`;
  const res = await fetchImpl(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    // Fails soft, see module header — a blocked/rate-limited search must
    // never take the whole ingest cycle down.
    console.error(`bluesky searchPosts failed (${res.status}) for query "${query}"`);
    return [];
  }
  const body = (await res.json()) as BlueskySearchResponse;
  return (body.posts ?? [])
    .slice(0, MAX_ITEMS_PER_SOURCE)
    .map(normalizePost)
    .filter((i): i is NormalizedNewsItem => i !== null);
}

export const blueskyAdapter: SourceAdapter = {
  async fetch(source: NewsSourceRow): Promise<NormalizedNewsItem[]> {
    const query = source.config.query;
    if (typeof query !== 'string' || !query) {
      throw new Error(`bluesky source "${source.name}" has no config.query`);
    }
    return fetchBlueskyPosts(query);
  },
};
