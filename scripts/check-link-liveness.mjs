#!/usr/bin/env node
// Link-liveness sweep for the content corpus — the detection half of Karen's
// link-rot capability (docs/agents/maintenance-bots-research.md §3).
//
// Scans every URL in supabase/seed/**, checks it resolves, and classifies the
// failures (404/410, 403, soft-404, or "unverified" for transient
// connection/timeout/SSL/rate-limit failures that survived retries — see
// #3469 below). Read-only, deterministic,
// ALWAYS exits 0 — it is a reporting tool Karen runs and reasons over (adding
// Wayback-fallback suggestions and filing tickets), NOT a CI gate. Karen never
// edits content; she files tickets from this report. Karen should treat
// "unverified" the same way image.liveness's "unverified" is treated: never
// filed as a dead link, at most a note that the sweep couldn't confirm it.
//
// Usage:
//   node scripts/check-link-liveness.mjs            # sweep all seed URLs
//   node scripts/check-link-liveness.mjs --limit 50 # cap (smoke test)
//   node scripts/check-link-liveness.mjs --json     # machine-readable output

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const SEED_DIR = join(ROOT, 'supabase', 'seed');
const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');
const LIMIT = (() => {
  const i = args.indexOf('--limit');
  return i >= 0 ? Number(args[i + 1]) : Infinity;
})();
// #3469: at CONCURRENCY 10 with no retries, the nightly cloud runner's egress
// proxy returned a 99.2% false "connection" failure rate across thousands of
// unrelated hosts — not real link rot. The same run's image.liveness checker
// hit the identical proxy limitation but stayed trustworthy because it
// retries transient failures with backoff and reports them as "unverified"
// rather than "broken" (checkers/image-liveness.mjs `probe()`). This sweep
// had neither behaviour: one attempt, no retry, and a bare network error was
// reported as verdict "connection"/"timeout"/"ssl" indistinguishable from a
// confirmed-dead link. Ported the same retry-with-backoff + "unverified"
// discipline here, and lowered default concurrency to match (a proxy that
// chokes on 10 concurrent tunnels is exactly what a false-positive storm from
// hundreds of independent hosts looks like).
const CONCURRENCY = (() => {
  const i = args.indexOf('--concurrency');
  return i >= 0 ? Number(args[i + 1]) : 4;
})();
const TIMEOUT_MS = 15000;
// Max attempts for a transient failure (rate-limited gets more room than a
// hard connection/timeout error, same split as image-liveness.mjs).
const MAX_ATTEMPTS_RATE_LIMITED = 4;
const MAX_ATTEMPTS_TRANSIENT = 3;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const SOFT_404 = /\b(page|file)?\s*not\s*found\b|\bhttp\s*410\b|\bno longer (?:available|exists)\b/i;
const SOLD_OUT = /\bout of stock\b|\bsold out\b|https?:\/\/schema\.org\/OutOfStock|["']OutOfStock["']/i;

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

async function productTargetsFromSeed() {
  const targets = [];
  const files = await readdir(join(SEED_DIR, 'content'));
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

async function walk(dir) {
  const out = [];
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith('.mjs')) out.push(p);
  }
  return out;
}

function extractUrls(text) {
  const raw = text.match(/https?:\/\/[^\s"'`)\]<>]+/g) || [];
  return raw.map((u) => u.replace(/[.,;]+$/, ''));
}

// AbortSignal is a Node 18+ / browser global; declare it for eslint's no-undef.
/* global AbortSignal */
async function checkOnce(url, { inspectProductPage = false } = {}) {
  const ac = AbortSignal.timeout(TIMEOUT_MS);
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ac });
    // Some hosts reject HEAD — retry with a ranged GET.
    if (res.status === 405 || res.status === 403 || res.status === 501) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ac, headers: { Range: 'bytes=0-2048' } });
    }
    if (inspectProductPage && res.status >= 200 && res.status < 300) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ac, headers: { Range: 'bytes=0-4095' } });
    }
    const status = res.status;
    if (status === 429 || status === 503) {
      const retryAfter = Number(res.headers.get('retry-after')) || 0;
      return { rateLimited: true, retryAfter };
    }
    if (status >= 200 && status < 300) {
      // Soft-404 sniff on HTML bodies.
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) {
        try {
          const body = (await res.text()).slice(0, 4000);
          if (SOLD_OUT.test(body)) return { url, status, verdict: 'sold-out' };
          if (SOFT_404.test(body)) return { url, status, verdict: 'soft-404' };
        } catch { /* body read failed — treat as OK by status */ }
      }
      return { url, status, verdict: 'ok' };
    }
    if (status === 404 || status === 410) return { url, status, verdict: 'dead' };
    if (status === 403 || status === 401) return { url, status, verdict: 'blocked' };
    return { url, status, verdict: 'suspect' };
  } catch (err) {
    const msg = String(err && err.message || err);
    const kind = /certificate|SSL|TLS/i.test(msg) ? 'ssl'
      : /timed out|timeout|abort/i.test(msg) ? 'timeout'
      : 'connection';
    return { transientError: true, kind, message: msg };
  }
}

// Retries transient network failures (connection/timeout/ssl/rate-limit) with
// exponential backoff before giving up — the same discipline as
// content-engine/checkers/image-liveness.mjs `probe()`. A definitive HTTP
// response (200/404/403/…) never retries; only "the request itself didn't
// complete" does. After retries are exhausted the verdict is "unverified",
// never one of the definitive-sounding kinds ("connection"/"timeout"/"ssl") —
// a failed probe is evidence the RUNNER's network is unreliable, not proof
// the link is dead (#3469).
export async function check(url, opts = {}) {
  let attempt = 0;
  for (;;) {
    const r = await checkOnce(url, opts);
    if (!r.rateLimited && !r.transientError) return r;
    attempt++;
    const maxAttempts = r.rateLimited ? MAX_ATTEMPTS_RATE_LIMITED : MAX_ATTEMPTS_TRANSIENT;
    if (attempt >= maxAttempts) {
      const reason = r.rateLimited
        ? 'rate-limited (429/503) after retries'
        : `${r.kind} error after retries (${r.message})`;
      return { url, status: 0, verdict: 'unverified', reason };
    }
    await sleep(Math.max((r.retryAfter ?? 0) * 1000, 500 * 2 ** attempt) + Math.random() * 300);
  }
}

async function pool(items, worker, n) {
  const results = [];
  let i = 0;
  const runners = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx]);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  let files = [];
  let targets;
  if (args.includes('--products')) {
    targets = await productTargetsFromSeed();
  } else {
    files = await walk(SEED_DIR);
    const urlSet = new Set();
    for (const file of files) {
      try { for (const url of extractUrls(await readFile(file, 'utf8'))) urlSet.add(url); }
      catch { /* skip unreadable */ }
    }
    targets = [...urlSet].map((url) => ({ url }));
  }
  if (Number.isFinite(LIMIT)) targets = targets.slice(0, LIMIT);
  const results = await pool(targets, async (target) => ({
    ...target,
    ...(await check(target.url, { inspectProductPage: args.includes('--products') })),
  }), CONCURRENCY);
  const bad = results.filter((result) => result.verdict !== 'ok');
  const byVerdict = bad.reduce((map, result) => ((map[result.verdict] = (map[result.verdict] || 0) + 1), map), {});

  if (JSON_OUT) {
    console.log(JSON.stringify({ scanned: targets.length, files: files.length, byVerdict, results: args.includes('--products') ? results : undefined, bad }, null, 2));
  } else {
    console.log(`link-liveness: scanned ${targets.length} ${args.includes('--products') ? 'product' : 'unique'} URLs across ${files.length} seed files`);
    console.log('summary:', byVerdict);
    for (const result of bad) console.log(`  [${result.verdict}] ${result.status || '-'}  ${result.url}${result.reason ? `  (${result.reason})` : ''}`);
    console.log(bad.length ? `\n${bad.length} link(s) need review.` : '\nall links live.');
  }
}

if (process.argv[1] && process.argv[1].endsWith('check-link-liveness.mjs')) {
  main().catch((error) => {
    console.error(`link-liveness: ${error.message}`);
    process.exitCode = 1;
  });
}
