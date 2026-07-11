// Image checker (deterministic, network). For every distinct hotlinked image:
//   • liveness  — resolves to a real 200 image (catches hotlink-rot / junk URLs)
//   • format    — real image content-type + magic bytes
//   • resolution— width/height parsed from the bytes (catches junk thumbnails)
//   • host rep  — off-allowlist hosts flagged: an unvetted host is where BOTH
//                 junk and genuinely-unwanted content would enter a hotlink app,
//                 so this doubles as the near-term image-safety net.
// Exact-subject/appropriateness judgments are the vision-agent's job; this is
// the cheap, no-model first pass.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { makeFinding } from '../lib/finding.mjs';
import { imageIndex, ROOT } from '../lib/corpus.mjs';
import { CONFIG } from '../config.mjs';

// Probe cache — makes re-runs instant instead of re-hitting every host. Keyed
// by url; entries expire so hotlink-rot is eventually re-checked.
const CACHE_PATH = join(ROOT, CONFIG.output.findingsDir, 'image-cache.json');
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Failures get a much shorter cache life: a transient timeout/5xx must not be
// filed as "broken" for a week (review finding). Definitive gone-forever
// statuses (404/410) keep the full TTL.
const FAIL_TTL_MS = 60 * 60 * 1000;
const cacheFresh = (entry, now) => {
  if (!entry) return false;
  const definitive = entry.r.ok || entry.r.status === 404 || entry.r.status === 410 || entry.r.blocked;
  return now - entry.ts < (definitive ? CACHE_TTL_MS : FAIL_TTL_MS);
};
function loadCache() {
  try { return JSON.parse(readFileSync(CACHE_PATH, 'utf8')); } catch { return {}; }
}
function saveCache(cache) {
  try { mkdirSync(join(ROOT, CONFIG.output.findingsDir), { recursive: true }); writeFileSync(CACHE_PATH, JSON.stringify(cache), 'utf8'); } catch { /* non-fatal */ }
}

export const id = 'image.liveness';
const C = CONFIG.image;

/** Parse {format,width,height} from a leading image buffer. No deps. */
export function imageMeta(buf) {
  if (buf.length < 24) return null;
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { format: 'png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // GIF
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return { format: 'gif', width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }
  // WEBP (RIFF....WEBP)
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') {
    const fmt = buf.slice(12, 16).toString('ascii');
    try {
      if (fmt === 'VP8 ') return { format: 'webp', width: (buf.readUInt16LE(26) & 0x3fff), height: (buf.readUInt16LE(28) & 0x3fff) };
      if (fmt === 'VP8L') { const b = buf.readUInt32LE(21); return { format: 'webp', width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 }; }
      if (fmt === 'VP8X') {
        // A truncated VP8X header would coerce undefined bytes to 0 and yield a
        // bogus 1×1 (found in review); require the full 30-byte header first.
        if (buf.length < 30) return { format: 'webp' };
        return { format: 'webp', width: ((buf[24] | (buf[25] << 8) | (buf[26] << 16)) & 0xffffff) + 1, height: ((buf[27] | (buf[28] << 8) | (buf[29] << 16)) & 0xffffff) + 1 };
      }
    } catch { return { format: 'webp' }; }
    return { format: 'webp' };
  }
  // JPEG — walk segments to a SOF marker
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let o = 2;
    while (o + 9 < buf.length) {
      if (buf[o] !== 0xff) { o++; continue; }
      const marker = buf[o + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { format: 'jpeg', height: buf.readUInt16BE(o + 5), width: buf.readUInt16BE(o + 7) };
      }
      o += 2 + buf.readUInt16BE(o + 2);
    }
    return { format: 'jpeg' };
  }
  return null;
}

function hostOf(url) { try { return new URL(url).hostname.toLowerCase(); } catch { return null; } }

// SSRF guard: seed data is repo-controlled but probed unattended, so never let
// a URL point the probe at loopback/RFC1918/link-local/metadata targets.
// Hostname-level check (applied to the original URL and the post-redirect one).
export function isPrivateHost(host) {
  if (!host) return true;
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (host === '::1' || host.startsWith('fe80:') || host.startsWith('fd') || host.startsWith('fc')) return true;
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 127 || a === 10 || a === 0 || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168) || (a === 169 && b === 254);
}

// Read at most `cap` bytes from a fetch body, then abort the connection — a
// Range header is advisory and a hostile/misconfigured server can ignore it.
async function readCapped(res, cap, ctrl) {
  const chunks = [];
  let total = 0;
  const reader = res.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
      total += value.length;
      if (total >= cap) { ctrl.abort(); break; }
    }
  } catch { /* aborted after cap — expected */ }
  return Buffer.concat(chunks, Math.min(total, cap));
}

// Descriptive UA per Wikimedia's User-Agent policy (a thin UA gets throttled).
const UA = 'Swift2-ContentIntegrityEngine/1.0 (content-QA bot; +https://github.com/JW-Incorporated/swift2; wjduvall@gmail.com)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const BUF_CAP = 256 * 1024;

async function probeOnce(url) {
  if (isPrivateHost(hostOf(url))) return { blocked: true, reason: 'private/internal host' };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), C.fetchTimeoutMs);
  try {
    const res = await fetch(url, { headers: { Range: 'bytes=0-131071', 'User-Agent': UA, Accept: 'image/*' }, signal: ctrl.signal, redirect: 'follow' });
    if (isPrivateHost(hostOf(res.url))) { ctrl.abort(); return { blocked: true, reason: 'redirected to a private/internal host' }; }
    const ct = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (res.status === 429 || res.status === 503) {
      const ra = Number(res.headers.get('retry-after')) || 0;
      return { rateLimited: true, retryAfter: ra };
    }
    if (!res.ok && res.status !== 206) return { ok: false, status: res.status };
    const buf = await readCapped(res, BUF_CAP, ctrl);
    return { ok: true, status: res.status, contentType: ct, bytes: buf.length, meta: imageMeta(buf) };
  } catch (e) {
    return { ok: false, error: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally {
    clearTimeout(t);
  }
}

// Retry rate-limits with exponential backoff. A persistent 429 is reported as
// "unverified" (NOT broken) so throttling never masquerades as a dead image.
async function probe(url) {
  let attempt = 0;
  for (;;) {
    const r = await probeOnce(url);
    if (!r.rateLimited) return r;
    attempt++;
    if (attempt > 4) return { unverified: true, reason: 'rate-limited (429) after retries' };
    await sleep(Math.max(r.retryAfter * 1000, 800 * 2 ** attempt) + Math.random() * 400);
  }
}

async function pool(jobs, n, worker) {
  const results = [];
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < jobs.length) {
      const idx = i++;
      results[idx] = await worker(jobs[idx]);
    }
  }));
  return results;
}

export async function check(items, ctx = {}) {
  const imgs = imageIndex(items).filter((im) => /^https?:\/\//.test(im.url));
  if (ctx.log) ctx.log(`  probing ${imgs.length} distinct images (concurrency ${C.concurrency})…`);
  const findings = [];
  const refOf = (im) => {
    const first = im.usedBy[0] ?? {};
    return { type: 'image', file: first.file ?? null, era: null, key: im.url, field: null };
  };
  const usedNote = (im) => `Used by ${im.usedBy.length} item(s): ${im.usedBy.slice(0, 4).map((u) => u.key).join('; ')}${im.usedBy.length > 4 ? '…' : ''}`;

  const cache = loadCache();
  const now = Date.now();
  let cacheHits = 0;
  const probes = await pool(imgs, C.concurrency, async (im) => {
    const c = cache[im.url];
    if (cacheFresh(c, now) && !c.r.unverified) { cacheHits++; return { im, r: c.r }; }
    const r = await probe(im.url);
    if (!r.unverified) cache[im.url] = { ts: now, r };
    return { im, r };
  });
  saveCache(cache);
  if (cacheHits && ctx.log) ctx.log(`  (${cacheHits} cached, ${imgs.length - cacheHits} freshly probed)`);

  let unverified = 0;
  for (const { im, r } of probes) {
    const host = hostOf(im.url);
    // Host reputation (also the safety net).
    if (host && !CONFIG.hostAllowlist.includes(host)) {
      findings.push(makeFinding({
        checker: 'image.host-reputation', severity: 'P2',
        title: `Image from unvetted host: ${host}`,
        itemRef: refOf(im), excerpt: im.url,
        evidence: `Host "${host}" is not on the reputable-source allowlist. Unvetted hosts are where junk or genuinely-unwanted imagery enters a hotlink-based app — review the image and prefer a reputable/official/Wikimedia source. ${usedNote(im)}`,
        suggestedFix: 'Verify the image is appropriate + high-quality; re-source from a reputable host if not.',
        confidence: 0.5,
      }));
    }
    // Rate-limited despite retries — report as unverified, never as broken.
    if (r.unverified) { unverified++; continue; }
    // SSRF guard tripped — a seed image pointing inside the network is its own
    // finding (and the probe never ran).
    if (r.blocked) {
      findings.push(makeFinding({
        checker: 'image.host-reputation', severity: 'P1',
        title: `Image URL targets a ${r.reason}`,
        itemRef: refOf(im), excerpt: im.url,
        evidence: `Probe refused: ${r.reason}. Seed images must be public internet URLs. ${usedNote(im)}`,
        suggestedFix: 'Replace with a public, reputable image URL.', confidence: 0.9,
      }));
      continue;
    }
    // Liveness / format
    if (!r.ok) {
      findings.push(makeFinding({
        checker: id, severity: 'P1', title: `Broken image (${r.status ?? r.error})`,
        itemRef: refOf(im), excerpt: im.url,
        evidence: `Image did not resolve (${r.status ? `HTTP ${r.status}` : r.error}). Hotlink-rot — renders as a blank/placeholder. ${usedNote(im)}`,
        suggestedFix: 'Replace with a live image URL (prefer a stable host), or remove.', confidence: 0.9,
      }));
      continue;
    }
    if (r.contentType && !C.okContentTypes.includes(r.contentType)) {
      findings.push(makeFinding({
        checker: id, severity: 'P2', title: `Not an image (${r.contentType})`,
        itemRef: refOf(im), excerpt: im.url,
        evidence: `URL returned content-type "${r.contentType}", not an image — likely an HTML page or an expired link. ${usedNote(im)}`,
        suggestedFix: 'Point at a direct image URL, or remove.', confidence: 0.8,
      }));
      continue;
    }
    // Junk-size
    if (r.bytes != null && r.bytes < C.minBytes) {
      findings.push(makeFinding({
        checker: 'image.quality', severity: 'P2', title: `Tiny image (${r.bytes}B, likely placeholder)`,
        itemRef: refOf(im), excerpt: im.url,
        evidence: `Only ${r.bytes} bytes — almost always a spacer/placeholder/broken thumbnail, not real photography. ${usedNote(im)}`,
        suggestedFix: 'Replace with a real, full-size photo.', confidence: 0.7,
      }));
    }
    // Low resolution
    if (r.meta?.width && r.meta?.height && (r.meta.width < C.minWidth || r.meta.height < C.minHeight)) {
      findings.push(makeFinding({
        checker: 'image.quality', severity: 'P2', title: `Low-resolution image (${r.meta.width}×${r.meta.height})`,
        itemRef: refOf(im), excerpt: im.url,
        evidence: `${r.meta.width}×${r.meta.height}px is below the ${C.minWidth}×${C.minHeight} quality floor — reads as a junk thumbnail on a full-bleed hero. ${usedNote(im)}`,
        suggestedFix: 'Source a higher-resolution version of the same image.', confidence: 0.75,
      }));
    }
  }
  if (unverified && ctx.log) ctx.log(`  (${unverified} images unverified — host kept rate-limiting; not filed as broken)`);
  return findings;
}
