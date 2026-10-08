// GNews adapter — free tier (100 req/day hard vendor cap), Joey's explicit
// call 2026-08-23 22:31 PDT over the paid Business tier the original
// proposal recommended (docs/decisions.md 2026-08-23 vendor entry,
// HUMAN-ACTIONS.md #12 DONE note). Engineered around the free cap with a
// real, durable, cross-run counter (`api-usage-daily.ts` /
// `classify/usage-store.ts`'s `UsageStore`, same pattern the LLM-classify
// cap already uses) hard-stopped at GNEWS_DAILY_CAP — well under 100, with
// margin for retries/failures across the 6 scheduled runs/day this pipeline
// makes. `reserve()` is checked BEFORE every call, never trusted-and-hoped.
//
// Tier: `unverified` until the publisher domain resolves via the existing
// domain->tier map (`lookupOutletTier`, packages/shared/src/news/outlet-
// tiers.ts, Stage 1) — reused, not forked. Unlike Google News, GNews
// articles link straight to the publisher's own URL (no aggregator
// redirect), so no follow-redirect step is needed — just a domain lookup,
// attached as `resolvedTier` on each item exactly like
// resolve-google-news.ts's `resolveGoogleNewsItem` does; run-cycle.ts's
// existing `'resolvedTier' in item` check picks it up with zero changes to
// that file.
//
// Verified 2026-08-24: `https://gnews.io/api/v4/search` is live and
// reachable (400 for an invalid key + malformed query, the expected
// "endpoint exists" response) — not verified against real article data
// since GNEWS_API_KEY is a CI-only secret, unavailable here.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NormalizedNewsItem, SourceTier } from '@swift2/shared/news';
import { lookupOutletTier } from '@swift2/shared/news';
import type { NewsSourceRow, SourceAdapter } from './types';
import { UsageStore } from '../classify/usage-store';
import { apiUsageDailyDb } from './api-usage-daily';
import { createWorkerDbClient } from '../db/client';

const SEARCH_URL = 'https://gnews.io/api/v4/search';
const MAX_ITEMS_PER_SOURCE = 30;
/** Free tier's real ceiling is 100/day; hard-stop well under it (margin for retries/failures). */
export const GNEWS_DAILY_CAP = 80;
export const GNEWS_USAGE_SCOPE = 'gnews';

interface GnewsArticle {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  publishedAt?: string;
  source?: { name?: string; url?: string };
}

function domainOf(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

function normalizeArticle(article: GnewsArticle): (NormalizedNewsItem & { resolvedTier: SourceTier }) | null {
  if (!article.url || !article.title) return null;
  const domain = domainOf(article.url);
  const outlet = domain ? lookupOutletTier(domain) : undefined;
  return {
    externalId: article.url,
    url: article.url,
    title: article.title,
    snippet: (article.description ?? '').slice(0, 2000),
    publishedAt: article.publishedAt,
    imageUrl: article.image,
    publisher: outlet?.name ?? article.source?.name,
    publisherUrl: domain ? `https://${domain}` : article.source?.url,
    resolvedTier: outlet?.tier ?? 'unverified',
  };
}

export async function fetchGnewsQuery(
  query: string,
  apiKey: string,
  usage: UsageStore,
  fetchImpl: typeof fetch = fetch,
): Promise<NormalizedNewsItem[]> {
  const reserved = await usage.reserve();
  if (!reserved) {
    console.error(`gnews: daily cap (${GNEWS_DAILY_CAP}) reached, skipping query "${query}"`);
    return [];
  }
  const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&lang=en&sortby=publishedAt&apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`gnews search failed for "${query}" (${res.status})`);
  }
  const body = (await res.json()) as { articles?: GnewsArticle[] };
  return (body.articles ?? [])
    .slice(0, MAX_ITEMS_PER_SOURCE)
    .map(normalizeArticle)
    .filter((i): i is NormalizedNewsItem & { resolvedTier: SourceTier } => i !== null);
}

/** Lazily built so importing this module never requires worker DB env vars (e.g. in tests). */
let cachedDb: SupabaseClient | undefined;
function workerDb(): SupabaseClient {
  if (!cachedDb) cachedDb = createWorkerDbClient();
  return cachedDb;
}

export const gnewsAdapter: SourceAdapter = {
  async fetch(source: NewsSourceRow): Promise<NormalizedNewsItem[]> {
    const apiKey = process.env.GNEWS_API_KEY;
    if (!apiKey) return []; // no key configured — same "no key, no call" posture as tumblr/openai-client
    const query = source.config.query;
    if (typeof query !== 'string' || !query) {
      throw new Error(`gnews source "${source.name}" has no config.query`);
    }
    const usage = await UsageStore.create(apiUsageDailyDb(workerDb(), GNEWS_USAGE_SCOPE), GNEWS_DAILY_CAP);
    return fetchGnewsQuery(query, apiKey, usage);
  },
};
