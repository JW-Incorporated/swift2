// Resolves Google News RSS redirect links to the real publisher URL at
// ingest time (proposal §4.1.2, PLAN.md Stage 1). Google News RSS items link
// to an opaque `https://news.google.com/rss/articles/CBMi...` redirect, not
// a citable source — this follows it (HEAD first, GET fallback — some
// origins reject HEAD), stores the resolved publisher URL, and re-tiers the
// item from the domain->tier map. Unresolved (network failure, or a domain
// with no tier-map entry) stays `unverified` — the existing rule
// (computeVerificationStatus: a lone 'unverified' source -> 'rumor', never
// citable-looking) now applies per item instead of only at the whole
// `google_news` source's static tier.

import type { NormalizedNewsItem, SourceTier } from '@swift2/shared/news';
import { lookupOutletTier } from '@swift2/shared/news';

export interface ResolvedRedirect {
  url: string;
  domain: string;
}

const GOOGLE_NEWS_HOST = /^https?:\/\/news\.google\.com\//i;

/**
 * Follows a Google News redirect link to its final publisher URL.
 * Non-Google-News URLs and anything that fails to resolve return null —
 * callers must treat that as "stays unverified," never throw the ingest
 * stage over one bad redirect.
 */
export async function resolveGoogleNewsUrl(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ResolvedRedirect | null> {
  if (!GOOGLE_NEWS_HOST.test(url)) return null;

  for (const method of ['HEAD', 'GET'] as const) {
    try {
      const res = await fetchImpl(url, { method, redirect: 'follow' });
      // Some runtimes need the body drained/cancelled before the connection
      // is reused; we only ever need the final resolved URL.
      await res.body?.cancel?.().catch(() => {});
      const finalUrl = res.url;
      if (finalUrl && finalUrl !== url) {
        const domain = safeHostname(finalUrl);
        if (domain) return { url: finalUrl, domain };
      }
    } catch {
      // Network hiccup or method unsupported by the origin — try the next
      // method; if GET also fails, the item just stays unresolved/unverified.
    }
  }
  return null;
}

function safeHostname(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

/**
 * Resolves one ingested item and returns it annotated with the tier it has
 * earned: the domain-map tier when resolved to a known outlet, otherwise
 * `unverified` (whether unresolved, or resolved to a domain not in the map —
 * an unaudited domain never silently becomes `established`).
 */
export async function resolveGoogleNewsItem(
  item: NormalizedNewsItem,
  fetchImpl: typeof fetch = fetch,
): Promise<NormalizedNewsItem & { resolvedTier: SourceTier }> {
  const resolved = await resolveGoogleNewsUrl(item.url, fetchImpl);
  if (!resolved) return { ...item, resolvedTier: 'unverified' };

  const outlet = lookupOutletTier(resolved.domain);
  if (!outlet) {
    return {
      ...item,
      url: resolved.url,
      publisherUrl: `https://${resolved.domain}`,
      resolvedTier: 'unverified',
    };
  }
  return {
    ...item,
    url: resolved.url,
    publisher: outlet.name,
    publisherUrl: `https://${resolved.domain}`,
    resolvedTier: outlet.tier,
  };
}
