// Bounded, fail-soft fetch of the readable body text for the extract
// stage's top 1-3 publisher sources (content-fix-cards.md Card 2: "feed
// extraction the article body and raise the copy standard"). Same posture
// as resolve-google-news.ts: a slow/blocked/paywalled/robots-disallowed
// publisher must never throw, hang, or delay the whole extract cycle beyond
// its own small bound — every failure mode here degrades to "no text for
// this source," never an exception the caller has to handle.
//
// No new HTML-parsing dependency is added (apps/worker intentionally has a
// minimal dependency set — rss-parser is its only content-fetching lib);
// `stripHtml` below is a deliberately simple, bounded regex pass, good
// enough to hand the extraction LLM real paragraph text instead of markup.
// It does not need to be a perfect readability extractor — the extraction
// model is already instructed to ground facts only in what it's given and
// prefer `skip` over padding, so noisy (nav links, boilerplate) but still
// real article text is strictly better than no article text, and a mangled
// fetch is worse than none only to the extent it reduces signal, never to
// the extent it invents anything.

import { SOURCE_TIERS, type SourceTier } from '@swift2/shared/news';

/** Hard per-request timeout — a hung publisher connection must not stall extraction. */
const FETCH_TIMEOUT_MS = 5_000;
/** Card 2's "top 1-3 publisher sources" bound. */
export const MAX_ARTICLE_SOURCES = 3;
/** Per-article cap so one long page cannot crowd out the rest of the prompt. */
export const MAX_CHARS_PER_ARTICLE = 4_000;
/** Refuse to buffer an unreasonably large response body before even stripping tags. */
const MAX_RESPONSE_BYTES = 3_000_000;

export interface ArticleSourceRef {
  url: string;
  tier: SourceTier;
  outletName?: string;
}

export interface FetchedArticleText {
  url: string;
  outletName?: string;
  text: string;
}

/** Ranks sources by the same tier order as write-knowledge.ts's bestSourceTier
 * (official > established > fan > unverified), highest first, so the top 1-3
 * fetched are the best-attributed sources in the cluster, not an arbitrary
 * subset. */
function rankByTier(sources: readonly ArticleSourceRef[]): ArticleSourceRef[] {
  const rank = new Map(SOURCE_TIERS.map((tier, i) => [tier, i]));
  return [...sources].sort((a, b) => (rank.get(a.tier) ?? SOURCE_TIERS.length) - (rank.get(b.tier) ?? SOURCE_TIERS.length));
}

/** Minimal robots.txt check: fail OPEN (treat as allowed) on any fetch/parse
 * problem — this is a courtesy best-effort check, not a compliance engine,
 * and must never itself be the reason a legitimate fetch is skipped. Only an
 * explicit `Disallow: /` (or a disallow prefix matching our exact path)
 * under a matching `User-agent: *` block blocks the fetch. */
async function robotsAllow(url: string, fetchImpl: typeof fetch): Promise<boolean> {
  try {
    const parsed = new URL(url);
    const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;
    const res = await fetchImpl(robotsUrl, { signal: AbortSignal.timeout(3_000) });
    if (!res.ok) return true;
    const body = await res.text();
    let applies = false;
    for (const rawLine of body.split('\n')) {
      const line = rawLine.split('#')[0]?.trim() ?? '';
      if (!line) continue;
      const [rawKey, ...rest] = line.split(':');
      const key = rawKey?.trim().toLowerCase();
      const value = rest.join(':').trim();
      if (key === 'user-agent') {
        applies = value === '*';
      } else if (applies && key === 'disallow' && value) {
        if (value === '/' || parsed.pathname.startsWith(value)) return false;
      }
    }
    return true;
  } catch {
    return true; // robots.txt unreachable/unparseable — fail open, never block on this
  }
}

/** Strips a page down to visible text — removes script/style/noscript blocks
 * and tags, decodes the handful of entities real article HTML actually
 * uses, and collapses whitespace. Deliberately not a readability algorithm
 * (no main-content detection) — see the file header for why that's an
 * acceptable, intentional bound here. */
export function stripHtml(html: string): string {
  const withoutBlocks = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, ' ');
  const withoutTags = withoutBlocks.replace(/<[^>]+>/g, ' ');
  // `&amp;` is decoded LAST so an escaped entity like `&amp;lt;` stays the
  // literal text `&lt;` instead of being double-unescaped to `<` (CodeQL
  // js/double-escaping).
  const decoded = withoutTags
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
  return decoded.replace(/\s+/g, ' ').trim();
}

/** Fetches and strips one article's readable body text. Returns null — never
 * throws — for any failure: network error/timeout, non-OK status, a
 * non-HTML content type, an oversized body, robots disallow, or an empty
 * strip result. */
export async function fetchArticleText(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  try {
    if (!(await robotsAllow(url, fetchImpl))) return null;
    const res = await fetchImpl(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: 'text/html' },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType && !contentType.includes('html')) return null;
    const contentLength = Number(res.headers.get('content-length') ?? 0);
    if (contentLength > MAX_RESPONSE_BYTES) return null;
    const html = await res.text();
    if (html.length > MAX_RESPONSE_BYTES) return null;
    const text = stripHtml(html).slice(0, MAX_CHARS_PER_ARTICLE);
    return text.length > 0 ? text : null;
  } catch {
    return null; // timeout, network error, aborted — fail soft, same as resolve-google-news.ts
  }
}

/**
 * Fetches the readable body text for the cluster's top 1-3 publisher
 * sources (best tier first), bounded and fail-soft end to end — a failure
 * on any one source simply omits it, never aborts the others or the caller.
 */
export async function fetchTopArticleTexts(
  sources: readonly ArticleSourceRef[],
  fetchImpl: typeof fetch = fetch,
): Promise<FetchedArticleText[]> {
  const top = rankByTier(sources).slice(0, MAX_ARTICLE_SOURCES);
  const results = await Promise.all(
    top.map(async (source): Promise<FetchedArticleText | null> => {
      const text = await fetchArticleText(source.url, fetchImpl);
      if (!text) return null;
      return { url: source.url, outletName: source.outletName, text };
    }),
  );
  return results.filter((r): r is FetchedArticleText => r !== null);
}
