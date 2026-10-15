// Resolves the `current_item.image_url` written by write-knowledge.ts (Content
// fix 1/6, docs root-cause: news_story.top_image_url was captured at ingest
// (run-cycle.ts's rss.ts enclosure / gnews.ts article.image) but never made
// it onto the current_item row).
//
// Two paths, in order:
//   1. The story's own `top_image_url` (set at clustering time from the
//      representative raw item's `image_url` — run-cycle.ts ~line 197),
//      accepted only if its host passes the existing image-host allowlist.
//   2. Fallbacks: derive an official YouTube thumbnail first; then fetch the
//      best official/established source's og:image (else twitter:image); then
//      preserve the older lower-tier best-effort path. The page parser uses
//      the same tag-reading approach as
//      scripts/social/source-press-photos.mjs's extractPageImage/
//      fetchPageImage, reimplemented here (not imported) so apps/worker
//      never depends on that script's CLI/importer-contract module graph.
//      Accepted only if ITS host also passes the allowlist.
// Both paths reuse the live-feed publication allowlist exported from
// packages/shared/src/current-item-quality.ts, plus PHOTO_HOST_LEGACY for
// unchanged historical compatibility. CurrentItem.imageUrl remains hotlinked,
// never rehosted.
//
// No image found (or nothing passes the allowlist) resolves to `undefined` —
// write-knowledge.ts stores that as a null `image_url`; Card 3 is what turns
// "no image" into a publish-gate hold, not this module.

import { extractYouTubeId, isAllowlistedImageHost } from '@swift2/shared';
import { PHOTO_HOST_LEGACY, hostOf } from '../../../../scripts/lib/photo-host-gate.mjs';
import type { ClusterSource } from './write-knowledge';

const USER_AGENT = 'Swift2-ContentFix/1.0 (+https://github.com/JW-Incorporated/swift2)';
const FETCH_TIMEOUT_MS = 15_000;
const PAGE_FETCH_BYTES = 600_000;
const SOURCE_TIER_ORDER = ['official', 'established', 'fan', 'unverified'] as const;
const GOOGLE_NEWS_HOST = /^https?:\/\/news\.google\.com\//i;

/** True when `url` passes the live-feed publication allowlist or the existing
 * PHOTO_HOST_LEGACY grandfather set. */
export function isAllowedImageHost(url: string): boolean {
  if (isAllowlistedImageHost(url)) return true;
  const host = hostOf(url);
  if (!host) return false;
  return PHOTO_HOST_LEGACY.has(host);
}

function metaContent(html: string, names: readonly string[]): string | null {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = /\b(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
    if (!key || !names.includes(key)) continue;
    const content = /\bcontent\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
    if (content) return content.replace(/&amp;/g, '&').trim();
  }
  return null;
}

/** The page's og:image (preferred) or twitter:image as an absolute URL, or `null`. */
export function extractPageImage(html: string, pageUrl: string): string | null {
  const raw =
    metaContent(html, ['og:image', 'og:image:secure_url', 'og:image:url']) ??
    metaContent(html, ['twitter:image', 'twitter:image:src']);
  if (!raw) return null;
  try {
    return new URL(raw, pageUrl).toString();
  } catch {
    return null;
  }
}

/** Reads at most `maxBytes` of a response body as text, cancelling the stream once the cap is hit. */
async function readCapped(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return (await res.text()).slice(0, maxBytes);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  await reader.cancel().catch(() => {});
  return Buffer.concat(chunks).subarray(0, maxBytes).toString('utf8');
}

/** Fetches an article page and returns its og:image/twitter:image, or `null`
 * on any failure — best-effort, must never throw into the extract stage. */
export async function fetchPageImage(
  articleUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  try {
    const res = await fetchImpl(articleUrl, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    if (!/text\/html|application\/xhtml/i.test(res.headers.get('content-type') ?? '')) {
      await res.body?.cancel();
      return null;
    }
    return extractPageImage(await readCapped(res, PAGE_FETCH_BYTES), articleUrl);
  } catch {
    return null;
  }
}

/** The best (highest-tier) cluster source whose URL is a real publisher link
 * — never a news.google redirect (those are already resolved away at ingest
 * by resolve-google-news.ts, but this is defensive, not load-bearing). */
export function bestSourceForImage(sources: readonly ClusterSource[]): ClusterSource | undefined {
  const citable = sources.filter((s) => !GOOGLE_NEWS_HOST.test(s.url));
  if (citable.length === 0) return undefined;
  return [...citable].sort(
    (a, b) => SOURCE_TIER_ORDER.indexOf(a.tier) - SOURCE_TIER_ORDER.indexOf(b.tier),
  )[0];
}

function bestTrustedSourceForImage(sources: readonly ClusterSource[]): ClusterSource | undefined {
  return bestSourceForImage(
    sources.filter((source) => source.tier === 'official' || source.tier === 'established'),
  );
}

/** A video item from an official YouTube source has a deterministic hotlink,
 * so it does not depend on an article fetch or a rehosted copy. */
export function officialYouTubeThumbnail(sources: readonly ClusterSource[]): string | undefined {
  for (const source of sources) {
    if (source.tier !== 'official') continue;
    const id = extractYouTubeId(source.url);
    if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  }
  return undefined;
}

/** Resolves the ordered hotlink fallbacks; returns `undefined` when every
 * candidate is absent, unreachable, or disallowed. */
export async function resolveFallbackImage(
  sources: readonly ClusterSource[],
  fetchImpl: typeof fetch = fetch,
): Promise<string | undefined> {
  const thumbnail = officialYouTubeThumbnail(sources);
  if (thumbnail) return thumbnail;

  const trusted = bestTrustedSourceForImage(sources);
  if (trusted) {
    const image = await fetchPageImage(trusted.url, fetchImpl);
    if (image && isAllowedImageHost(image)) return image;
  }

  // Preserve the earlier best-effort path for lower-tier items so the new
  // critical-news fallback cannot create new held rows elsewhere.
  const best = bestSourceForImage(sources.filter((source) => source !== trusted));
  if (!best) return undefined;
  const image = await fetchPageImage(best.url, fetchImpl);
  if (!image || !isAllowedImageHost(image)) return undefined;
  return image;
}

/** The single entry point run-extract-stage.ts calls before writeCurrentItem:
 * prefer an allowlisted top_image_url, then the ordered fallback chain. */
export async function resolveImageUrl(
  topImageUrl: string | null | undefined,
  sources: readonly ClusterSource[],
  fetchImpl: typeof fetch = fetch,
): Promise<string | undefined> {
  if (topImageUrl && isAllowedImageHost(topImageUrl)) return topImageUrl;
  return resolveFallbackImage(sources, fetchImpl);
}
