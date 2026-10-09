// Pure enumerate / exclude / dedupe logic for import-site-photos.mjs (no network,
// no filesystem — unit tested in site-photos.test.ts). Founder request
// 2026-10-07: reuse the website's own cover photos for social posts. Rights
// basis: docs/social/guardrails.md Guardrail 2, docs/decisions.md 2026-10-01.
import { createHash } from 'node:crypto';

// Fields the site resolves to photos: era-content `moment.photos[].url`,
// runway-look `images[].url`, and an item's `thumbnailUrl`. Deliberately NOT
// collected: `products[].imageUrl` (merch), relationships `image` (portraits of
// other people), `sources[].url` (article links), `heroSourceUrl` (page links).
const PHOTO_ARRAY_KEYS = new Set(['photos', 'images']);
const SKIP_KEYS = new Set(['products', 'sources']);
const ERA_KEYS = ['eraSlug', 'eraId'];
// `reference` = other people/places, product kinds (dress, shoes...) = shopping shots.
const TAYLOR_KINDS = new Set(['primary', 'archival']);

// Watermarked stock/agency comps (Getty comps: rulings 2026-08-15/08-24).
const WATERMARK_HOSTS = /(^|\.)(gettyimages\.[a-z.]+|shutterstock\.com|alamy\.com|istockphoto\.com|dreamstime\.com|depositphotos\.com|123rf\.com|adobestock\.com|stock\.adobe\.com|imago-images\.[a-z]+|alamyimages\.com)$/i;
// Merch/product/marketplace hosts.
const MERCH_HOSTS = /(^|\.)(shopify\.com|etsy\.com|etsystatic\.com|amazon\.[a-z.]+|media-amazon\.com|ssl-images-amazon\.com|ebay\.[a-z.]+|ebayimg\.com|walmart\.com|walmartimages\.com|target\.scene7\.com|redbubble\.net|teepublic\.com|fanatics\.com|taylorswift\.com)$/i;
// YouTube thumbnails: separate founder call pending.
const THUMBNAIL_HOSTS = /(^|\.)(ytimg\.com|youtube\.com|ggpht\.com)$/i;
// Streaming/store album art: not photos.
const COVER_ART_HOSTS = /(^|\.)(scdn\.co|mzstatic\.com|coverartarchive\.org|rapgenius\.com|genius\.com)$/i;
// Hosts whose photos carry a visible outlet watermark/backdrop (visual audit of batch 1, 2026-10-07).
const WATERMARKED_OUTLET_HOSTS = /(justjared|eonline\.com|tayswiftstyle|disneyplus|disney\.com|vevo)/i;
const WATERMARK_HINT = /watermark|[-_./]comps?[-_./]|preview-?comp|[-_/]sample[-_./]|placeholder/i;
const NON_PHOTO_TEXT = /\b(cover art|album cover|single cover|artwork|official cover|magazine cover|logo|poster|infographic|screenshot|billboard|graphic|document|lawsuit|filing|storefront|building exterior|venue exterior)\b/i;
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

/** Wikimedia thumbnail URLs -> the original file (we resize ourselves; thumbs are tiny). */
export function normalizeSiteUrl(raw) {
  try {
    const url = new URL(raw);
    if (url.hostname === 'upload.wikimedia.org') {
      url.pathname = url.pathname.replace(/^(\/wikipedia\/[a-z]+)\/thumb\/(.+)\/[^/]+$/, '$1/$2');
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function cleanText(text) {
  return String(text ?? '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Concise alt text: the caption/title, whitespace-collapsed, capped at ~200 chars on a word boundary. */
export function altFor(ref) {
  let text = cleanText(ref.caption);
  if (!text) text = ref.title ? `Taylor Swift: ${cleanText(ref.title)}` : '';
  if (!text) return '';
  if (text.length <= 200) return text;
  const cut = text.slice(0, 200);
  const sentence = cut.match(/^(.{40,}?[.!?])(\s|$)/);
  if (sentence) return sentence[1];
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[,;:\s-]+$/, '');
}

/** Every site-photo ref in the given seed modules: `[{ file, mod }]` where `mod` is the module namespace. */
export function enumerateSitePhotoRefs(modules) {
  const refs = [];
  // content/<era>.mjs: the file's own era wins; never inferred from item fields.
  const walk = (value, ctx, arrayKey, file) => {
    const fileEra = /^content\/([^/]+)\.mjs$/.exec(file)?.[1];
    if (Array.isArray(value)) return value.forEach((entry) => walk(entry, ctx, arrayKey, file));
    if (!value || typeof value !== 'object') return;
    const era = fileEra ?? ERA_KEYS.map((k) => value[k]).find((v) => typeof v === 'string') ?? ctx.era;
    const title = typeof value.title === 'string' ? value.title : typeof value.name === 'string' ? value.name : ctx.title;
    const here = { era, title };
    if (PHOTO_ARRAY_KEYS.has(arrayKey) && typeof value.url === 'string') {
      refs.push({ file, field: 'url', url: value.url, era, title, caption: value.caption ?? value.alt, credit: value.credit, kind: value.kind });
    }
    if (typeof value.thumbnailUrl === 'string') {
      refs.push({ file, field: 'thumbnailUrl', url: value.thumbnailUrl, era, title: here.title, caption: undefined, credit: undefined, kind: undefined });
    }
    for (const [key, child] of Object.entries(value)) {
      if (!SKIP_KEYS.has(key)) walk(child, here, key, file);
    }
  };
  for (const { file, mod } of modules) {
    for (const exported of Object.values(mod)) walk(exported, {}, '', file);
  }
  return refs;
}

/** First matching exclusion reason for a ref, or null when it is a candidate. */
export function exclusionReason(ref) {
  let url;
  try {
    url = new URL(ref.url);
  } catch {
    return 'not-a-url';
  }
  if (!/^https?:$/.test(url.protocol)) return 'not-a-url';
  const host = url.hostname;
  if (WATERMARK_HOSTS.test(host)) return 'getty-or-stock-comp-host';
  if (WATERMARKED_OUTLET_HOSTS.test(host)) return 'watermarked-outlet-host';
  if (THUMBNAIL_HOSTS.test(host)) return 'youtube-thumbnail';
  if (MERCH_HOSTS.test(host)) return 'merch-or-product-host';
  if (COVER_ART_HOSTS.test(host) || /^\/wikipedia\/en\//.test(url.pathname) && host === 'upload.wikimedia.org') return 'album-cover-art';
  if (ref.kind !== undefined && !TAYLOR_KINDS.has(ref.kind)) return 'not-taylor-kind';
  if (NON_PHOTO_TEXT.test(`${ref.caption ?? ''} ${ref.credit ?? ''}`)) return 'non-photo-cover-art-or-graphic';
  if (WATERMARK_HINT.test(decodeURIComponent(url.pathname))) return 'watermark-hint-in-url';
  if (!IMAGE_EXT.test(url.pathname)) return 'no-image-extension';
  if (!altFor(ref)) return 'no-alt-text';
  return null;
}

/** Splits refs into `candidates` (deduped by normalized URL, first wins) and per-reason exclusion counts. */
export function selectCandidates(refs, { libraryUrls = new Set() } = {}) {
  const excluded = {};
  const bump = (reason) => (excluded[reason] = (excluded[reason] ?? 0) + 1);
  const seen = new Set();
  const candidates = [];
  for (const ref of refs) {
    const reason = exclusionReason(ref);
    if (reason) {
      bump(reason);
      continue;
    }
    const url = normalizeSiteUrl(ref.url);
    if (libraryUrls.has(url) || libraryUrls.has(ref.url)) {
      bump('already-in-library');
      continue;
    }
    if (seen.has(url)) {
      bump('duplicate-url');
      continue;
    }
    seen.add(url);
    candidates.push({ ...ref, url });
  }
  return { candidates, excluded };
}

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/** Stable id from era + source URL, so reruns and resumed batches never mint a second id for the same photo. */
export function siteEntryId(ref) {
  const era = String(ref.era ?? 'site').replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'site';
  return `site-${era}-${sha256(Buffer.from(ref.url)).slice(0, 10)}`;
}

/** The inventory entry for a downloaded photo (validatePhotoEntry-shaped; `credit` omitted when the seed has none). */
export function buildEntry(ref, ext) {
  const id = siteEntryId(ref);
  const entry = { id, mediaPath: `/social/library/photos/${id}.${ext}` };
  if (typeof ref.credit === 'string' && ref.credit.trim()) entry.credit = ref.credit.trim();
  entry.source = ref.url;
  entry.alt = altFor(ref);
  entry.tags = [ref.era, 'site-photo'].filter(Boolean);
  return entry;
}
