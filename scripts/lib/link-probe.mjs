// Single-URL liveness probe used by scripts/check-link-liveness.mjs.
//
// Verdicts: ok | redirect (lands elsewhere but alive) | dead (404/410, redirect
// to the site root, DNS gone, YouTube video removed) | soft-404 (200 with a
// "not found" page) | sold-out (product mode) | blocked (401/403 / challenge
// page — needs a real browser, never filed as dead) | suspect | unverified
// (the runner's network failed after retries — evidence about the RUNNER, not
// the link; #3469).
/* global AbortSignal */

export const USER_AGENT = 'LongLiveLinkSweep/1.0 (+https://longlivets.com; nightly link-liveness check)';
const TIMEOUT_MS = 20000;
const BODY_BYTES = 16384;
const MAX_ATTEMPTS_RATE_LIMITED = 4;
const MAX_ATTEMPTS_TRANSIENT = 3;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const SOFT_404_TITLE = /\b(page|file|article|product)?\s*(could\s*)?not\s*(be\s*)?found\b|^\s*404\b|no longer (?:available|exists)|this page (?:doesn.t|does not) exist|page you (?:were|are) looking for/i;
const SOFT_404_BODY = /\bhttp\s*410\b|\bpage\s+not\s+found\b|\bno longer (?:available|exists)\b/i;
const SOLD_OUT = /\bout of stock\b|\bsold out\b|https?:\/\/schema\.org\/OutOfStock|["']OutOfStock["']/i;
const CHALLENGE = /captcha|cf-chl|just a moment|access denied|verify you are human|px-captcha|are you a robot/i;
const bare = (u) => u.replace(/^https?:\/\/(?:www\.)?/, '').replace(/\/$/, '');

async function readBody(res) {
  const type = res.headers.get('content-type') || '';
  if (!/text\/(?:html|plain)|xhtml/.test(type) || !res.body) { try { await res.body?.cancel(); } catch { /* ignore */ } return ''; }
  const reader = res.body.getReader();
  const chunks = [];
  let n = 0;
  try {
    while (n < BODY_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      n += value.length;
    }
  } catch { /* partial body is fine */ }
  reader.cancel().catch(() => {});
  return Buffer.concat(chunks).toString('utf8');
}

/** YouTube watch pages always return 200; oEmbed is the honest liveness signal. */
async function checkYouTube(url, signal) {
  const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`, { headers: { 'user-agent': USER_AGENT }, signal });
  const { status } = res;
  await res.body?.cancel().catch(() => {});
  if (status === 200) return { url, status, verdict: 'ok' };
  if (status === 404 || status === 400) return { url, status, verdict: 'dead', reason: `YouTube oEmbed ${status} (video removed or bad id)` };
  if (status === 401) return { url, status, verdict: 'ok', reason: 'public, embedding disabled' };
  if (status === 403) return { url, status, verdict: 'suspect', reason: 'YouTube oEmbed 403 (private?) — needs a look' };
  if (status === 429 || status === 503) return { rateLimited: true, retryAfter: 0 };
  return { url, status, verdict: 'suspect', reason: `YouTube oEmbed ${status}` };
}

async function checkOnce(url, { product = false } = {}) {
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  try {
    const host = new URL(url).hostname;
    if (/(^|\.)youtube\.com$/.test(host) && /\/watch/.test(url) || host === 'youtu.be') return await checkYouTube(url, signal);
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal,
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml,*/*;q=0.8', 'accept-language': 'en-US,en;q=0.9' },
    });
    const { status } = res;
    if (status === 429 || status === 503) {
      await res.body?.cancel().catch(() => {});
      return { rateLimited: true, retryAfter: Number(res.headers.get('retry-after')) || 0 };
    }
    const body = await readBody(res);
    const finalUrl = res.url || url;
    if (status === 404 || status === 410) return { url, status, verdict: 'dead' };
    if (status === 401 || status === 403 || status === 451 || status === 999) return { url, status, verdict: 'blocked' };
    if (status >= 400) return { url, status, verdict: status >= 500 && CHALLENGE.test(body) ? 'blocked' : 'suspect' };
    if (status >= 200 && status < 300) {
      const title = (body.match(/<title[^>]*>([^<]*)/i) || [])[1] || '';
      if (CHALLENGE.test(title) || (body.length < 6000 && CHALLENGE.test(body))) return { url, status, verdict: 'blocked', reason: 'challenge page' };
      if (product && SOLD_OUT.test(body)) return { url, status, verdict: 'sold-out' };
      if (SOFT_404_TITLE.test(title) || SOFT_404_BODY.test(body.slice(0, 4000))) return { url, status, verdict: 'soft-404', reason: title.trim().slice(0, 80) };
      const from = new URL(url);
      const to = new URL(finalUrl);
      if (from.pathname.replace(/\/$/, '') && !to.pathname.replace(/\/$/, '')) return { url, status, verdict: 'dead', reason: `redirected to site root ${finalUrl}` };
      if (bare(finalUrl) !== bare(url)) return { url, status, verdict: 'redirect', finalUrl };
      return { url, status, verdict: 'ok' };
    }
    return { url, status, verdict: 'suspect' };
  } catch (err) {
    const msg = String((err && err.cause && err.cause.code) || (err && err.message) || err);
    if (/ENOTFOUND|EAI_AGAIN/.test(msg)) return { transientError: true, kind: 'dns', message: msg };
    const kind = /certificate|SSL|TLS/i.test(msg) ? 'ssl' : /timed out|timeout|abort/i.test(msg) ? 'timeout' : 'connection';
    return { transientError: true, kind, message: msg };
  }
}

/**
 * Retries transient failures with exponential backoff; a definitive HTTP answer
 * never retries. Persistent DNS failure (ENOTFOUND on every attempt) is the one
 * network error reported as `dead` — the domain no longer resolves.
 */
export async function check(url, opts = {}) {
  let attempt = 0;
  for (;;) {
    const r = await checkOnce(url, opts);
    if (!r.rateLimited && !r.transientError) return r;
    attempt++;
    const maxAttempts = r.rateLimited ? MAX_ATTEMPTS_RATE_LIMITED : MAX_ATTEMPTS_TRANSIENT;
    if (attempt >= maxAttempts) {
      if (r.kind === 'dns') return { url, status: 0, verdict: 'dead', reason: `DNS does not resolve (${r.message})` };
      const reason = r.rateLimited ? 'rate-limited (429/503) after retries' : `${r.kind} error after retries (${r.message})`;
      return { url, status: 0, verdict: 'unverified', reason };
    }
    await sleep(Math.max((r.retryAfter ?? 0) * 1000, 500 * 2 ** attempt) + Math.random() * 300);
  }
}

/** Serialises probes per host with a polite gap; different hosts run in parallel. */
export function createHostGate(gapMs) {
  const chains = new Map();
  return (host, fn) => {
    const next = (chains.get(host) ?? Promise.resolve()).then(async () => {
      try { return await fn(); } finally { await sleep(gapMs); }
    });
    chains.set(host, next.catch(() => {}));
    return next;
  };
}

/**
 * A single 404 is not proof: some outlets (E! News, #4324) return a transient 404
 * to a bot mid-run. Re-probes every dead/soft-404 result once (after a pause) and
 * keeps the dead verdict only when the second probe agrees; otherwise the second
 * verdict wins (and a still-ambiguous one stays reviewable, never silently ok).
 */
export async function confirmDead(results, { probe = check, pauseMs = 15000, opts = {} } = {}) {
  const isDead = (r) => r.verdict === 'dead' || r.verdict === 'soft-404';
  if (!results.some(isDead)) return results;
  await sleep(pauseMs);
  const out = [];
  for (const r of results) {
    if (!isDead(r)) { out.push(r); continue; }
    const again = await probe(r.url, opts);
    out.push(isDead(again) ? { ...r, confirmed: true } : { ...r, ...again, reason: `first probe ${r.verdict}, re-probe ${again.verdict}` });
  }
  return out;
}
