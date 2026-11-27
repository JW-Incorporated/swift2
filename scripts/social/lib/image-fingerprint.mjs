// Perceptual image fingerprint behind "we never post the same picture twice"
// (issue #5990). Builds on the 64-bit dHash in perceptual-hash.mjs (sharp is a
// root dependency; prebuilt binaries, no native build step in CI or on Windows).
//
// A fingerprint is `{ hash, crops }`: `hash` is the dHash of the whole picture
// (EXIF orientation applied); `crops` are dHashes of the CENTRE crop to the
// aspect ratios the platforms use (1:1, 4:5 Instagram portrait, 1.91:1 link
// card), so a re-cropped copy of a photo still lands within the threshold of
// the original. Two fingerprints MATCH when whole-vs-whole is within
// IMAGE_MATCH_MAX_BITS, or when a CROP comparison (whole-vs-their-crops,
// our-crops-vs-their-whole) is within the tighter IMAGE_CROP_MATCH_MAX_BITS.
//
// Not covered by pixels: the library's padded Instagram variants (-ig45/-ig191,
// the original letterboxed over a blurred copy of itself); those are linked by
// the library's `variantOf` and matched by path in image-ledger.mjs.
//
// Thresholds: 6 bits whole-vs-whole, 3 bits for a crop comparison. Resized
// (down to 1/8 area), JPEG re-encoded (q40-q95) and PNG round-tripped copies
// measure 0-3 bits (image-fingerprint.test.ts); an unrelated photograph
// averages ~32 and the closest distinct pair in the backfilled ledger is far
// above 6 (see social/README.md "Posted-image ledger").
//
// The crop bound is tighter because a crop comparison is SPECULATIVE: it asks
// "was this the centre of that?", and a crop hash throws away the context that
// makes the whole-picture hash discriminating, so its 4-6 bit band is noise
// rather than signal. Measured over the 569-photo library (#7186): a genuine
// centre crop of a photo scores 0-3 bits against the original in 115 of 120
// cases and the 5 misses are already far above 6, while four pairs of plainly
// different photographs scored 5-6 on a crop comparison with whole-vs-whole
// distances of 11-16 - one of them blocked a Tree draft. At 3 bits those four
// stop matching and the one genuine re-crop in the library (distance 1) is
// still caught. Low-information images (near-flat dHash: blank or
// single-colour cards) carry no signal, so they only match at distance 0.
import { hammingDistance } from './perceptual-hash.mjs';

/** Max differing bits (of 64) for two whole images to count as the same picture. */
export const IMAGE_MATCH_MAX_BITS = 6;

/**
 * Max differing bits for a CROP comparison (one side's centre crop against the
 * other's whole picture). Tighter than IMAGE_MATCH_MAX_BITS - see the header.
 */
export const IMAGE_CROP_MATCH_MAX_BITS = 3;

/** Centre-crop aspect ratios (width / height) hashed alongside the whole picture. */
export const CROP_RATIOS = [1, 0.8, 1.91];

const FLAT_MIN_BITS = 8;

const popcount = (hex) => hammingDistance(hex, '0000000000000000');

let enginePromise;

/**
 * `{ sharp, notInstalled }` — the image engine, memoized. `sharp` is null when
 * it cannot be loaded here; `notInstalled` is true only for the one cause that
 * is an ENVIRONMENT fact rather than a broken dependency: node_modules is
 * absent (ERR_MODULE_NOT_FOUND). A routine's agent job checks the repo out
 * without `npm ci` (routine-template.yml never installs), so the fingerprinter
 * is genuinely missing there — see fingerprintEngineMissing (#6096).
 */
async function loadEngine() {
  try {
    return { sharp: (await import('sharp')).default, notInstalled: false };
  } catch (err) {
    return { sharp: null, notInstalled: err?.code === 'ERR_MODULE_NOT_FOUND' };
  }
}

/**
 * True when sharp is not installed in this checkout at all, so NOTHING can be
 * fingerprinted and the same-picture check could not run — a different thing
 * from an image whose bytes will not decode, which stays a refusal. A sharp
 * that is installed but fails to load (broken native binary) is NOT this: that
 * must keep failing closed in the trusted pre-merge runs.
 */
export async function fingerprintEngineMissing() {
  enginePromise ??= loadEngine();
  return (await enginePromise).notInstalled;
}

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
 * on a posting path MUST treat null as a refusal, never a pass) — or when the
 * engine itself is unavailable, which `fingerprintEngineMissing` distinguishes.
 */
export async function fingerprintImage(buf) {
  try {
    enginePromise ??= loadEngine();
    const { sharp } = await enginePromise;
    if (!sharp) return null;
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

/**
 * `{ whole, crop }` - the whole-vs-whole Hamming distance, and the smallest
 * distance over the crop comparisons (Infinity when neither side has a crop).
 * The two are judged against different bounds, so they stay separate.
 */
export function fingerprintDistances(a, b) {
  const whole = hammingDistance(a.hash, b.hash);
  let crop = Infinity;
  for (const c of b.crops ?? []) crop = Math.min(crop, hammingDistance(a.hash, c));
  for (const c of a.crops ?? []) crop = Math.min(crop, hammingDistance(c, b.hash));
  return { whole, crop };
}

/** Smallest Hamming distance between any comparable pair of the two fingerprints. */
export function fingerprintDistance(a, b) {
  const { whole, crop } = fingerprintDistances(a, b);
  return Math.min(whole, crop);
}

/** True when `a` and `b` are the same picture (see the header for the rule). */
export function fingerprintsMatch(a, b, maxBits = IMAGE_MATCH_MAX_BITS, cropMaxBits = IMAGE_CROP_MATCH_MAX_BITS) {
  if (!isFingerprint(a) || !isFingerprint(b)) return false;
  const flat = popcount(a.hash) < FLAT_MIN_BITS || popcount(b.hash) < FLAT_MIN_BITS || popcount(a.hash) > 64 - FLAT_MIN_BITS || popcount(b.hash) > 64 - FLAT_MIN_BITS;
  const { whole, crop } = fingerprintDistances(a, b);
  if (flat) return Math.min(whole, crop) === 0;
  return whole <= maxBits || crop <= Math.min(cropMaxBits, maxBits);
}

