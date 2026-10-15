import { createHash } from 'node:crypto';

const TRACKING = /^(utm_.+|fbclid|gclid|dclid|mc_cid|mc_eid|_hsenc|_hsmi|si|igsh)$/i;
const HOST_PREFIX = /^(?:www|m|mobile|amp)\./i;
const PUBLISHER_SUFFIXES = [
  'Associated Press',
  'Billboard',
  'CNN',
  'Entertainment Weekly',
  'People',
  'Reuters',
  'Rolling Stone',
  'The Guardian',
  'The New York Times',
  'Variety',
];

// Measured fixtures put a same-story paraphrase at 14 bits and unrelated
// stories at 17-18 bits. At the boundary, prefer a missed duplicate over an
// incorrect merge, so only distances through 14 are duplicate candidates.
export const TITLE_SIMHASH_DUPLICATE_THRESHOLD = 14;

export function normalizeUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value).trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.protocol = 'https:';
    url.hash = '';
    url.hostname = url.hostname.toLowerCase();
    while (HOST_PREFIX.test(url.hostname)) url.hostname = url.hostname.replace(HOST_PREFIX, '');
    url.pathname = url.pathname.replace(/\/{2,}/g, '/').replace(/\/amp\/?$/i, '') || '/';
    if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/$/, '');
    if (url.hostname === 'youtu.be') {
      const videoId = url.pathname.slice(1);
      url.hostname = 'youtube.com';
      url.pathname = '/watch';
      url.searchParams.set('v', videoId);
    }
    const kept = [...url.searchParams]
      .filter(([key]) => key.toLowerCase() !== 'amp' && !TRACKING.test(key))
      .sort(([ak, av], [bk, bv]) => (ak < bk ? -1 : ak > bk ? 1 : av < bv ? -1 : av > bv ? 1 : 0));
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
  const publishers = PUBLISHER_SUFFIXES.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const withoutPublisher = String(title ?? '').replace(
    new RegExp(`\\s*(?:\\||[-\u2013\u2014])\\s*(?:${publishers})\\s*$`, 'iu'),
    '',
  );
  return withoutPublisher.normalize('NFKD')
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu) ?? [];
}

export function titleSimhash(title) {
  const tokens = titleTokens(title);
  if (!tokens.length) return null;
  const normalized = `  ${tokens.join(' ')}  `;
  const features = [];
  for (let i = 0; i <= normalized.length - 4; i += 1) features.push(normalized.slice(i, i + 4));
  const weights = Array(64).fill(0);
  for (const feature of features) {
    const digest = createHash('sha256').update(feature).digest();
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
