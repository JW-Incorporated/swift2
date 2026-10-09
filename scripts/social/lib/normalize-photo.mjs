// Repo-size guard for every photo the importer lands (all sources): long edge
// capped at MAX_LONG_EDGE_PX (never upscaled), re-encoded at QUALITY, metadata
// (EXIF/GPS/ICC) stripped — 10k photos at ~1 MB would be ~10 GB of git history.
// Output format follows the destination extension so bytes always match the name.
import sharp from 'sharp';

export const MAX_LONG_EDGE_PX = 2048;
export const QUALITY = 85;

/** `{ width, height, bytes }` of the stored bytes (`{ bytes }` only when the buffer isn't a decodable image). */
export async function describePhoto(buffer) {
  try {
    const { width, height } = await sharp(buffer).metadata();
    return width && height ? { width, height, bytes: buffer.byteLength } : { bytes: buffer.byteLength };
  } catch {
    return { bytes: buffer.byteLength };
  }
}

/** Returns normalized bytes for jpg/png/webp destinations; other extensions pass through untouched. */
export async function normalizePhoto(buffer, mediaPath) {
  const ext = /\.(jpe?g|png|webp)$/i.exec(mediaPath ?? '')?.[1]?.toLowerCase();
  if (!ext) return buffer;
  // rotate() bakes in the EXIF orientation before the metadata is dropped (sharp strips by default).
  const pipeline = sharp(buffer).rotate().resize({ width: MAX_LONG_EDGE_PX, height: MAX_LONG_EDGE_PX, fit: 'inside', withoutEnlargement: true });
  if (ext === 'png') return pipeline.png({ compressionLevel: 9 }).toBuffer();
  if (ext === 'webp') return pipeline.webp({ quality: QUALITY }).toBuffer();
  return pipeline.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer();
}
