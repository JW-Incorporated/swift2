// Instagram-ready variants of library photos (Bots v2 W10). Instagram rejects
// any image outside a 0.8-1.91 width/height window (photo-dimensions.mjs), and
// 34 of the 54 library photos sat outside it — portrait fan photos and wide
// stage grabs — so Tree ran out of drawable tiles. A variant pads the ORIGINAL,
// uncropped and unaltered, onto an in-window canvas over a blurred, darkened
// copy of itself. It carries the original's credit/source/alt/tags and a
// `variantOf` link, and the reuse rules treat original + variant as ONE photo.
import sharp from 'sharp';
import { isIgAspect } from './photo-dimensions.mjs';

export const VARIANT_WIDTH = 1080;
export const PORTRAIT_CANVAS = { kind: 'portrait', suffix: '-ig45', width: VARIANT_WIDTH, height: 1350 };
export const WIDE_CANVAS = { kind: 'wide', suffix: '-ig191', width: VARIANT_WIDTH, height: 566 };
/** Repo-weight cap per variant (Instagram's own limit is 8 MB). */
export const VARIANT_MAX_BYTES = 1_000_000;
export const JPEG_QUALITIES = [88, 84, 80, 76, 70, 64];
const BACKDROP_BLUR_SIGMA = 40;
const BACKDROP_BRIGHTNESS = 0.5;

/** The padding canvas an out-of-window photo needs, or null when it is already Instagram-sized. */
export function variantPlan(width, height) {
  if (!(width > 0) || !(height > 0) || isIgAspect(width, height)) return null;
  return width / height < 1 ? PORTRAIT_CANVAS : WIDE_CANVAS;
}

/** `/social/library/photos/x.png` + `-ig45` -> `/social/library/photos/x-ig45.jpg`. */
export const variantMediaPath = (mediaPath, suffix) => mediaPath.replace(/\.[A-Za-z0-9]+$/, '') + `${suffix}.jpg`;

/** The library entry for a variant: every field of the original, re-pointed at the variant file. */
export function variantEntry(original, plan) {
  return { ...original, id: `${original.id}${plan.suffix}`, mediaPath: variantMediaPath(original.mediaPath, plan.suffix), variantOf: original.id };
}

/** `{ buffer, width, height, quality }` — the original centred (never upscaled) over its blurred, darkened self. */
export async function renderVariant(input, plan, { qualities = JPEG_QUALITIES, maxBytes = VARIANT_MAX_BYTES } = {}) {
  const backdrop = await sharp(input).rotate().resize(plan.width, plan.height, { fit: 'cover' }).blur(BACKDROP_BLUR_SIGMA).modulate({ brightness: BACKDROP_BRIGHTNESS }).toBuffer();
  const photo = await sharp(input).rotate().resize({ width: plan.width, height: plan.height, fit: 'inside', withoutEnlargement: true }).toBuffer();
  const canvas = sharp(backdrop).composite([{ input: photo, gravity: 'centre' }]);
  let out = null;
  for (const quality of qualities) {
    out = { buffer: await canvas.clone().jpeg({ quality }).toBuffer(), width: plan.width, height: plan.height, quality };
    if (out.buffer.byteLength <= maxBytes) break;
  }
  return out;
}
