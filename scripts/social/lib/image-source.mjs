// Loads a background photo (local file path or http(s) URL) into a data URI
// satori's <img src> can embed directly. Satori has no network/filesystem
// access of its own — every image must already be bytes by the time it sees
// the element tree — so this is the one place I/O happens for photo cards.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const EXT_MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

function extMime(p) {
  return EXT_MIME[path.extname(p).toLowerCase()] ?? 'image/jpeg';
}

/** @param {string} source local path or http(s) URL @returns {Promise<string>} data: URI */
export async function loadImageAsDataUri(source) {
  if (/^https?:\/\//i.test(source)) {
    const res = await fetch(source, {
      // Some CDNs (e.g. Getty) 403 requests with no browser-like UA/referer.
      // Wikimedia (our primary sanctioned source) doesn't need this, but it's
      // harmless to send everywhere and saves a second failure mode later.
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LongLiveSocialCardBot/1.0)' },
    });
    if (!res.ok)
      throw new Error(`Failed to fetch image ${source}: ${res.status} ${res.statusText}`);
    const contentType = res.headers.get('content-type')?.split(';')[0] || extMime(source);
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${contentType};base64,${buf.toString('base64')}`;
  }
  const buf = await readFile(source);
  return `data:${extMime(source)};base64,${buf.toString('base64')}`;
}
