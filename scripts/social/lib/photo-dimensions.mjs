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

// The only formats this pipeline produces and uploads. check-drafts.mjs
// hard-fails any other extension, so a photo the pre-compute offers in a
// format the gate refuses is a slot that can never pass the checker: on
// 2026-10-18 the library's one .gif was handed to Tree's beat as its assigned
// photo and the run burned 51/50 turns with no PR (issue #6058). Aspect ratio
// was filtered here; format was not.
export const ALLOWED_MEDIA_EXTENSIONS = new Set(['png', 'jpg', 'jpeg']);

/** True when `mediaPath`'s extension is one check-drafts.mjs will accept. */
export const hasAllowedMediaExtension = (mediaPath) =>
  ALLOWED_MEDIA_EXTENSIONS.has(String(mediaPath ?? '').split('.').pop()?.toLowerCase() ?? '');

export const isIgAspect = (width, height) => {
  const ratio = width / height;
  return Number.isFinite(ratio) && ratio >= IG_MIN_ASPECT_RATIO && ratio <= IG_MAX_ASPECT_RATIO;
};

/** `{ usable: Set<id>, unreadable: id[] }` — an unreadable file is NOT usable (fail closed). */
export async function igUsablePhotos(library, publicDir) {
  const usable = new Set();
  const unreadable = [];
  for (const entry of library) {
    // A format the checker refuses can never ship, whatever its dimensions.
    if (!hasAllowedMediaExtension(entry.mediaPath)) continue;
    // Library photos are Git LFS pointers in CI checkouts (docs/decisions.md
    // 2026-10-07), so recorded dimensions win over reading the binary.
    if (entry.width && entry.height) {
      if (isIgAspect(entry.width, entry.height)) usable.add(entry.id);
      continue;
    }
    try {
      const meta = imageMeta(await readFile(path.join(publicDir, entry.mediaPath)));
      if (meta?.width && meta?.height && isIgAspect(meta.width, meta.height)) usable.add(entry.id);
    } catch {
      unreadable.push(entry.id);
    }
  }
  return { usable, unreadable };
}
