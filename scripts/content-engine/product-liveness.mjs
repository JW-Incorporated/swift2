#!/usr/bin/env node
// Product-liveness helper for the Stylist role.
//
// READ-ONLY on content. Extracts every `moment.products[].url` from the
// authored seed files and (optionally) HTTP-checks a batch of them for
// liveness, so the Stylist's MAINTAIN pass can spot sold-out / dead retailer
// links without hand-grepping each era file.
//
// Usage:
//   node scripts/content-engine/product-liveness.mjs list          # print every product URL as JSON
//   node scripts/content-engine/product-liveness.mjs check [N]      # HTTP-check the first N (default 15) URLs
//   node scripts/content-engine/product-liveness.mjs images [N]     # capture real product photos as JSON
//
// The `check` mode uses a browser-like User-Agent. Many luxury retailers
// (christianlouboutin.com, cartier.com, freepeople.com, …) hard-block all
// automated requests with 403 regardless of headers — a 403 here means
// "could not verify", NOT "dead". Only a 404, a 200 that redirects to a bare
// homepage, or a hard connection failure is real evidence a link is dead.
//
// `images` mode (merch product photos, #7 2026-08-15 punch list): for a
// product URL shaped like `/products/<handle>`, Shopify stores also serve
// `/products/<handle>.json` with no auth, whose `images[0].src` is a real
// product photo hotlinkable straight from `cdn.shopify.com`. A 404 there is
// AMBIGUOUS — it means "not a Shopify store" OR "the product was delisted",
// and the two are never conflated: only a 200 that parses and has an
// `images[0].src` is reported CAPTURED. `KNOWN_NON_SHOPIFY` skips hosts
// already confirmed unreachable this way, so repeat runs don't re-spend
// requests proving the same negative.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const DIR = join(process.cwd(), 'supabase/seed/content');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120 Safari/537.36';

export async function extract() {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.mjs') && !f.startsWith('_'));
  const rows = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(join(DIR, f)).href);
    const data = mod.default || mod.items || Object.values(mod)[0];
    const items = Array.isArray(data) ? data : data.items || [];
    const era = (data && data.era) || f.replace('.mjs', '');
    for (const it of items) {
      const prods = it && it.moment && it.moment.products;
      if (!Array.isArray(prods)) continue;
      prods.forEach((p, i) => {
        rows.push({
          file: f,
          era,
          title: it.title,
          index: i,
          brand: p.brand,
          item: p.item,
          retailer: p.retailer,
          url: p.url,
          inStock: p.inStock,
          isAlternative: !!p.isAlternative,
        });
      });
    }
  }
  return rows;
}

async function head(url) {
  // AbortController rather than AbortSignal.timeout(): the shared eslint config
  // for scripts/**.mjs whitelists AbortController and not AbortSignal, and
  // adding the latter there trips no-redeclare when eslint lints its own
  // config. Same behaviour, no config surgery.
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 30_000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      signal: abort.signal,
    });
    return { status: res.status, finalUrl: res.url };
  } catch (e) {
    return { status: 0, finalUrl: null, error: String((e && e.message) || e) };
  } finally {
    clearTimeout(timer);
  }
}

function isHomepageRedirect(url, finalUrl) {
  if (!finalUrl) return false;
  try {
    const f = new URL(finalUrl);
    // Redirected to a bare host root (no meaningful path) = product gone.
    return f.pathname === '/' || f.pathname === '';
  } catch {
    return false;
  }
}

// Hosts confirmed NOT reachable via the Shopify JSON endpoint (2026-08-15
// probe) — skipped without a network call so repeat runs don't re-spend
// requests proving the same negative. Append here, never delete, as more
// hosts get confirmed non-Shopify.
const KNOWN_NON_SHOPIFY = new Set([
  'amazon.com',
  'nordstrom.com',
  'ssense.com',
  'tiffany.com',
  'louisvuitton.com',
  'bergdorfgoodman.com',
  'maccosmetics.com',
  'ulta.com',
  'revolve.com',
  'fwrd.com',
  'thereformation.com',
  'tecovas.com',
  'skims.com',
  'showpo.com',
  'fashionnova.com',
  'davidkoma.com',
]);

/**
 * For a URL shaped like `/products/<handle>`, the Shopify-style JSON
 * companion endpoint `<origin>/products/<handle>.json`. Returns null for
 * anything not shaped that way — not every retailer is Shopify, and this is
 * a pattern match only, not proof (see AMBIGUOUS verdict below).
 */
export function shopifyJsonUrl(url) {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/^(\/products\/[^/?#]+)\/?$/i);
    if (!m) return null;
    return `${u.origin}${m[1]}.json`;
  } catch {
    return null;
  }
}

/**
 * Fetches a product's Shopify JSON (when its url is shaped like one) and
 * captures `images[0].src` — the real product photo, hotlinked straight from
 * the retailer's CDN, never downloaded/re-hosted. A 404 here is genuinely
 * ambiguous (not-Shopify vs delisted) and is reported as AMBIGUOUS, never as
 * a plain miss — conflating the two would silently hide a delisted product
 * behind "we just couldn't tell".
 */
export async function fetchProductImage(url, retailer) {
  if (retailer && KNOWN_NON_SHOPIFY.has(retailer)) {
    return { verdict: 'SKIP(known non-Shopify host)', imageUrl: null };
  }
  const jsonUrl = shopifyJsonUrl(url);
  if (!jsonUrl) return { verdict: 'SKIP(url is not shaped like /products/<handle>)', imageUrl: null };
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 30_000);
  try {
    const res = await fetch(jsonUrl, {
      method: 'GET',
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: abort.signal,
    });
    if (res.status === 404) return { verdict: 'AMBIGUOUS(404 — not-Shopify or delisted)', imageUrl: null };
    if (res.status === 403) return { verdict: 'BLOCKED(403 — unverifiable)', imageUrl: null };
    if (res.status !== 200) return { verdict: `HTTP ${res.status}`, imageUrl: null };
    let body;
    try {
      body = await res.json();
    } catch {
      return { verdict: 'ERROR(non-JSON response — not Shopify)', imageUrl: null };
    }
    const src = body && body.product && Array.isArray(body.product.images) && body.product.images[0]?.src;
    if (typeof src === 'string' && src.trim()) {
      const imageUrl = src.startsWith('//') ? `https:${src}` : src;
      return { verdict: 'CAPTURED', imageUrl };
    }
    return { verdict: 'PARSED(no images[0].src)', imageUrl: null };
  } catch (e) {
    return { verdict: `ERROR(${String((e && e.message) || e)})`, imageUrl: null };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const [, , cmd = 'list', nArg] = process.argv;
  const rows = await extract();
  if (cmd === 'list') {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  if (cmd === 'check') {
    const n = Number(nArg) || 15;
    // Optional 3rd arg: a comma-separated list of era prefixes to restrict the
    // batch to (e.g. `check 15 fearless,folklore`). Lets the Stylist's MAINTAIN
    // pass target the least-recently-checked eras instead of always re-checking
    // the same alphabetical head of the corpus. Omit it and behaviour is
    // unchanged: the first N URLs in file order.
    const eraArg = process.argv[4];
    const eras = eraArg ? eraArg.split(',').map((e) => e.trim()).filter(Boolean) : null;
    const pool = eras ? rows.filter((r) => eras.some((e) => r.era === e)) : rows;
    const batch = pool.slice(0, n);
    let first = true;
    for (const r of batch) {
      // Space requests ~1.5s apart: most product retailers are Shopify stores
      // that 429 (rate-limit) rapid bursts, and a 429 tells the Stylist nothing.
      if (!first) await new Promise((res) => setTimeout(res, 1500));
      first = false;
      const { status, finalUrl, error } = await head(r.url);
      const homeRedirect = isHomepageRedirect(r.url, finalUrl);
      let verdict;
      if (status === 200 && !homeRedirect) verdict = 'LIVE';
      else if (status === 200 && homeRedirect) verdict = 'DEAD(homepage-redirect)';
      else if (status === 404) verdict = 'DEAD(404)';
      else if (status === 403) verdict = 'BLOCKED(403 — unverifiable)';
      else if (status === 0) verdict = `ERROR(${error})`;
      else verdict = `HTTP ${status}`;
      console.log(
        `${verdict}\t${r.era}\t${r.brand} — ${r.item}\t${r.url}` +
          (finalUrl && finalUrl !== r.url ? `\t=> ${finalUrl}` : ''),
      );
    }
    return;
  }
  if (cmd === 'images') {
    const n = Number(nArg) || rows.length;
    // Same era-restriction convention as `check` above.
    const eraArg = process.argv[4];
    const eras = eraArg ? eraArg.split(',').map((e) => e.trim()).filter(Boolean) : null;
    const pool = eras ? rows.filter((r) => eras.some((e) => r.era === e)) : rows;
    const batch = pool.slice(0, n);
    const results = [];
    let first = true;
    for (const r of batch) {
      const skippable = (r.retailer && KNOWN_NON_SHOPIFY.has(r.retailer)) || !shopifyJsonUrl(r.url);
      if (!first && !skippable) await new Promise((res) => setTimeout(res, 1500));
      first = false;
      const { verdict, imageUrl } = await fetchProductImage(r.url, r.retailer);
      results.push({
        file: r.file,
        index: r.index,
        era: r.era,
        brand: r.brand,
        item: r.item,
        retailer: r.retailer,
        url: r.url,
        verdict,
        imageUrl,
      });
    }
    console.log(JSON.stringify(results, null, 2));
    return;
  }
  console.error(`Unknown command: ${cmd}`);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
