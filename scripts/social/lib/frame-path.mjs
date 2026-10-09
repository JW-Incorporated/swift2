// Confines the importer's local `file://` sourceUrl support to the frames scratch
// directory written by source-video-frames.mjs (candidate JSON is data, never trusted
// to name an arbitrary file). Symlinks are resolved on BOTH sides before the check.
import { realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Real path of the frame a `file:` URL names, or throws when it is outside `framesDir` or not a .jpg. */
export async function resolveFrameFile(sourceUrl, framesDir) {
  let target;
  try {
    target = path.resolve(fileURLToPath(sourceUrl));
  } catch {
    throw new Error(`refusing local sourceUrl "${sourceUrl}": not a valid file URL`);
  }
  if (!/\.jpg$/i.test(target)) throw new Error(`refusing local sourceUrl "${sourceUrl}": only .jpg frames are accepted`);
  let realTarget;
  let realDir;
  try {
    [realTarget, realDir] = await Promise.all([realpath(target), realpath(framesDir)]);
  } catch {
    throw new Error(`refusing local sourceUrl "${sourceUrl}": file or frames directory does not exist`);
  }
  const rel = path.relative(realDir, realTarget);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`refusing local sourceUrl "${sourceUrl}": outside the frames scratch directory`);
  }
  if (!/\.jpg$/i.test(realTarget)) throw new Error(`refusing local sourceUrl "${sourceUrl}": only .jpg frames are accepted`);
  return realTarget;
}
