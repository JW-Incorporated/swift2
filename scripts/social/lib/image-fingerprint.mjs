// Perceptual image fingerprint behind "we never post the same picture twice"
// (issue #5990). Builds on the 64-bit dHash in perceptual-hash.mjs (sharp is a
// root dependency; prebuilt binaries, no native build step in CI or on Windows).
//
// A fingerprint is `{ hash, crops }`: `hash` is the dHash of the whole picture
// (EXIF orientation applied); `crops` are dHashes of the CENTRE crop to the
// aspect ratios the platforms use (1:1, 4:5 Instagram portrait, 1.91:1 link
// card), so a re-cropped copy of a photo still lands within the threshold of
// the original. Two fingerprints MATCH when any of
//   whole-vs-whole, whole-vs-their-crops, our-crops-vs-their-whole
// is within IMAGE_MATCH_MAX_BITS of 64.
//
// Not covered by pixels: the library's padded Instagram variants (-ig45/-ig191,
// the original letterboxed over a blurred copy of itself); those are linked by
// the library's `variantOf` and matched by path in image-ledger.mjs.
//
// Threshold: 6 bits. Resized (down to 1/8 area), JPEG re-encoded (q40-q95) and
// PNG round-tripped copies measure 0-3 bits (image-fingerprint.test.ts); an
// unrelated photograph averages ~32 and the closest distinct pair in the
// backfilled ledger is far above 6 (see social/README.md "Posted-image
// ledger"). Low-information images (near-flat dHash: blank or single-colour
// cards) carry no signal, so they only match at distance 0.
import { hammingDistance } from './perceptual-hash.mjs';

/** Max differing bits (of 64) for two images to count as the same picture. */
export const IMAGE_MATCH_MAX_BITS = 6;

/** Centre-crop aspect ratios (width / height) hashed alongside the whole picture. */
export const CROP_RATIOS = [1, 0.8, 1.91];

const FLAT_MIN_BITS = 8;

const popcount = (hex) => hammingDistance(hex, '0000000000000000');

async function hashRegion(sharp, raw, info, region) {
  let img = sharp(raw, { raw: info });
  if (region) img = img.extract(region);
  const px = await img.greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  let bits = 0n;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      bits = (bits << 1n) | (px[row * 9 + col] > px[row * 9 + col + 1] ? 1n : 0n);
    }
  }
  return bits.toString(16).padStart(16, '0');
}

/**
 * Fingerprint of an image buffer, or `null` when it cannot be decoded (callers
 * on a posting path MUST treat null as a refusal, never a pass).
 */
export async function fingerprintImage(buf) {
  try {
    const { default: sharp } = await import('sharp');
    const { data, info } = await sharp(buf).rotate().removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const raw = { width: info.width, height: info.height, channels: info.channels };
    const hash = await hashRegion(sharp, data, raw, null);
    const aspect = info.width / info.height;
    const crops = [];
    for (const ratio of CROP_RATIOS) {
      if (Math.abs(aspect - ratio) / ratio < 0.03) continue;
      const width = aspect > ratio ? Math.max(1, Math.round(info.height * ratio)) : info.width;
      const height = aspect > ratio ? info.height : Math.max(1, Math.round(info.width / ratio));
      const region = { left: Math.floor((info.width - width) / 2), top: Math.floor((info.height - height) / 2), width, height };
      const crop = await hashRegion(sharp, data, raw, region);
      if (crop !== hash && !crops.includes(crop)) crops.push(crop);
    }
    return { hash, crops };
  } catch {
    return null;
  }
}

/** True when a fingerprint is `{ hash: 16 hex, crops: 16-hex[] }`. */
export function isFingerprint(fp) {
  return Boolean(fp) && /^[0-9a-f]{16}$/.test(fp.hash ?? '') && Array.isArray(fp.crops ?? []) && (fp.crops ?? []).every((c) => /^[0-9a-f]{16}$/.test(c));
}

/** Smallest Hamming distance between any comparable pair of the two fingerprints. */
export function fingerprintDistance(a, b) {
  const ac = a.crops ?? [];
  const bc = b.crops ?? [];
  let best = hammingDistance(a.hash, b.hash);
  for (const c of bc) best = Math.min(best, hammingDistance(a.hash, c));
  for (const c of ac) best = Math.min(best, hammingDistance(c, b.hash));
  return best;
}

/** True when `a` and `b` are the same picture (see the header for the rule). */
export function fingerprintsMatch(a, b, maxBits = IMAGE_MATCH_MAX_BITS) {
  if (!isFingerprint(a) || !isFingerprint(b)) return false;
  const flat = popcount(a.hash) < FLAT_MIN_BITS || popcount(b.hash) < FLAT_MIN_BITS || popcount(a.hash) > 64 - FLAT_MIN_BITS || popcount(b.hash) > 64 - FLAT_MIN_BITS;
  return fingerprintDistance(a, b) <= (flat ? 0 : maxBits);
}

