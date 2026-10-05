// Placeholder guard for third-party art: hotlink-protected hosts answer with a 1x1 pixel, an HTML page or a tiny error image.
/** A HEAD Content-Length below this is a placeholder, not art. */
export const MIN_THIRD_PARTY_BYTES = 2048;
/** Bytes `hasImageMagic` needs. */
export const MAGIC_BYTES = 12;

export function isImageType(type: string | null): boolean {
  return typeof type === 'string' && type.trim().toLowerCase().startsWith('image/');
}

const ascii = (b: Uint8Array, at: number, s: string) => [...s].every((c, i) => b[at + i] === c.charCodeAt(0));

/** JPEG, PNG, WebP, GIF or AVIF by magic bytes. */
export function hasImageMagic(b: Uint8Array): boolean {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return true;
  if (b.length >= 4 && b[0] === 0x89 && ascii(b, 1, 'PNG')) return true;
  if (b.length >= 4 && ascii(b, 0, 'GIF8')) return true;
  if (b.length >= 12 && ascii(b, 0, 'RIFF') && ascii(b, 8, 'WEBP')) return true;
  return b.length >= 12 && ascii(b, 4, 'ftyp') && (ascii(b, 8, 'avif') || ascii(b, 8, 'avis'));
}
