#!/usr/bin/env node
// Saves a rendered share card as a committed social-media asset (S2,
// docs/decisions.md 2026-10-01: a card is a sanctioned image source; Tree
// decides whether a post uses one). The card itself is rendered by the site's
// own /api/share-card route (apps/web/app/api/share-card/route.tsx — the query
// only SELECTS allowlisted ids, it never supplies text); this script fetches the
// PNG (following the route's 308 to the canonical URL) and writes it under
// apps/web/public/social/library/cards/ for Tree to commit.
//
// (scripts/social/render-card.mjs is a different tool — the local typography
// renderer — so this one is named for what it does.)
//
//   node --use-env-proxy scripts/social/fetch-share-card.mjs \
//     --query "type=era&id=midnights" --name midnights-era
//   node --use-env-proxy scripts/social/fetch-share-card.mjs \
//     --url "https://www.longlivets.com/api/share-card?type=era&id=midnights" --name midnights-era
//
// Prints the queue-item fields to set: mediaKind "card", media, mediaCredit
// "Long Live", and `cardUrl` (the final canonical URL the PNG came from).
// Cards never reproduce lyrics (docs/social/guardrails.md) — the route only
// renders titles, dates, numbers and sourced quotes, but the post's own body
// is still yours to keep lyric-free.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CARD_PREFIX, CARD_SOURCE_ORIGIN, CARD_SOURCE_PATH, CARD_CREDIT } from './lib/draft-taste.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CARDS_DIR = path.join(ROOT, 'apps', 'web', 'public', 'social', 'library', 'cards');
const MAX_BYTES = 1_500_000;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** The share-card URL for `--url` (must be the real route) or `--query`. Throws on anything else. */
export function buildCardUrl({ url, query }) {
  const u = url ? new URL(url) : new URL(`${CARD_SOURCE_ORIGIN}${CARD_SOURCE_PATH}?${String(query ?? '').replace(/^\?/, '')}`);
  if (u.origin !== CARD_SOURCE_ORIGIN || u.pathname !== CARD_SOURCE_PATH) {
    throw new Error(`card URL must be ${CARD_SOURCE_ORIGIN}${CARD_SOURCE_PATH}?… (got ${u.origin}${u.pathname})`);
  }
  return u.toString();
}

export function cardFileName(name) {
  const slug = String(name ?? '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!slug) throw new Error('--name is required (letters, digits, hyphens).');
  return `${slug}.png`;
}

export async function fetchShareCard({ url, query, name }, { fetchImpl = fetch, dir = CARDS_DIR } = {}) {
  const requested = buildCardUrl({ url, query });
  const file = cardFileName(name);
  const res = await fetchImpl(requested, { redirect: 'follow' });
  if (!res.ok) throw new Error(`share-card fetch failed: HTTP ${res.status} for ${requested}`);
  const png = Buffer.from(await res.arrayBuffer());
  if (png.length < PNG_SIGNATURE.length || !png.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${requested} did not return a PNG (content-type ${res.headers.get('content-type')}).`);
  }
  if (png.length > MAX_BYTES) throw new Error(`card is ${png.length} bytes (> ${MAX_BYTES}); pick a lighter card.`);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, file), png);
  return { media: `${CARD_PREFIX}${file}`, cardUrl: res.url || requested, bytes: png.length };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.name || (!args.url && !args.query)) {
    console.error('Usage: fetch-share-card.mjs --name <slug> (--query "type=era&id=midnights" | --url https://www.longlivets.com/api/share-card?…)');
    process.exit(1);
  }
  const r = await fetchShareCard({ url: args.url, query: args.query, name: args.name });
  console.log(`Wrote apps/web/public${r.media} (${(r.bytes / 1024).toFixed(0)} KB). Queue item fields:`);
  console.log(JSON.stringify({ mediaKind: 'card', media: [r.media], cardUrl: r.cardUrl, mediaCredit: CARD_CREDIT }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((err) => {
    console.error(`fetch-share-card: ${err.message ?? err}`);
    process.exit(1);
  });
}
