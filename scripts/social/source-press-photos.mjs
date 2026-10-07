#!/usr/bin/env node
// Press-photo sourcing adapter (founder goal 2026-10-07: 10,000+ awesome Taylor
// Swift photos for social). Discovers the lead photo of recent Taylor Swift
// news coverage via GNews and emits a candidates JSON file in exactly the
// shape `import-photo-library.mjs --fetch` expects — same contract as
// source-wikimedia-photos.mjs; this script never writes to the library and
// never touches the live posting pipeline.
//
// RIGHTS BASIS: docs/social/guardrails.md Guardrail 2 — rehosting real internet
// photos, press/agency included, is allowed as a knowing accepted risk;
// uncredited is fine (docs/decisions.md 2026-10-01), no credit/permission gate
// on ingestion (2026-09-22). Hard bars kept here: no watermarked/comp stock
// hosts (HOST_DENYLIST), no AI images, takedown on request. Getty comps are
// excluded.
//
// GNEWS QUOTA: the free tier is 100 requests/day. The news-worker
// (apps/worker/src/sources/gnews.ts) hard-stops at GNEWS_DAILY_CAP = 80 via a
// Supabase counter this job cannot read, so this adapter keeps its OWN fixed
// budget — DEFAULT_MAX_REQUESTS (4) per run, one run a day (8 even with a
// manual re-run) — keeping the worst-case combined spend at 84-88 of 100.
// Never raise it without re-doing that arithmetic. Free tier returns at most
// 10 articles per request.
//
// WHAT IS EMITTED per article: the page's og:image (else twitter:image) first,
// then GNews's own `image` when it is a different URL. The importer downloads
// in order, enforces the real >=1080px long edge on the bytes, and drops the
// second as a near-duplicate of the first when both land (perceptual hash).
//
// Usage:
//   GNEWS_API_KEY=... node scripts/social/source-press-photos.mjs --output candidates.json [--max-requests 4]

/* global AbortSignal */

import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { URLSearchParams } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { stripHtmlTags } from './source-wikimedia-photos.mjs';
import {
  MIN_PRESS_LONG_EDGE_PX,
  SourceApiError,
  TOPIC_RE,
  dedupeCandidates,
  looksAiGenerated,
} from './lib/photo-source-common.mjs';

const GNEWS_URL = 'https://gnews.io/api/v4/search';
export const DEFAULT_MAX_REQUESTS = 4;
export const GNEWS_PAGE_SIZE = 10;
// Each query is one GNews request; different angles surface different lead photos.
export const PRESS_QUERIES = [
  '"Taylor Swift"',
  '"Taylor Swift" AND (concert OR tour OR performance OR stage)',
  '"Taylor Swift" AND (album OR "Life of a Showgirl" OR "music video" OR premiere)',
  '"Taylor Swift" AND ("red carpet" OR event OR appearance OR photos)',
];
export const REQUEST_DELAY_MS = 1000;
const PAGE_FETCH_BYTES = 600_000;
const USER_AGENT = 'Mozilla/5.0 (compatible; LongLiveSocialPhotoSourcing/1.0; +https://longlivets.com)';

// Watermarked / comp / stock-preview hosts. Exact host or any subdomain.
export const HOST_DENYLIST = [
  'gettyimages.com',
  'gettyimages.co.uk',
  'getty.edu',
  'shutterstock.com',
  'shutterstock.io',
  'alamy.com',
  'alamyimages.fr',
  'dreamstime.com',
  'depositphotos.com',
  '123rf.com',
  'istockphoto.com',
  'stock.adobe.com',
  'adobestock.com',
  'agefotostock.com',
  'pond5.com',
  'bigstockphoto.com',
  'canstockphoto.com',
  'wireimage.com',
  'filmmagic.com',
];
const PREVIEW_PATH_RE = /(^|[/_.-])(preview|watermark(ed)?|comp|thumb(nail)?s?|logo|favicon|placeholder|sprite)([/_.\-?]|$)/i;

export function isDeniedHost(imageUrl) {
  let host;
  try {
    host = new URL(imageUrl).hostname.toLowerCase();
  } catch {
    return true;
  }
  return HOST_DENYLIST.some((denied) => host === denied || host.endsWith(`.${denied}`));
}

/** True for a usable http(s) image URL: not denylisted, not a preview/logo/placeholder path. */
export function isAcceptableImageUrl(imageUrl) {
  if (typeof imageUrl !== 'string' || !/^https?:\/\//i.test(imageUrl)) return false;
  if (isDeniedHost(imageUrl)) return false;
  try {
    return !PREVIEW_PATH_RE.test(new URL(imageUrl).pathname);
  } catch {
    return false;
  }
}

const EXT_BY_CONTENT_TYPE = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** `jpg`/`png`/`webp` from the URL path when it has one; `null` when it has none; `false` for a non-accepted extension. */
export function extFromUrl(imageUrl) {
  const match = /\.([a-z0-9]{2,5})$/i.exec(new URL(imageUrl).pathname);
  if (!match) return null;
  const ext = match[1].toLowerCase();
  if (ext === 'jpeg' || ext === 'jpg') return 'jpg';
  return ext === 'png' || ext === 'webp' ? ext : false;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** The extension for an image URL, asking the host (HEAD) only when the path has none. `null` = not an accepted type. */
export async function resolveExtension(imageUrl, { fetchImpl = fetch } = {}) {
  const fromPath = extFromUrl(imageUrl);
  if (fromPath === false) return null;
  if (fromPath) return fromPath;
  try {
    const res = await fetchImpl(imageUrl, { method: 'HEAD', headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    return EXT_BY_CONTENT_TYPE[String(res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()] ?? null;
  } catch {
    return null;
  }
}

function metaContent(html, names) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = /\b(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
    if (!key || !names.includes(key)) continue;
    const content = /\bcontent\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
    if (content) return content.replace(/&amp;/g, '&').trim();
  }
  return null;
}

/** The page's og:image (preferred) or twitter:image as an absolute URL, or `null`. */
export function extractPageImage(html, pageUrl) {
  const raw =
    metaContent(html, ['og:image', 'og:image:secure_url', 'og:image:url']) ?? metaContent(html, ['twitter:image', 'twitter:image:src']);
  if (!raw) return null;
  try {
    return new URL(raw, pageUrl).toString();
  } catch {
    return null;
  }
}

/** Reads at most `maxBytes` of a response body as text, cancelling the stream once the cap is hit. */
export async function readCapped(res, maxBytes) {
  if (!res.body) return (await res.text()).slice(0, maxBytes);
  const reader = res.body.getReader();
  const chunks = [];
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

/** Fetches an article page and returns its og:image/twitter:image, or `null` on any failure (best effort). */
export async function fetchPageImage(articleUrl, { fetchImpl = fetch } = {}) {
  try {
    const res = await fetchImpl(articleUrl, { headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' }, signal: AbortSignal.timeout(15_000) });
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

/** True when the article's title or description mentions Taylor Swift. */
export function isOnTopicArticle(article) {
  return TOPIC_RE.test(`${article?.title ?? ''} ${article?.description ?? ''}`);
}

/** Deterministic id from the image URL (query/hash stripped) — stable across runs so known ids are skipped. */
export function pressCandidateId(imageUrl) {
  const url = new URL(imageUrl);
  return `press-${createHash('sha1').update(`${url.hostname}${url.pathname}`).digest('hex').slice(0, 12)}`;
}

/** Builds one candidate in the importer's shape, or `null` when the image URL is unusable. */
export function buildPressCandidate(article, imageUrl, ext) {
  if (!ext || !isAcceptableImageUrl(imageUrl)) return null;
  const id = pressCandidateId(imageUrl);
  const outlet = stripHtmlTags(article.source?.name ?? '').trim();
  const title = stripHtmlTags(article.title ?? '').trim();
  const candidate = {
    id,
    mediaPath: `/social/library/photos/${id}.${ext}`,
    source: article.url,
    sourceUrl: imageUrl,
    alt: (title ? `Taylor Swift in the news: ${title}` : 'Taylor Swift press photo').slice(0, 200),
    tags: ['press-photo'],
    minLongEdge: MIN_PRESS_LONG_EDGE_PX,
  };
  if (outlet) candidate.credit = `via ${outlet}`;
  return candidate;
}

/** One GNews search request. Non-OK (quota, auth, 5xx) and network failures throw `SourceApiError`. */
export async function searchGnews(query, apiKey, { fetchImpl = fetch, from } = {}) {
  const params = new URLSearchParams({ q: query, lang: 'en', max: String(GNEWS_PAGE_SIZE), sortby: 'publishedAt', apikey: apiKey });
  if (from) params.set('from', from);
  let res;
  try {
    res = await fetchImpl(`${GNEWS_URL}?${params.toString()}`);
  } catch (err) {
    throw new SourceApiError(`GNews request failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!res.ok) {
    const error = new SourceApiError(`GNews returned ${res.status} ${res.statusText}`.trim());
    error.authFailure = res.status === 401 || res.status === 403;
    throw error;
  }
  const body = await res.json();
  return Array.isArray(body?.articles) ? body.articles : [];
}

/**
 * Sources press-photo candidates. At most `maxRequests` GNews requests (the
 * shared-quota budget); the first API failure stops the run and returns what
 * was gathered, with a warning — never throws for API/quota problems.
 */
export async function sourcePressPhotos({
  apiKey,
  maxRequests = DEFAULT_MAX_REQUESTS,
  queries = PRESS_QUERIES,
  fetchImpl = fetch,
  warn = console.warn,
  sleepImpl = wait,
  delayMs = REQUEST_DELAY_MS,
  now = Date.now(),
} = {}) {
  if (!apiKey) {
    warn('::warning::GNEWS_API_KEY not set — press-photo sourcing skipped (writing []).');
    return [];
  }
  const from = new Date(now - 30 * 3600 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const articles = [];
  for (const query of queries.slice(0, Math.max(0, maxRequests))) {
    try {
      articles.push(...(await searchGnews(query, apiKey, { fetchImpl, from })));
    } catch (err) {
      if (!(err instanceof SourceApiError)) throw err;
      // 401/403 = a rejected or expired key (or exhausted daily quota): make it loud, still exit 0 with [].
      const level = err.authFailure ? 'error' : 'warning';
      warn(`::${level}::press-photo sourcing: ${err.message} — keeping the ${articles.length} article(s) gathered so far.`);
      break;
    }
  }

  const seenArticles = new Set();
  const candidates = [];
  for (const article of articles) {
    if (!article?.url || seenArticles.has(article.url)) continue;
    seenArticles.add(article.url);
    if (!isOnTopicArticle(article) || looksAiGenerated(article.title, article.description)) continue;
    await sleepImpl(delayMs);
    const pageImage = await fetchPageImage(article.url, { fetchImpl });
    for (const imageUrl of [...new Set([pageImage, article.image].filter(Boolean))]) {
      if (!isAcceptableImageUrl(imageUrl)) continue;
      const candidate = buildPressCandidate(article, imageUrl, await resolveExtension(imageUrl, { fetchImpl }));
      if (candidate) candidates.push(candidate);
    }
  }
  return dedupeCandidates(candidates);
}

function parseArgs(argv) {
  const args = { output: null, maxRequests: DEFAULT_MAX_REQUESTS };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--output') args.output = argv[++i];
    else if (argv[i] === '--max-requests') args.maxRequests = Number(argv[++i]);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.output) {
    throw new Error('Usage: GNEWS_API_KEY=... node scripts/social/source-press-photos.mjs --output <candidates.json> [--max-requests 4]');
  }
  if (!Number.isInteger(args.maxRequests) || args.maxRequests < 0) throw new Error('--max-requests must be a non-negative integer.');
  const candidates = await sourcePressPhotos({ apiKey: process.env.GNEWS_API_KEY, maxRequests: args.maxRequests });
  await mkdir(path.dirname(path.resolve(args.output)), { recursive: true });
  await writeFile(path.resolve(args.output), JSON.stringify(candidates, null, 2) + '\n');
  console.log(`source-press-photos: wrote ${candidates.length} candidate(s) to ${args.output}.`);
  return 0;
}

if (process.argv[1] && process.argv[1].split('\\').join('/').endsWith('scripts/social/source-press-photos.mjs')) {
  runMain(main, { name: 'source-press-photos' });
}
