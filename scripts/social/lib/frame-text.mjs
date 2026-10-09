// Title/end-card text heuristic on a 320px-wide greyscale raster. A frame is a text
// card when ALL hold:
//   1. a flat background: >=CARD_BG_FRACTION_MIN of pixels within +-CARD_BG_TOLERANCE of the
//      dominant luminance;
//   2. high-contrast structure (>CARD_CONTRAST_DELTA grey levels off that background)
//      covering CARD_CONTRAST_FRACTION of the frame (a little ink, not a whole subject);
//   3. a LINE OF GLYPHS: >=CARD_ALIGNED_MIN small connected components (bbox height
//      CARD_GLYPH_HEIGHT px, <=CARD_GLYPH_MAX_W wide, area >=CARD_GLYPH_MIN_AREA) whose
//      vertical centres agree within 2 px and heights within 30%.
// (Rows-crossed counting was tried first and rejected: sequins, curtains and hair on a flat
// backdrop produce the same crossings and dropped ~40% of good frames.)
// Limits: stylised/very large lettering, or text over a busy picture, is not caught.
export const CARD_BG_FRACTION_MIN = 0.5;
export const CARD_BG_TOLERANCE = 12;
export const CARD_CONTRAST_DELTA = 90;
export const CARD_CONTRAST_FRACTION = [0.003, 0.2];
export const CARD_GLYPH_HEIGHT = [4, 45];
export const CARD_GLYPH_MAX_W = 60;
export const CARD_GLYPH_MIN_AREA = 6;
export const CARD_ALIGNED_MIN = 6;

function glyphComponents(mask, w, h) {
  const seen = new Uint8Array(mask.length);
  const out = [];
  const stack = [];
  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || seen[start]) continue;
    let minX = w;
    let maxX = 0;
    let minY = h;
    let maxY = 0;
    let area = 0;
    seen[start] = 1;
    stack.push(start);
    while (stack.length) {
      const p = stack.pop();
      const x = p % w;
      const y = (p - x) / w;
      area += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q >= 0 && mask[q] && !seen[q]) {
          seen[q] = 1;
          stack.push(q);
        }
      }
    }
    const height = maxY - minY + 1;
    if (area >= CARD_GLYPH_MIN_AREA && height >= CARD_GLYPH_HEIGHT[0] && height <= CARD_GLYPH_HEIGHT[1] && maxX - minX + 1 <= CARD_GLYPH_MAX_W) {
      out.push({ cy: (minY + maxY) / 2, height });
    }
  }
  return out;
}

/** True when a greyscale raster looks like a title/end card (flat background + a line of glyphs). */
export function looksLikeTextCard(data, w, h) {
  const bins = new Array(32).fill(0);
  for (const v of data) bins[v >> 3] += 1;
  const bg = bins.indexOf(Math.max(...bins)) * 8 + 4;
  const mask = new Uint8Array(data.length);
  let uniform = 0;
  let contrast = 0;
  for (let i = 0; i < data.length; i += 1) {
    const d = Math.abs(data[i] - bg);
    if (d <= CARD_BG_TOLERANCE) uniform += 1;
    else if (d > CARD_CONTRAST_DELTA) {
      contrast += 1;
      mask[i] = 1;
    }
  }
  const n = data.length;
  if (uniform / n < CARD_BG_FRACTION_MIN) return false;
  if (contrast / n < CARD_CONTRAST_FRACTION[0] || contrast / n > CARD_CONTRAST_FRACTION[1]) return false;
  const glyphs = glyphComponents(mask, w, h);
  return glyphs.some((g) => glyphs.filter((o) => Math.abs(o.cy - g.cy) <= 2 && Math.abs(o.height - g.height) <= Math.max(2, 0.3 * g.height)).length >= CARD_ALIGNED_MIN);
}
