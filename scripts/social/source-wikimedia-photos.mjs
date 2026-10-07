#!/usr/bin/env node
// Wikimedia Commons concert-photo sourcing adapter (follow-up to PR #4529/
// #4592 — founder directive 2026-09-28/29: photo library was starved
// per-era, forcing single-photo eras like reputation/folklore to
// repeat on every themed post; 2 Reddit subreddits alone cannot scale to the
// founder's stated target of thousands of photos). Discovers freely-licensed
// Taylor Swift Eras Tour photos already indexed on Wikimedia Commons and
// emits a candidates JSON file in exactly the shape
// `import-photo-library.mjs --fetch` expects — same contract as
// `source-reddit-photos.mjs`, this script never writes to the library
// itself and never touches the live social-posting pipeline
// (post-queue.mjs/delete-media.mjs).
//
// WHY WIKIMEDIA: several of the ORIGINAL 10 photos in social/photo-library.json
// already came from Commons (see e.g. "1989-inglewood-2023") — it is a proven
// source for this project, not new infrastructure. Its search API
// (api.php?action=query&list=search&srnamespace=6) returned 2,206 hits for
// "Taylor Swift Eras Tour" alone during design (2026-09-29) — enough raw
// volume to make real progress toward the founder's 3000-photo target across
// many scheduled runs. Every returned file's `imageinfo.extmetadata` carries
// an explicit machine-readable license (`LicenseShortName`) and photographer
// attribution (`Artist`), so licensing is verified per-photo, not assumed.
//
// LICENSE FILTER: only files whose extmetadata declares a Commons-accepted
// free license (CC BY / CC BY-SA / CC0 / public domain family) are kept —
// see ACCEPTED_LICENSE_RE below. A file with no machine-readable license
// metadata, or a non-free one, is skipped outright rather than assumed safe.
//
// Usage:
//   node scripts/social/source-wikimedia-photos.mjs --output candidates.json [--query "..."] [--limit 50]
//
// Then:
//   node scripts/social/import-photo-library.mjs --input candidates.json --fetch --write

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { URLSearchParams } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { DEFAULT_QUERIES } from './lib/wikimedia-queries.mjs';

export { DEFAULT_QUERIES };

const API_BASE = 'https://commons.wikimedia.org/w/api.php';
export const DEFAULT_QUERY = 'Taylor Swift Eras Tour';
export const DEFAULT_LIMIT = 50;
// Politeness gap between Commons API requests (serial, never concurrent).
export const REQUEST_DELAY_MS = 250;

// Wikimedia's API etiquette policy asks every automated client to identify
// itself; an unidentified client is more likely to be rate-limited.
const USER_AGENT = 'longlivets-photo-sourcing/1.0 (https://longlivets.com; social photo pipeline)';

// Commons-accepted free licenses only. Checked against `extmetadata.License`
// (a normalized slug like "cc-by-2.0" or "cc0-1.0", not the human-readable
// LicenseShortName like "CC BY 2.0" which varies in spacing/casing). A file
// with no match here (including missing extmetadata entirely) is skipped —
// never assumed free.
const ACCEPTED_LICENSE_RE = /^(cc-by(-sa)?-\d(\.\d)?|cc0(-1\.0)?|pd|public domain)/i;

// Same era-keyword approach as source-reddit-photos.mjs's guessEraTag —
// applied here to the Commons file title + ImageDescription (both far more
// structured/reliable than a Reddit post title, since Commons categories and
// descriptions are curated by uploaders/reviewers). Deliberately reuses the
// identical conservative philosophy: an unambiguous match only, never a
// wrong guess.
export const ERA_KEYWORD_HINTS = [
  { era: 'debut', re: /\b(debut era|taylor swift \(album\))\b/i },
  { era: 'fearless', re: /\bfearless\b/i },
  { era: 'speak-now', re: /\bspeak now\b/i },
  { era: 'red', re: /\bred act\b|\bred era\b|\bred tour\b/i },
  { era: '1989', re: /\b1989\s*(act|era|world tour)\b/i },
  { era: 'reputation', re: /\breputation\b/i },
  { era: 'lover', re: /\blover\s*(act|era|fest)\b/i },
  { era: 'folklore', re: /\bfolklore\b/i },
  { era: 'evermore', re: /\bevermore\b/i },
  { era: 'midnights', re: /\bmidnights?\s*(act|era)\b/i },
  { era: 'tortured-poets', re: /\b(tortured poets|ttpd)\b/i },
  { era: 'the-life-of-a-showgirl', re: /\b(life of a showgirl|tloas|showgirl)\b/i },
];

export function guessEraTag(text) {
  for (const hint of ERA_KEYWORD_HINTS) {
    if (hint.re.test(text ?? '')) return hint.era;
  }
  return null;
}

/** True when a Commons file's declared license is one Commons itself treats as free-to-reuse. */
export function isAcceptedLicense(licenseSlug) {
  return typeof licenseSlug === 'string' && ACCEPTED_LICENSE_RE.test(licenseSlug.trim());
}

function extFromTitle(title) {
  const match = /\.(jpe?g|png|gif|webp)$/i.exec(title ?? '');
  return match ? match[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

/** Deterministic candidate id from a Commons page id — stable across runs. */
export function candidateId(pageId) {
  return `wikimedia-${pageId}`;
}

// Strips HTML tags from Commons metadata text (e.g. Artist/ImageDescription
// can contain italic/link markup). A single regex pass can be bypassed by
// nested/malformed markup (e.g. "<<script>alert(1)</script>" leaves
// "<script>alert(1)" behind after one pass) — loop until a pass makes no
// further change, which fully removes any nested/overlapping tag structure.
// CodeQL flagged the original single-pass version as a potential HTML
// injection vector (PR #4613 review) — this text is stored as photo
// credit/alt metadata that later renders on the public site.
export function stripHtmlTags(text) {
  let previous;
  let current = text;
  do {
    previous = current;
    current = previous.replace(/<[^>]*>/g, '');
  } while (current !== previous);
  return current;
}

// Only real raster photos: Commons search also returns DjVu/PDF scans, TIFF,
// SVG, GIF and video (2026-10-06: a DjVu book scan crashed the first run).
export const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// Long edge in px — drops thumbnails, icons and logos.
export const MIN_LONG_EDGE_PX = 800;
const TOPIC_RE = /taylor swift/i;

/** True for a jpeg/png/webp at least MIN_LONG_EDGE_PX on its long edge. */
export function isUsablePhotoFile(info) {
  if (!ACCEPTED_MIME_TYPES.includes(String(info?.mime ?? '').toLowerCase())) return false;
  return Math.max(Number(info.width) || 0, Number(info.height) || 0) >= MIN_LONG_EDGE_PX;
}

/** True when title, name, description or categories mention Taylor Swift. */
export function isOnTopic(page, meta) {
  const text = [page?.title, meta.ObjectName?.value, meta.ImageDescription?.value, meta.Categories?.value].join(' ');
  return TOPIC_RE.test(text);
}

/**
 * Builds one candidate object in `import-photo-library.mjs --fetch`'s exact
 * expected shape from a Commons `imageinfo` page result. Returns `null` when
 * the file isn't a large-enough jpeg/png/webp, doesn't mention Taylor Swift,
 * or its license isn't in the accepted free-license set (caller should
 * skip it, never fall back to including it unlicensed).
 */
export function buildCandidate(page) {
  const info = page?.imageinfo?.[0];
  if (!info) return null;
  const meta = info.extmetadata ?? {};
  if (!isUsablePhotoFile(info)) return null;
  if (!isOnTopic(page, meta)) return null;
  const licenseSlug = meta.License?.value;
  if (!isAcceptedLicense(licenseSlug)) return null;
  const licenseShortName = meta.LicenseShortName?.value ?? licenseSlug;

  const id = candidateId(page.pageid);
  const artist = stripHtmlTags(meta.Artist?.value ?? 'Unknown').trim() || 'Unknown';
  const description = stripHtmlTags(meta.ImageDescription?.value ?? page.title ?? '').trim();
  const ext = extFromTitle(page.title);
  const eraTag = guessEraTag(`${page.title} ${description}`);
  const tags = ['fan-photo', 'eras-tour'];
  if (eraTag) tags.push(eraTag);

  return {
    id,
    mediaPath: `/social/library/photos/${id}.${ext}`,
    credit: `${artist} (${licenseShortName}), via Wikimedia Commons`,
    source: info.descriptionurl,
    sourceUrl: info.url,
    alt: description ? description.slice(0, 200) : `Taylor Swift photo from Wikimedia Commons: ${page.title}`.slice(0, 200),
    tags,
  };
}

/** One paginated Commons search request for free-licensed Taylor Swift files. */
export async function searchCommons(query, { limit = DEFAULT_LIMIT, fetchImpl = fetch, sroffset = 0 } = {}) {
  const searchUrl = new URL(API_BASE);
  searchUrl.search = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    srnamespace: '6',
    srlimit: String(Math.min(limit, 50)),
    sroffset: String(sroffset),
    format: 'json',
  }).toString();
  const res = await fetchImpl(searchUrl.toString(), { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Wikimedia search failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data?.query?.search ?? [];
}

/** Fetches imageinfo (url + license/artist metadata) for a batch of Commons file titles. */
export async function fetchImageInfo(titles, { fetchImpl = fetch } = {}) {
  if (!titles.length) return [];
  const infoUrl = new URL(API_BASE);
  infoUrl.search = new URLSearchParams({
    action: 'query',
    titles: titles.join('|'),
    prop: 'imageinfo',
    iiprop: 'url|mime|size|extmetadata',
    format: 'json',
  }).toString();
  const res = await fetchImpl(infoUrl.toString(), { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Wikimedia imageinfo failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return Object.values(data?.query?.pages ?? {});
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sources up to `limit` license-verified candidates for one search query,
 * paging the Commons search API 50 results at a time. Requests are serial
 * with a short delay between them (Commons API etiquette). Commons'
 * `prop=imageinfo` accepts at most 50 titles per request, matching the page size.
 */
export async function sourceWikimediaQuery(
  query,
  { limit = DEFAULT_LIMIT, fetchImpl = fetch, warn = console.warn, sleepImpl = wait, delayMs = REQUEST_DELAY_MS } = {},
) {
  const candidates = [];
  let titlesSeen = 0;
  while (titlesSeen < limit) {
    if (titlesSeen > 0) await sleepImpl(delayMs);
    const pageSize = Math.min(limit - titlesSeen, 50);
    const results = await searchCommons(query, { limit: pageSize, fetchImpl, sroffset: titlesSeen });
    if (!results.length) break;
    await sleepImpl(delayMs);
    const pages = await fetchImageInfo(results.map((r) => r.title), { fetchImpl });
    for (const page of pages) {
      const candidate = buildCandidate(page);
      if (candidate) candidates.push(candidate);
      else warn(`source-wikimedia-photos: skipped "${page.title}" — not an accepted on-topic, free-licensed photo.`);
    }
    titlesSeen += results.length;
    if (results.length < pageSize) break;
  }
  return candidates;
}

/** De-dupes candidates by id, keeping the first occurrence (stable order). */
export function dedupeById(candidates) {
  const seen = new Set();
  const out = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    out.push(candidate);
  }
  return out;
}

function parseArgs(argv) {
  const args = { query: DEFAULT_QUERY, limit: DEFAULT_LIMIT, output: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--output') args.output = argv[++i];
    else if (arg === '--query') args.query = argv[++i];
    else if (arg === '--limit') args.limit = Number(argv[++i]);
    else if (arg === '--list-default-queries') args.listQueries = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.listQueries) {
    console.log(DEFAULT_QUERIES.join('\n'));
    return 0;
  }
  if (!args.output) {
    throw new Error(
      'Usage: node scripts/social/source-wikimedia-photos.mjs --output <candidates.json> [--query "Taylor Swift Eras Tour"] [--limit 50]',
    );
  }

  const found = await sourceWikimediaQuery(args.query, { limit: args.limit });
  console.log(`source-wikimedia-photos: query "${args.query}" — ${found.length} license-verified candidate(s).`);

  const deduped = dedupeById(found);
  await mkdir(path.dirname(path.resolve(args.output)), { recursive: true });
  await writeFile(path.resolve(args.output), JSON.stringify(deduped, null, 2) + '\n');
  console.log(`source-wikimedia-photos: wrote ${deduped.length} candidate(s) to ${args.output}.`);
  return 0;
}

if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/social/source-wikimedia-photos.mjs')
) {
  runMain(main, { name: 'source-wikimedia-photos' });
}
