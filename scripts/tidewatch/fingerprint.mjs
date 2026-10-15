import { createHash } from 'node:crypto';

const TRACKING = /^(utm_.+|fbclid|gclid|dclid|mc_cid|mc_eid|_hsenc|_hsmi)$/i;

export function normalizeUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value).trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = '';
    url.hostname = url.hostname.toLowerCase();
    url.pathname = url.pathname.toLowerCase().replace(/\/{2,}/g, '/');
    if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/$/, '');
    const kept = [...url.searchParams]
      .filter(([key]) => !TRACKING.test(key))
      .sort(([ak, av], [bk, bv]) => ak.localeCompare(bk) || av.localeCompare(bv));
    url.search = '';
    for (const [key, val] of kept) url.searchParams.append(key, val);
    return url.toString();
  } catch {
    return null;
  }
}

export function urlNormHash(value) {
  const normalized = normalizeUrl(value);
  return normalized ? createHash('sha256').update(normalized).digest('hex') : null;
}

function titleTokens(title) {
  return String(title ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[|–—-]\s+[^|–—-]{2,40}$/, '')
    .match(/[\p{L}\p{N}]+/gu) ?? [];
}

export function titleSimhash(title) {
  const tokens = titleTokens(title);
  if (!tokens.length) return null;
  const weights = Array(64).fill(0);
  for (const token of tokens) {
    const digest = createHash('sha256').update(token).digest();
    for (let bit = 0; bit < 64; bit += 1) {
      weights[bit] += digest[Math.floor(bit / 8)] & (1 << (7 - (bit % 8))) ? 1 : -1;
    }
  }
  return weights.map((weight) => (weight >= 0 ? '1' : '0')).join('');
}

export function hammingDistance(left, right) {
  if (!left || !right || left.length !== right.length) throw new Error('simhash values must have equal length');
  let distance = 0;
  for (let i = 0; i < left.length; i += 1) distance += left[i] === right[i] ? 0 : 1;
  return distance;
}

export function watchCandidate({ itemKey, cursorKey = itemKey, source, sourceRef, url, title, excerpt, storyId, detectedAt }) {
  return {
    cursorAt: new Date(detectedAt).toISOString(),
    cursorKey,
    item: {
      item_key: itemKey,
      source,
      source_ref: sourceRef ? String(sourceRef) : null,
      url_norm_hash: urlNormHash(url),
      title_simhash: titleSimhash(title),
      story_id: storyId ?? itemKey,
      first_seen_at: new Date(detectedAt).toISOString(),
      last_seen_at: new Date(detectedAt).toISOString(),
      excerpt: excerpt ? String(excerpt).slice(0, 2000) : null,
    },
  };
}
