// The posted-image ledger (issue #5990, founder rule: "we can never post the
// same picture twice"). social/posted-images.json holds one entry per image
// that ever shipped, keyed by perceptual fingerprint (image-fingerprint.mjs),
// so the same photo under another name, re-downloaded, resized or re-cropped
// is still caught — the file-path match in photo-reuse.mjs cannot see that.
//
// The ledger is DERIVED data: every entry comes from a social/posted/*.json
// record plus the bytes of its media. `buildLedger` is therefore idempotent
// and deterministic (entries sorted by post file then media path; existing
// entries are reused, only new posted media is fingerprinted), and the poster
// pre-step rebuilds it from social/posted/** each run rather than depending on
// an append inside the guard-protected post-queue.mjs.
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fingerprintImage, fingerprintsMatch, isFingerprint } from './image-fingerprint.mjs';
import { isLfsPointerBuffer, parseLfsPointer } from './lfs-pointer.mjs';
import { mediaUrlFor } from './queue.mjs';

export const LEDGER_RELATIVE = 'social/posted-images.json';
export const LEDGER_VERSION = 1;

const campaignOf = (item) => (typeof item?.campaign === 'string' && item.campaign.trim() ? item.campaign.trim() : null);

const LFS_MEDIA_BASE = 'https://media.githubusercontent.com/media';

/** Refs to try on GitHub's public LFS media endpoint: the PR/run commit first, then `main`. */
function lfsRefs(env = process.env) {
  return [...new Set([env.LFS_MEDIA_REF, env.GITHUB_SHA, 'main'].filter(Boolean))];
}

/**
 * Real bytes of an LFS-pointer media path from the public media endpoint
 * (the site serves the pointer text itself, not the object). The download is
 * verified against the pointer's sha256 oid; a mismatch is never accepted.
 * Returns null when no ref yields verified bytes.
 */
async function fetchLfsObject(mediaPath, pointer, { fetchImpl, attempts, retryDelayMs }) {
  const repo = process.env.GITHUB_REPOSITORY || 'JW-Incorporated/swift2';
  for (const ref of lfsRefs()) {
    const url = `${LFS_MEDIA_BASE}/${repo}/${ref}/apps/web/public${mediaPath}`;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const res = await fetchImpl(url, { signal: globalThis.AbortSignal.timeout(30000) });
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          if (!isLfsPointerBuffer(buf) && createHash('sha256').update(buf).digest('hex') === pointer.oid) return buf;
          break; // wrong object for this ref: try the next ref, do not retry
        }
        if (res.status === 404) break;
      } catch {
        // transient network error: retry with backoff
      }
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
    }
  }
  return null;
}

/**
 * The bytes of a queue/posted media path. Reads apps/web/public/<path>; when
 * that is missing or a Git LFS pointer (CI never fetches LFS), downloads the
 * same public object the poster itself posts from (mediaUrlFor). Library photos
 * are LFS objects, so that URL serves the pointer text: the pointer is then
 * resolved through GitHub's LFS media endpoint and sha256-verified against its
 * oid. `fallback` (optional, async path => Buffer|null) is tried last. Throws
 * on failure (callers fail closed).
 */
export async function resolveImageBytes(mediaPath, { root, fetchImpl = globalThis.fetch, fallback, attempts = 3, retryDelayMs = 1500 } = {}) {
  let local;
  try {
    local = await readFile(path.join(root, 'apps', 'web', 'public', mediaPath));
  } catch {
    local = undefined;
  }
  if (local && !isLfsPointerBuffer(local)) return local;
  let pointer = local ? parseLfsPointer(local) : null;
  for (let attempt = 1; attempt <= attempts && !pointer; attempt += 1) {
    try {
      const res = await fetchImpl(mediaUrlFor(mediaPath), { signal: globalThis.AbortSignal.timeout(30000) });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (!isLfsPointerBuffer(buf)) return buf;
        pointer = parseLfsPointer(buf);
        if (pointer) break;
      }
      if (res.status === 404) break; // definitive: the object is not there, retrying will not help
    } catch {
      // transient network error: retry with backoff, then fall through to the fallback
    }
    if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
  }
  if (pointer) {
    const real = await fetchLfsObject(mediaPath, pointer, { fetchImpl, attempts, retryDelayMs });
    if (real) return real;
  }
  const fromFallback = fallback ? await fallback(mediaPath) : null;
  if (fromFallback) return fromFallback;
  throw new Error(`could not read the bytes of ${mediaPath}`);
}

/** Fingerprint of a media path, or `null` when its bytes cannot be read/decoded. */
export async function fingerprintMedia(mediaPath, options) {
  try {
    return await fingerprintImage(await resolveImageBytes(mediaPath, options));
  } catch {
    return null;
  }
}

/** Every parseable `{ file, data }` record in a queue/posted directory (missing dir = empty). */
export async function readRecords(dir) {
  let files;
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  } catch {
    return [];
  }
  const out = [];
  for (const file of files) out.push({ file, data: JSON.parse(await readFile(path.join(dir, file), 'utf8')) });
  return out;
}

export async function readLedger(root) {
  try {
    const parsed = JSON.parse(await readFile(path.join(root, LEDGER_RELATIVE), 'utf8'));
    return Array.isArray(parsed?.entries) ? parsed.entries : [];
  } catch {
    return [];
  }
}

export async function writeLedger(root, entries) {
  const body = `${JSON.stringify({ version: LEDGER_VERSION, entries }, null, 2)}\n`;
  await writeFile(path.join(root, LEDGER_RELATIVE), body, 'utf8');
}

/** Schema findings for ledger entries (used by validate:social). */
export function validateLedgerEntries(entries) {
  if (!Array.isArray(entries)) return ['posted-images.json: `entries` must be an array'];
  const findings = [];
  const seen = new Set();
  entries.forEach((e, i) => {
    const label = `entry #${i} (${e?.post ?? '?'} ${e?.file ?? '?'})`;
    if (!isFingerprint(e)) findings.push(`${label}: hash/crops must be 16-char hex`);
    for (const key of ['file', 'post', 'platform', 'postedAt']) {
      if (typeof e?.[key] !== 'string' || !e[key]) findings.push(`${label}: ${key} is required`);
    }
    const id = `${e?.post}|${e?.file}`;
    if (seen.has(id)) findings.push(`${label}: duplicate (post, file)`);
    seen.add(id);
  });
  return findings;
}

/**
 * Ledger entries for every image in `posted` (`{ file, data }[]`), reusing
 * `existing` entries and fingerprinting only new ones through
 * `fingerprintOf(mediaPath)`. Returns `{ entries, unresolved }`; an image that
 * cannot be fingerprinted is listed in `unresolved` (never silently dropped).
 */
export async function buildLedger(posted, existing, fingerprintOf) {
  const known = new Map(existing.map((e) => [`${e.post}|${e.file}`, e]));
  const entries = [];
  const unresolved = [];
  const sorted = [...posted].sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
  for (const { file, data } of sorted) {
    for (const mediaPath of [...new Set(data?.media ?? [])].sort()) {
      const prior = known.get(`${file}|${mediaPath}`);
      const fp = prior && isFingerprint(prior) ? prior : await fingerprintOf(mediaPath);
      if (!fp) {
        unresolved.push({ post: file, file: mediaPath });
        continue;
      }
      entries.push({
        hash: fp.hash,
        ...(fp.crops?.length ? { crops: fp.crops } : {}),
        file: mediaPath,
        post: file,
        postId: data.platformPostId ?? null,
        platform: data.platform ?? null,
        campaign: campaignOf(data),
        postedAt: data.postedAt ?? null,
      });
    }
  }
  return { entries, unresolved };
}

/**
 * The earlier ledger entry showing the same picture as fingerprint `fp`, or
 * `undefined`. Entries of the item's own campaign (the IG+X halves of one
 * post) and of its own posted record are exempt. `paths` are the media paths
 * the library records as the SAME photo (original + padded -ig45/-ig191
 * variants, photo-library.mjs samePhotoPaths): a padded variant is not a crop,
 * so the fingerprint alone cannot see it.
 */
export function findLedgerMatch(fp, entries, { campaign = null, ownPost = null, paths = [], platform = null, now = new Date() } = {}) {
  return entries.find(
    (e) => e.post !== ownPost && !isPairHalf(e, { campaign, platform, now }) && (paths.includes(e.file) || (fp && fingerprintsMatch(fp, e))),
  );
}

/** How long after one half of a pair posted the other half may still share its picture. */
export const PAIR_WINDOW_MS = 48 * 3600 * 1000;

/**
 * The sanctioned repeat: `e` is the OTHER-platform half of the item's own
 * campaign, posted within PAIR_WINDOW_MS (the poster's 48h staleness bound).
 * An old post that merely shares the campaign string, or the same platform,
 * never exempts — a draft author setting `campaign` cannot launder a reuse.
 */
function isPairHalf(e, { campaign, platform, now }) {
  if (!campaign || e.campaign !== campaign || !platform || !e.platform || e.platform === platform) return false;
  const at = Date.parse(e.postedAt ?? '');
  return Number.isFinite(at) && Math.abs(now.getTime() - at) <= PAIR_WINDOW_MS;
}

/** Human description of an earlier post for an error message. */
export function describeEntry(e) {
  return `social/posted/${e.post} (${e.platform ?? 'unknown platform'}${e.postId ? ` post ${e.postId}` : ''}${e.postedAt ? `, ${e.postedAt}` : ''}; image ${e.file})`;
}
