#!/usr/bin/env node
// Openverse photo-sourcing adapter (founder goal 2026-10-07: 10,000+ awesome
// Taylor Swift photos for social). Openverse indexes openly-licensed images
// from Flickr and others, with a machine-readable license per image. Emits a
// candidates JSON file in exactly the shape `import-photo-library.mjs --fetch`
// expects — same contract as source-wikimedia-photos.mjs; this script never
// writes to the library and never touches the live posting pipeline.
//
// RIGHTS BASIS: docs/social/guardrails.md Guardrail 2 (credit the photographer
// when known — we do, from Openverse's `creator`) + docs/decisions.md
// 2026-10-01/2026-09-22. LICENSE FILTER: by, by-sa, cc0, pdm only (no NC/ND),
// checked client-side as well as in the query. HARD BAR: no AI images of
// Taylor — Openverse indexes Flickr "AI art", so any AI marker in
// title/tags drops the photo (looksAiGenerated).
//
// NO KEY: anonymous Openverse access is rate-limited to a handful of requests
// an hour, so this adapter is serial, polite (UA + delay) and budgets
// DEFAULT_MAX_REQUESTS (6) per run. The (query, page) plan advances daily so
// successive runs walk the whole result set; the first 429 stops the run with a
// warning and whatever was gathered is kept. Pool measured 2026-10-07: 240
// photos for "Taylor Swift" alone.
//
// DEDUPE vs Wikimedia: Openverse mirrors Commons. Items whose provider is
// Wikimedia are skipped outright (the Commons adapter already covers them), and
// anything matching a Wikimedia candidate's id/source/image URL (--exclude) is
// dropped.
//
// Usage:
//   node scripts/social/source-openverse-photos.mjs --output candidates.json [--exclude wikimedia.json] [--max-requests 6]

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { URLSearchParams } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { guessEraTag, stripHtmlTags } from './source-wikimedia-photos.mjs';
import {
  SourceApiError,
  TOPIC_RE,
  candidateKeys,
  dedupeCandidates,
  looksAiGenerated,
} from './lib/photo-source-common.mjs';

const API_URL = 'https://api.openverse.org/v1/images/';
export const LICENSES = ['by', 'by-sa', 'cc0', 'pdm'];
export const DEFAULT_QUERIES = [
  'Taylor Swift',
  'Taylor Swift concert',
  'Taylor Swift Eras Tour',
  'Taylor Swift performing live',
  'Taylor Swift 1989 World Tour',
  'Taylor Swift reputation stadium tour',
  'Taylor Swift Speak Now tour',
  'Taylor Swift Red Tour',
];
export const PAGE_SIZE = 20; // the anonymous maximum
export const PAGES_PER_QUERY = 12;
export const DEFAULT_MAX_REQUESTS = 6;
export const REQUEST_DELAY_MS = 2000;
export const MIN_LONG_EDGE_PX = 800;
const SKIPPED_PROVIDERS = new Set(['wikimedia', 'wikimedia_commons']);
const ACCEPTED_FILETYPES = new Set(['jpg', 'jpeg', 'png', 'webp']);
const USER_AGENT = 'longlivets-photo-sourcing/1.0 (https://longlivets.com; social photo pipeline)';

const LICENSE_LABEL = { by: 'CC BY', 'by-sa': 'CC BY-SA', cc0: 'CC0', pdm: 'Public Domain Mark' };

export function isAcceptedOpenverseLicense(license) {
  return LICENSES.includes(String(license ?? '').toLowerCase());
}

/** Candidate in the importer's shape from one Openverse result, or `null` when it fails any filter. */
export function buildOpenverseCandidate(item) {
  if (!item?.id || !item.url || !item.foreign_landing_url) return null;
  if (!isAcceptedOpenverseLicense(item.license)) return null;
  if (item.category && item.category !== 'photograph') return null;
  if (SKIPPED_PROVIDERS.has(String(item.provider ?? '').toLowerCase()) || SKIPPED_PROVIDERS.has(String(item.source ?? '').toLowerCase())) return null;
  const filetype = String(item.filetype ?? '').toLowerCase();
  if (filetype && !ACCEPTED_FILETYPES.has(filetype)) return null;
  const longEdge = Math.max(Number(item.width) || 0, Number(item.height) || 0);
  if (longEdge && longEdge < MIN_LONG_EDGE_PX) return null;
  const tagText = (item.tags ?? []).map((tag) => tag?.name).filter(Boolean).join(' ');
  const title = stripHtmlTags(item.title ?? '').trim();
  if (!TOPIC_RE.test(`${title} ${tagText}`)) return null;
  if (looksAiGenerated(title, tagText)) return null;
  if (item.mature) return null;

  const ext = filetype === 'jpeg' || !filetype ? 'jpg' : filetype;
  const id = `openverse-${item.id}`;
  const label = `${LICENSE_LABEL[String(item.license).toLowerCase()]}${item.license_version ? ` ${item.license_version}` : ''}`;
  const creator = stripHtmlTags(item.creator ?? '').trim() || String(item.provider ?? 'Openverse');
  const eraTag = guessEraTag(title);
  return {
    id,
    mediaPath: `/social/library/photos/${id}.${ext}`,
    credit: `${creator} (${label}), via Openverse`,
    source: item.foreign_landing_url,
    sourceUrl: item.url,
    alt: (title ? `Taylor Swift photo: ${title}` : 'Taylor Swift photo from Openverse').slice(0, 200),
    tags: ['fan-photo', ...(eraTag ? [eraTag] : [])],
    minLongEdge: MIN_LONG_EDGE_PX,
  };
}

/** One Openverse search request. 429/other non-OK and network failures throw `SourceApiError` (`.rateLimited` for 429). */
export async function searchOpenverse(query, page, { fetchImpl = fetch } = {}) {
  const params = new URLSearchParams({
    q: query,
    license: LICENSES.join(','),
    category: 'photograph',
    page_size: String(PAGE_SIZE),
    page: String(page),
    mature: 'false',
  });
  let res;
  try {
    res = await fetchImpl(`${API_URL}?${params.toString()}`, { headers: { 'User-Agent': USER_AGENT } });
  } catch (err) {
    throw new SourceApiError(`Openverse request failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  // A page past the end of the result set is a 400/404, not an outage.
  if ((res.status === 400 || res.status === 404) && page > 1) return [];
  if (!res.ok) {
    const error = new SourceApiError(`Openverse returned ${res.status} ${res.statusText}`.trim());
    error.rateLimited = res.status === 429;
    throw error;
  }
  const body = await res.json();
  return Array.isArray(body?.results) ? body.results : [];
}

/** The (query, page) requests for this run: a window of `maxRequests` that advances with the UTC day. */
export function planRequests(queries, maxRequests, now = Date.now()) {
  const all = queries.flatMap((query) => Array.from({ length: PAGES_PER_QUERY }, (_, i) => ({ query, page: i + 1 })));
  if (!all.length || maxRequests <= 0) return [];
  const start = (Math.floor(now / 86_400_000) * maxRequests) % all.length;
  return Array.from({ length: Math.min(maxRequests, all.length) }, (_, i) => all[(start + i) % all.length]);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sources Openverse candidates. Serial, `delayMs` apart. Any API failure is a
 * warning: a 429 stops the run, other failures skip that request; the
 * candidates gathered so far are returned. Only real bugs throw.
 */
export async function sourceOpenversePhotos({
  queries = DEFAULT_QUERIES,
  maxRequests = DEFAULT_MAX_REQUESTS,
  excludeKeys = new Set(),
  fetchImpl = fetch,
  warn = console.warn,
  sleepImpl = wait,
  delayMs = REQUEST_DELAY_MS,
  now = Date.now(),
} = {}) {
  const candidates = [];
  let first = true;
  for (const { query, page } of planRequests(queries, maxRequests, now)) {
    if (!first) await sleepImpl(delayMs);
    first = false;
    try {
      for (const item of await searchOpenverse(query, page, { fetchImpl })) {
        const candidate = buildOpenverseCandidate(item);
        if (candidate) candidates.push(candidate);
      }
    } catch (err) {
      if (!(err instanceof SourceApiError)) throw err;
      warn(`::warning::openverse sourcing: ${err.message} (query "${query}", page ${page}).`);
      if (err.rateLimited) break;
    }
  }
  return dedupeCandidates(candidates, { excludeKeys });
}

function parseArgs(argv) {
  const args = { output: null, exclude: null, maxRequests: DEFAULT_MAX_REQUESTS };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--output') args.output = argv[++i];
    else if (argv[i] === '--exclude') args.exclude = argv[++i];
    else if (argv[i] === '--max-requests') args.maxRequests = Number(argv[++i]);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.output) {
    throw new Error('Usage: node scripts/social/source-openverse-photos.mjs --output <candidates.json> [--exclude <wikimedia-candidates.json>] [--max-requests 6]');
  }
  if (!Number.isInteger(args.maxRequests) || args.maxRequests < 0) throw new Error('--max-requests must be a non-negative integer.');
  let excludeKeys = new Set();
  if (args.exclude) {
    try {
      excludeKeys = candidateKeys(JSON.parse(await readFile(path.resolve(args.exclude), 'utf8')));
    } catch (err) {
      if (err?.code !== 'ENOENT') throw err;
    }
  }
  const candidates = await sourceOpenversePhotos({ maxRequests: args.maxRequests, excludeKeys });
  await mkdir(path.dirname(path.resolve(args.output)), { recursive: true });
  await writeFile(path.resolve(args.output), JSON.stringify(candidates, null, 2) + '\n');
  console.log(`source-openverse-photos: wrote ${candidates.length} candidate(s) to ${args.output}.`);
  return 0;
}

if (process.argv[1] && process.argv[1].split('\\').join('/').endsWith('scripts/social/source-openverse-photos.mjs')) {
  runMain(main, { name: 'source-openverse-photos' });
}
