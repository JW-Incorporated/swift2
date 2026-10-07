// Quality gates for video stills (source-video-frames.mjs): drops near-black /
// near-white, flat, blurry and letterboxed frames, and near-duplicates (dHash).
// Pure functions over a decoded image buffer + sharp; no network, no video.
import sharp from 'sharp';

export const MIN_WIDTH_PX = 1280;
export const MEAN_MIN = 18;
export const MEAN_MAX = 238;
export const LUMA_VARIANCE_MIN = 250;
export const SHARPNESS_MIN = 12; // variance of the Laplacian, 320px-wide greyscale
export const BAR_MEAN_MAX = 10;
export const DUPLICATE_HAMMING_MAX = 6; // of 64 bits

function stats(raw) {
  let sum = 0;
  for (const v of raw) sum += v;
  const mean = sum / raw.length;
  let sq = 0;
  for (const v of raw) sq += (v - mean) ** 2;
  return { mean, variance: sq / raw.length };
}

/** Measures one image: dimensions, luminance mean/variance, Laplacian variance, edge-bar flag, 64-bit dHash. */
export async function analyzeFrame(buffer) {
  const meta = await sharp(buffer).metadata();
  const grey = sharp(buffer).greyscale();
  const small = await grey.clone().resize(320, null).raw().toBuffer({ resolveWithObject: true });
  const luma = stats(small.data);
  const lap = await grey
    .clone()
    .resize(320, null)
    .convolve({ width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0], offset: 128 })
    .raw()
    .toBuffer();
  const sharpness = stats(lap).variance;

  const { width: w, height: h, channels } = small.info;
  const rowMean = (from, to) => {
    let s = 0;
    for (let y = from; y < to; y += 1) for (let x = 0; x < w; x += 1) s += small.data[(y * w + x) * channels];
    return s / ((to - from) * w);
  };
  const band = Math.max(1, Math.floor(h * 0.08));
  const letterboxed = rowMean(0, band) < BAR_MEAN_MAX && rowMean(h - band, h) < BAR_MEAN_MAX && luma.mean >= BAR_MEAN_MAX;

  const hashRaw = await grey.clone().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  let bits = '';
  for (let y = 0; y < 8; y += 1) for (let x = 0; x < 8; x += 1) bits += hashRaw[y * 9 + x] < hashRaw[y * 9 + x + 1] ? '1' : '0';
  return { width: meta.width ?? 0, height: meta.height ?? 0, mean: luma.mean, variance: luma.variance, sharpness, letterboxed, hash: bits };
}

/** Returns a reason string when the frame must be dropped, else null. */
export function rejectReason(a, { minWidth = MIN_WIDTH_PX } = {}) {
  if (a.width < minWidth) return `too small (${a.width}px wide, need ${minWidth})`;
  if (a.mean < MEAN_MIN) return 'near-black';
  if (a.mean > MEAN_MAX) return 'near-white';
  if (a.variance < LUMA_VARIANCE_MIN) return 'flat (low luminance variance)';
  if (a.sharpness < SHARPNESS_MIN) return 'blurry';
  if (a.letterboxed) return 'letterboxed (black bars)';
  return null;
}

export function hamming(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) d += 1;
  return d;
}

/** Keeps the first of each near-duplicate cluster; `known` hashes (e.g. earlier frames) also count. */
export function dedupeByHash(items, { known = [], max = DUPLICATE_HAMMING_MAX } = {}) {
  const kept = [];
  const hashes = [...known];
  for (const item of items) {
    if (hashes.some((h) => hamming(h, item.hash) <= max)) continue;
    hashes.push(item.hash);
    kept.push(item);
  }
  return kept;
}
