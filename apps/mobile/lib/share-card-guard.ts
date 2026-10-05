// Bounds for a downloaded share card: a size cap and a PNG/JPEG magic-byte check (expo-file-system exposes no response headers).
export const MAX_CARD_BYTES = 5 * 1024 * 1024;

export function isCardImage(head: Uint8Array): boolean {
  const png = head.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => head[i] === b);
  const jpeg = head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  return png || jpeg;
}

/** Throws unless a finished download is within the size cap and is a PNG/JPEG. */
export function assertCardFile(size: number, head: Uint8Array): void {
  if (size > MAX_CARD_BYTES) throw new Error('share card too large');
  if (!isCardImage(head)) throw new Error('share card is not a png/jpeg');
}
