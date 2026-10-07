// Which library photos Instagram will actually accept. Instagram rejects any
// image outside this width/height window at publish time ("the aspect ratio is
// not supported"), and every pair needs an Instagram half — so a photo outside
// it can never ship, however unused it is. 34 of the 54 library photos were
// outside it on 2026-09-30 (portrait fan photos, wide stage grabs), which left
// ten never-used, IG-valid tiles and made every calendar-assigned photo fail
// check-drafts one at a time (Bots v2 W8). check-drafts.mjs reads the same
// constants so the pre-compute and the gate can never disagree.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { imageMeta } from '../../content-engine/checkers/image-liveness.mjs';

export const IG_MIN_ASPECT_RATIO = 0.8;
export const IG_MAX_ASPECT_RATIO = 1.91;

export const isIgAspect = (width, height) => {
  const ratio = width / height;
  return Number.isFinite(ratio) && ratio >= IG_MIN_ASPECT_RATIO && ratio <= IG_MAX_ASPECT_RATIO;
};

/** `{ usable: Set<id>, unreadable: id[] }` — an unreadable file is NOT usable (fail closed). */
export async function igUsablePhotos(library, publicDir) {
  const usable = new Set();
  const unreadable = [];
  for (const entry of library) {
    try {
      const meta = imageMeta(await readFile(path.join(publicDir, entry.mediaPath)));
      if (meta?.width && meta?.height && isIgAspect(meta.width, meta.height)) usable.add(entry.id);
    } catch {
      unreadable.push(entry.id);
    }
  }
  return { usable, unreadable };
}
