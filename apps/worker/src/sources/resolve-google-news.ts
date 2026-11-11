// Resolves Google News RSS links to the real publisher URL (proposal §4.1.2,
// PLAN.md Stage 1). Google News no longer HTTP-redirects, so the link is
// decoded instead: old-format ids embed the URL in a base64url protobuf;
// new-format ids (`AU_yqL...`) go through the page's signed `batchexecute`
// `Fbv4je` call. A plain redirect-follow stays as the last attempt. Unresolved
// (network failure, or a domain with no tier-map entry) stays `unverified` —
// computeVerificationStatus then treats a lone 'unverified' source as 'rumor'.
// Every path is fail-soft: this module never throws into the ingest stage.

import type { NormalizedNewsItem, SourceTier } from '@swift2/shared/news';
import { lookupOutletTier } from '@swift2/shared/news';
import { runStats } from '../run-stats';

export interface ResolvedRedirect {
  url: string;
  domain: string;
}

const GOOGLE_NEWS_HOST = /^https?:\/\/news\.google\.com\//i;
const ARTICLE_ID = /^https?:\/\/news\.google\.com\/(?:rss\/)?(?:read|articles)\/([^/?#]+)/i;
const BATCHEXECUTE_URL = 'https://news.google.com/_/DotsSplashUi/data/batchexecute';
const USER_AGENT =
  'Mozilla/5.0 (compatible; Swift2-NewsResolver/1.0; +https://github.com/JW-Incorporated/swift2)';
const FETCH_TIMEOUT_MS = 10_000;
const MAX_CONCURRENT = 3;

let active = 0;
const waiting: (() => void)[] = [];

async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) await new Promise<void>((resolve) => waiting.push(resolve));
  active++;
  try {
    return await task();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

export function googleNewsArticleId(url: string): string | null {
  return ARTICLE_ID.exec(url)?.[1] ?? null;
}

function publisherOrNull(candidate: string): string | null {
  try {
    const parsed = new URL(candidate);
    if (!/^https?:$/.test(parsed.protocol)) return null;
    if (parsed.hostname === 'google.com' || parsed.hostname.endsWith('.google.com')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Old-format ids carry the publisher URL inside a base64url protobuf. */
export function decodeLegacyArticleId(id: string): string | null {
  try {
    const bytes = Buffer.from(id.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const text = bytes.toString('latin1');
    const start = text.indexOf('http');
    if (start < 1) return null;
    let length = bytes[start - 1] ?? 0;
    if (length >= 0x80 && start >= 2) {
      length = (bytes[start - 2]! & 0x7f) | (bytes[start - 1]! << 7);
    }
    const sliced = length > 0 && start + length <= bytes.length ? text.slice(start, start + length) : '';
    const url = /^https?:\/\/[\x21-\x7e]+$/.test(sliced)
      ? sliced
      : (/https?:\/\/[\x21-\x7e]+/.exec(text.slice(start))?.[0] ?? '');
    return publisherOrNull(url);
  } catch {
    return null;
  }
}

function attr(html: string, name: string): string | null {
  return new RegExp(`${name}="([^"]+)"`).exec(html)?.[1] ?? null;
}

/** Pulls the publisher URL out of a batchexecute response body. */
export function parseBatchExecuteResponse(body: string): string | null {
  try {
    const chunk = body.slice(body.indexOf('\n\n') + 2);
    const outer = JSON.parse(chunk.slice(0, chunk.lastIndexOf(']') + 1)) as unknown;
    const payload = (outer as unknown[][])[0]?.[2];
    if (typeof payload === 'string') {
      const url = (JSON.parse(payload) as unknown[])[1];
      if (typeof url === 'string') return publisherOrNull(url);
    }
  } catch {
    // fall through to the pattern match below
  }
  const loose = /garturlres\\*",\\*"(https?:[^"\\]+)/.exec(body)?.[1];
  return loose ? publisherOrNull(loose) : null;
}

async function resolveViaBatchExecute(id: string, fetchImpl: typeof fetch): Promise<string | null> {
  const pageRes = await fetchImpl(`https://news.google.com/rss/articles/${id}`, {
    headers: { 'User-Agent': USER_AGENT, Cookie: 'CONSENT=YES+cb' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!pageRes.ok) return null;
  const html = await pageRes.text();
  const signature = attr(html, 'data-n-a-sg');
  const timestamp = attr(html, 'data-n-a-ts');
  if (!signature || !timestamp) return null;

  const inner = JSON.stringify([
    'garturlreq',
    [
      ['X', 'X', ['X', 'X'], null, null, 1, 1, 'US:en', null, 1, null, null, null, null, null, 0, 1],
      'X', 'X', 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0,
    ],
    id,
    Number(timestamp),
    signature,
  ]);
  const fReq = JSON.stringify([[['Fbv4je', inner, null, 'generic']]]);
  const res = await fetchImpl(BATCHEXECUTE_URL, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Cookie: 'CONSENT=YES+cb',
    },
    body: `f.req=${encodeURIComponent(fReq)}`,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) return null;
  return parseBatchExecuteResponse(await res.text());
}

async function resolveViaRedirect(url: string, fetchImpl: typeof fetch): Promise<string | null> {
  for (const method of ['HEAD', 'GET'] as const) {
    try {
      const res = await fetchImpl(url, {
        method,
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      await res.body?.cancel?.().catch(() => {});
      const finalUrl = res.url;
      if (finalUrl && finalUrl !== url) {
        const publisher = publisherOrNull(finalUrl);
        if (publisher) return publisher;
      }
    } catch {
      // try the next method
    }
  }
  return null;
}

/**
 * Resolves a Google News article link to its publisher URL. Non-Google-News
 * URLs and anything that fails to resolve return null — callers must treat
 * that as "stays unverified," never throw over one bad link.
 */
export async function resolveGoogleNewsUrl(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ResolvedRedirect | null> {
  if (!GOOGLE_NEWS_HOST.test(url)) return null;
  const id = googleNewsArticleId(url);

  let found: string | null = id ? decodeLegacyArticleId(id) : null;
  if (!found && id) {
    try {
      found = await withSlot(() => resolveViaBatchExecute(id, fetchImpl));
    } catch {
      found = null;
    }
  }
  if (!found) found = await withSlot(() => resolveViaRedirect(url, fetchImpl));

  const domain = found ? safeHostname(found) : undefined;
  if (found && domain) {
    runStats.gnewsResolved++;
    return { url: found, domain };
  }
  runStats.gnewsUnresolved++;
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

export interface ResolvableSource {
  outletName: string;
  url: string;
  tier: SourceTier;
}

/** Replaces any Google News URL in `sources` with its publisher URL and
 * re-tiers it from the domain map. `changed` lists the rewrites so callers
 * can persist them. */
export async function resolveSourceUrls<T extends ResolvableSource>(
  sources: readonly T[],
  fetchImpl: typeof fetch = fetch,
): Promise<{ sources: T[]; changed: { from: string; to: string; tier: SourceTier }[] }> {
  const changed: { from: string; to: string; tier: SourceTier }[] = [];
  const out: T[] = [];
  for (const source of sources) {
    if (!GOOGLE_NEWS_HOST.test(source.url)) {
      out.push(source);
      continue;
    }
    const resolved = await resolveGoogleNewsUrl(source.url, fetchImpl);
    if (!resolved) {
      out.push(source);
      continue;
    }
    const tier = lookupOutletTier(resolved.domain)?.tier ?? 'unverified';
    changed.push({ from: source.url, to: resolved.url, tier });
    out.push({ ...source, url: resolved.url, tier });
  }
  return { sources: out, changed };
}
