// Persistent-corner (burned-in logo / channel bug) check across the frames of ONE
// video. Founder rule: no watermarks — a video whose frames carry a fixed corner
// mark is dropped WHOLE (never cropped).
//
// Design: every frame is squashed to 160x90 greyscale; each corner patch is 12% x 12%
// (19x11 px). Per corner we take the per-pixel MEDIAN patch over all frames and count the
// frames where >= PATCH_MATCH_FRACTION of the patch's pixels are within PIXEL_TOLERANCE of it
// (a mark rarely fills the whole patch — it sits a margin in from the edge — so the metric is a
// pixel fraction, not a mean, which the varying background around the mark would swamp). A corner is a logo when
//   - >= LOGO_FRAME_RATIO of the frames match the median patch, AND
//   - the median patch has spatial detail (stddev >= PATCH_DETAIL_MIN: a flat/black corner
//     or letterbox is not a logo), AND
//   - the centre of the image varies across frames (mean abs diff to the per-pixel median
//     >= CENTRE_VARIATION_MIN) so a static scene is not mistaken for a mark.
// Needs >= MIN_FRAMES frames (Mode B's 3 stills must ALL match, 2/3 < 0.7).
// Limits: a mark that is faint, animated, mid-frame or only on some frames is NOT caught;
// a static-camera video with a detailed fixed corner AND a varying centre can false-positive
// (the video is then dropped — the safe direction).
import sharp from 'sharp';

export const W = 160;
export const H = 90;
export const PATCH_W = Math.round(W * 0.12);
export const PATCH_H = Math.round(H * 0.12);
export const MIN_FRAMES = 3;
export const LOGO_FRAME_RATIO = 0.7;
export const PIXEL_TOLERANCE = 12; // grey levels
export const PATCH_MATCH_FRACTION = 0.75; // of a patch's pixels within tolerance of the median patch
export const PATCH_DETAIL_MIN = 10;
export const CENTRE_VARIATION_MIN = 12;

const CORNERS = {
  'top-left': [0, 0],
  'top-right': [W - PATCH_W, 0],
  'bottom-left': [0, H - PATCH_H],
  'bottom-right': [W - PATCH_W, H - PATCH_H],
};

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

function region(x0, y0, w, h) {
  const idx = [];
  for (let y = y0; y < y0 + h; y += 1) for (let x = x0; x < x0 + w; x += 1) idx.push(y * W + x);
  return idx;
}

/** Mean abs diff (over `idx`) of each frame to the per-pixel median over all frames, plus that median. */
function diffsToMedian(rasters, idx) {
  const med = idx.map((i) => median(rasters.map((r) => r[i])));
  const diffs = rasters.map((r) => idx.reduce((s, i, k) => s + Math.abs(r[i] - med[k]), 0) / idx.length);
  return { med, diffs };
}

/** `{corner, ratio}` for the first persistent corner mark, or null. Takes decoded image buffers. */
export async function detectPersistentLogo(buffers) {
  if (buffers.length < MIN_FRAMES) return null;
  const rasters = await Promise.all(buffers.map((b) => sharp(b).greyscale().resize(W, H, { fit: 'fill' }).raw().toBuffer()));
  const centre = diffsToMedian(rasters, region(Math.round(W * 0.2), Math.round(H * 0.2), Math.round(W * 0.6), Math.round(H * 0.6)));
  const centreVariation = centre.diffs.reduce((s, d) => s + d, 0) / centre.diffs.length;
  if (centreVariation < CENTRE_VARIATION_MIN) return null;
  for (const [corner, [x0, y0]] of Object.entries(CORNERS)) {
    const { med } = diffsToMedian(rasters, region(x0, y0, PATCH_W, PATCH_H));
    const mean = med.reduce((s, v) => s + v, 0) / med.length;
    const detail = Math.sqrt(med.reduce((s, v) => s + (v - mean) ** 2, 0) / med.length);
    const idx = region(x0, y0, PATCH_W, PATCH_H);
    const matching = rasters.filter((r) => idx.filter((i, k) => Math.abs(r[i] - med[k]) <= PIXEL_TOLERANCE).length / idx.length >= PATCH_MATCH_FRACTION);
    const ratio = matching.length / rasters.length;
    if (ratio >= LOGO_FRAME_RATIO && detail >= PATCH_DETAIL_MIN) return { corner, ratio };
  }
  return null;
}
