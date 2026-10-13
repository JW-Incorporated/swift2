// Resolves the `current_item.image_url` written by write-knowledge.ts (Content
// fix 1/6, docs root-cause: news_story.top_image_url was captured at ingest
// (run-cycle.ts's rss.ts enclosure / gnews.ts article.image) but never made
// it onto the current_item row).
//
// Two paths, in order:
//   1. The story's own `top_image_url` (set at clustering time from the
//      representative raw item's `image_url` — run-cycle.ts ~line 197),
//      accepted only if its host passes the existing image-host allowlist.
//   2. A fallback: fetch the best (highest-tier, never a news.google
//      redirect) cluster source's article page and read its og:image (else
//      twitter:image) — same tag-reading approach as
//      scripts/social/source-press-photos.mjs's extractPageImage/
//      fetchPageImage, reimplemented here (not imported) so apps/worker
//      never depends on that script's CLI/importer-contract module graph.
//      Accepted only if ITS host also passes the allowlist.
// Both paths reuse the SAME allowlist — scripts/content-engine/config.mjs's
// CONFIG.hostAllowlist/scopedHostAllowlist plus scripts/lib/photo-host-
// gate.mjs's PHOTO_HOST_LEGACY grandfather list — the one already governing
// every other hotlinked image in this repo (CurrentItem.imageUrl's own
// doc comment: "Hotlink from an allowlisted host... Never rehosted"). Do not
// invent a second list here.
//
// No image found (or nothing passes the allowlist) resolves to `undefined` —
// write-knowledge.ts stores that as a null `image_url`; Card 3 is what turns
// "no image" into a publish-gate hold, not this module.

import { CONFIG } from '../../../../scripts/content-engine/config.mjs';
import { PHOTO_HOST_LEGACY, hostOf } from '../../../../scripts/lib/photo-host-gate.mjs';
import type { ClusterSource } from './write-knowledge';

interface ScopedAllowlistEntry {
  host: string;
  pathPrefix: string;
}

// The two config modules are untyped .mjs (shared with plain-Node scripts/
// tooling, no build step) — narrow what this file actually reads from them.
const HOST_ALLOWLIST: readonly string[] = CONFIG.hostAllowlist;
const SCOPED_HOST_ALLOWLIST: readonly ScopedAllowlistEntry[] = CONFIG.scopedHostAllowlist ?? [];

const USER_AGENT = 'Swift2-ContentFix/1.0 (+https://github.com/JW-Incorporated/swift2)';
const FETCH_TIMEOUT_MS = 15_000;
const PAGE_FETCH_BYTES = 600_000;
const SOURCE_TIER_ORDER = ['official', 'established', 'fan', 'unverified'] as const;
const GOOGLE_NEWS_HOST = /^https?:\/\/news\.google\.com\//i;

/** True when `url`'s host is on the existing image-host allowlist — the
 * exact same check `scripts/content-engine/checkers/image-liveness.mjs` runs
 * (bare hostAllowlist membership, the PHOTO_HOST_LEGACY grandfather set, or a
 * scoped (host, pathPrefix) multi-tenant-CDN entry). Never invents a new
 * rule. */
export function isAllowedImageHost(url: string): boolean {
  const host = hostOf(url);
  if (!host) return false;
  if (HOST_ALLOWLIST.includes(host)) return true;
  if (PHOTO_HOST_LEGACY.has(host)) return true;
  if (SCOPED_HOST_ALLOWLIST.length > 0) {
    let pathname: string;
    try {
      pathname = new URL(url).pathname;
    } catch {
      return false;
    }
    if (SCOPED_HOST_ALLOWLIST.some((s) => s.host === host && pathname.startsWith(s.pathPrefix))) {
      return true;
    }
  }
  return false;
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

/** Fetches the best source's og:image/twitter:image and returns it only if
 * it passes the allowlist; `undefined` on no sources, no image, a fetch
 * failure, or a disallowed host. */
export async function resolveFallbackImage(
  sources: readonly ClusterSource[],
  fetchImpl: typeof fetch = fetch,
): Promise<string | undefined> {
  const best = bestSourceForImage(sources);
  if (!best) return undefined;
  const image = await fetchPageImage(best.url, fetchImpl);
  if (!image || !isAllowedImageHost(image)) return undefined;
  return image;
}

/** The single entry point run-extract-stage.ts calls before writeCurrentItem:
 * prefer the story's own top_image_url (if allowlisted), else fall back to
 * the best source's og:image/twitter:image (if allowlisted), else undefined. */
export async function resolveImageUrl(
  topImageUrl: string | null | undefined,
  sources: readonly ClusterSource[],
  fetchImpl: typeof fetch = fetch,
): Promise<string | undefined> {
  if (topImageUrl && isAllowedImageHost(topImageUrl)) return topImageUrl;
  return resolveFallbackImage(sources, fetchImpl);
}
