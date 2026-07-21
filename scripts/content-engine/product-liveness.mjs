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
//
// The `check` mode uses a browser-like User-Agent. Many luxury retailers
// (christianlouboutin.com, cartier.com, freepeople.com, …) hard-block all
// automated requests with 403 regardless of headers — a 403 here means
// "could not verify", NOT "dead". Only a 404, a 200 that redirects to a bare
// homepage, or a hard connection failure is real evidence a link is dead.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'supabase/seed/content');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120 Safari/537.36';

export async function extract() {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.mjs') && !f.startsWith('_'));
  const rows = [];
  for (const f of files) {
    const mod = await import(join(DIR, f));
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

async function main() {
  const [, , cmd = 'list', nArg] = process.argv;
  const rows = await extract();
  if (cmd === 'list') {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  if (cmd === 'check') {
    const n = Number(nArg) || 15;
    const batch = rows.slice(0, n);
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
  console.error(`Unknown command: ${cmd}`);
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
