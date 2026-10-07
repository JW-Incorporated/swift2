// Cheap 64-bit difference hash (dHash) for near-duplicate detection: the same
// wire photo republished by several outlets differs byte-for-byte (recompressed,
// resized) so sha256 misses it, but its dHash stays within a few bits.

/** Max differing bits (of 64) for two photos to count as the same picture. */
export const NEAR_DUPLICATE_MAX_BITS = 4;

/** dHash of an image buffer as a 16-char hex string, or `null` when it cannot be decoded. */
export async function dHash(buf) {
  try {
    const { default: sharp } = await import('sharp');
    const pixels = await sharp(buf).rotate().greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
    let bits = 0n;
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        bits = (bits << 1n) | (pixels[row * 9 + col] > pixels[row * 9 + col + 1] ? 1n : 0n);
      }
    }
    return bits.toString(16).padStart(16, '0');
  } catch {
    return null;
  }
}

export function hammingDistance(a, b) {
  let diff = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let count = 0;
  while (diff) {
    count += Number(diff & 1n);
    diff >>= 1n;
  }
  return count;
}

/** The earlier entry `{ hash, id }` within `maxBits` of `hash`, or `undefined`. */
export function findNearDuplicate(hash, seen, maxBits = NEAR_DUPLICATE_MAX_BITS) {
  return hash ? seen.find((entry) => hammingDistance(entry.hash, hash) <= maxBits) : undefined;
}
