// Enumerates every outbound link the site can render, grouped by link class,
// for scripts/check-link-liveness.mjs (DoD item 5, issue #4324). Pure and
// deterministic: reads files, never touches the network.
//
// Classes (a URL found in more than one keeps every class it appears in):
//   source     — citations and other outbound URLs in supabase/seed/** (the
//                generated vaults are built from these files)
//   shop       — product / alt-listing URLs (content `products[]`, merch catalogues)
//   community  — data/communities.json (the Community/Marketplace surface)
//   app        — URLs hard-coded in apps/**, packages/**/src (footer, social
//                links, deep links), minus infra/API endpoints
// Images are NOT links and are covered by the image-liveness checkers
// (content-engine + merch-engine/verify-images.mjs), so they are skipped here.
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const LINK_CLASSES = ['source', 'shop', 'community', 'app'];

const IMG_EXT = /\.(?:jpe?g|png|gif|webp|svg|avif|ico)(?:[?#]|$)/i;
const IMG_HOST = /^(?:i\.ytimg\.com|upload\.wikimedia\.org|cdn\.shopify\.com|i\.etsystatic\.com|m\.media-amazon\.com|akns-images\.eonline\.com|cdn\.mos\.cms\.futurecdn\.net|media\.gettyimages\.com|townsquare\.media|media-cldnry\.s-nbcnews\.com|imagez\.tmz\.com|i\.abcnewsfe\.com|cdna\.lystit\.com|.+\.cloudfront\.net|.+\.googleusercontent\.com)$/i;
const IMG_PATH = /\/(?:thmb|wp-content\/uploads|api\/img)\//i;
// Endpoints, XML namespaces, example hosts and our own API routes: real URLs,
// but not links a visitor follows.
const NON_LINK_HOST = /^(?:api\.|.+\.api\.|schema\.org$|(?:www\.)?w3\.org$|example\.(?:com|org)$|localhost|127\.|exp\.host$|u\.expo\.dev$|nextjs\.org$|vercel\.|va\.vercel|openapi\.vercel|challenges\.cloudflare|.+\.supabase\.co$|swift2-web|(?:www\.)?longlivets\.com$|lookaside\.instagram\.com$|www\.youtube-nocookie\.com$)/i;
const NON_LINK_URL = /\/api\/|\/oembed\b|\/rss\/articles\/|\/feed(?:s)?\/|[?&]$|=$|\/(?:ID|XXXXXXXXXXX)$|\$\{|\{|…|\.\.\./;
const SCAN_ROOTS = { app: ['apps/web', 'apps/mobile', 'apps/worker', 'packages'] };
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', '.expo', 'dist', 'build', 'public', 'fixtures', 'generated']);

// Drops whole-line `//` comments and block comments so commented-out URLs
// (and URLs quoted in explanatory comments) are not probed.
export function stripComments(text) {
  return text.replace(/(^|\s)\/\*[\s\S]*?\*\//g, '$1').split('\n').filter((line) => !/^\s*\/\//.test(line)).join('\n');
}

function trimUrl(raw) {
  let url = raw.replace(/&amp;/g, '&');
  for (;;) {
    const t = url.replace(/[.,;:]+$/, '');
    const open = (t.match(/\(/g) || []).length;
    const close = (t.match(/\)/g) || []).length;
    if (t.endsWith(')') && close > open) url = t.slice(0, -1);
    else return t;
  }
}

/**
 * Finds every absolute URL in source text. Quoted strings win (so an apostrophe
 * inside a double-quoted URL such as "…/Say_Don't_Go" is not a terminator);
 * a trailing `)` is dropped only when unbalanced (Wikipedia `…_(song)` pages).
 */
export function extractUrls(text) {
  const found = [];
  const rest = stripComments(text).replace(/(["'`])(https?:\/\/[^\s]*?)\1/g, (_m, _q, url) => {
    found.push(url);
    return ' ';
  });
  found.push(...(rest.match(/https?:\/\/[^\s"'`\]<>\\]+/g) || []));
  return found.map(trimUrl);
}

/** True when `url` is an outbound page link worth probing. */
export function isProbeable(url) {
  let parsed;
  try { parsed = new URL(url); } catch { return false; }
  if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(parsed.hostname)) return false;
  if (IMG_EXT.test(url) || IMG_HOST.test(parsed.hostname) || IMG_PATH.test(parsed.pathname)) return false;
  if (NON_LINK_HOST.test(parsed.hostname) || NON_LINK_URL.test(url)) return false;
  return true;
}

async function walk(dir, exts, skipFile) {
  const out = [];
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) out.push(...(await walk(p, exts, skipFile))); }
    else if (exts.some((x) => e.name.endsWith(x)) && !skipFile(e.name)) out.push(p);
  }
  return out;
}

/** Flattens product and alt-listing URLs without changing their destination. */
export function productTargets(catalogue) {
  const targets = [];
  for (const products of Object.values(catalogue)) {
    for (const [index, product] of products.entries()) {
      const productId = product.source
        ? `${product.source.eraId}:${product.source.momentId}:${index}`
        : `${product.category ?? 'merch'}:${index}`;
      targets.push({ productId, url: product.url, imageUrl: product.imageUrl ?? null, listing: 'primary' });
      if (product.altListing?.url) {
        targets.push({ productId, url: product.altListing.url, listing: 'alternative' });
      }
    }
  }
  return targets;
}

export async function productTargetsFromSeed(root = process.cwd()) {
  const SEED_DIR = join(root, 'supabase', 'seed');
  const targets = [];
  const files = await readdir(join(SEED_DIR, 'content')).catch(() => []);
  for (const file of files.filter((name) => name.endsWith('.mjs') && !name.startsWith('_'))) {
    const data = await import(pathToFileURL(join(SEED_DIR, 'content', file)).href);
    const payload = data.default ?? data.items ?? Object.values(data)[0];
    const items = Array.isArray(payload) ? payload : payload?.items ?? [];
    const eraId = payload?.era ?? file.replace('.mjs', '');
    for (const [itemIndex, item] of items.entries()) {
      const itemId = `${eraId}:${item.id ?? itemIndex}`;
      for (const [productIndex, product] of (item.moment?.products ?? []).entries()) {
        const productId = `${itemId}:${productIndex}`;
        targets.push({ productId, url: product.url, imageUrl: product.imageUrl ?? null, listing: 'primary' });
        if (product.altListing?.url) targets.push({ productId, url: product.altListing.url, listing: 'alternative' });
      }
    }
  }
  try {
    const merchFiles = await readdir(join(SEED_DIR, 'merch'));
    for (const file of merchFiles.filter((name) => name.endsWith('.mjs') && !name.startsWith('_'))) {
      const data = await import(pathToFileURL(join(SEED_DIR, 'merch', file)).href);
      const products = data.default ?? Object.values(data).find(Array.isArray) ?? [];
      targets.push(...productTargets({ [file.replace('.mjs', '')]: products }));
    }
  } catch { /* the E4 catalogue may not exist until its dedicated lane authors it */ }
  return targets;
}

/**
 * Returns [{ url, classes: [...], files: [...] }] — one row per unique probeable URL.
 * `root` is the repo root; `classes` restricts which classes are collected.
 */
export async function enumerateTargets(root, classes = LINK_CLASSES) {
  const byUrl = new Map();
  const add = (url, cls, file) => {
    if (!isProbeable(url)) return;
    const row = byUrl.get(url) ?? { url, classes: new Set(), files: new Set() };
    row.classes.add(cls);
    if (row.files.size < 3) row.files.add(file);
    byUrl.set(url, row);
  };
  const scan = async (files, cls) => {
    for (const file of files) {
      let text;
      try { text = await readFile(file, 'utf8'); } catch { continue; }
      for (const url of extractUrls(text)) add(url, cls, relative(root, file).split(sep).join('/'));
    }
  };
  if (classes.includes('source') || classes.includes('shop')) {
    // candidates/ is staged, never seeded; _example.* files are templates.
    const seedFiles = await walk(join(root, 'supabase', 'seed'), ['.mjs'], (n) => n.startsWith('_'));
    if (classes.includes('source')) {
      await scan(seedFiles.filter((f) => !f.split(sep).includes('candidates')), 'source');
    }
    if (classes.includes('shop')) for (const p of await productTargetsFromSeed(root)) add(p.url, 'shop', 'supabase/seed (products)');
  }
  if (classes.includes('community')) await scan(await walk(join(root, 'data'), ['.json'], () => false), 'community');
  if (classes.includes('app')) {
    for (const dir of SCAN_ROOTS.app) {
      await scan(await walk(join(root, dir), ['.ts', '.tsx', '.js', '.mjs'], (n) => /\.(?:test|spec|generated)\./.test(n)), 'app');
    }
  }
  return [...byUrl.values()].map((r) => ({ url: r.url, classes: [...r.classes].sort(), files: [...r.files] }));
}
