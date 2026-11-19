// #6806: Tree could not look at a library photo — the checkout and the site
// both serve 131-byte Git LFS pointer text. fetch-photo.mjs resolves the
// pointer and writes real bytes somewhere Tree can read them.
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';

import { fetchPhoto, imageKind, normalizeMediaPath, resolveOutPath } from './fetch-photo.mjs';

const MEDIA = '/social/library/photos/fetch-photo-test.jpg';
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const pointerFor = (b: Buffer) =>
  Buffer.from(
    `version https://git-lfs.github.com/spec/v1\noid sha256:${sha(b)}\nsize ${b.length}\n`,
  );
const body = (b: Buffer) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);

/** A real JPEG, comfortably over the 1000-byte floor the acceptance check names. */
async function photo(seed: number) {
  const cells = Buffer.alloc(16 * 16 * 3);
  let s = seed;
  for (let i = 0; i < cells.length; i += 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    cells[i] = s >>> 24;
  }
  return sharp(cells, { raw: { width: 16, height: 16, channels: 3 } })
    .resize(400, 300, { kernel: 'cubic' })
    .jpeg()
    .toBuffer();
}

describe('fetch-photo.mjs (#6806)', () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true });
  });
  const root = (contents?: Buffer) => {
    const r = mkdtempSync(path.join(tmpdir(), 'fetch-photo-'));
    roots.push(r);
    mkdirSync(path.join(r, 'apps/web/public/social/library/photos'), { recursive: true });
    if (contents) writeFileSync(path.join(r, 'apps/web/public', MEDIA), contents);
    return r;
  };
  /** Every request serves `buf` — the pointer path is exercised by the on-disk pointer. */
  const serving = (buf: Buffer) => {
    const urls: string[] = [];
    const impl = (async (url: string) => {
      urls.push(url);
      return { ok: true, status: 200, arrayBuffer: async () => body(buf) };
    }) as unknown as typeof fetch;
    return { impl, urls };
  };

  it('writes a real JPEG over 1000 bytes from a pointer, to --out', async () => {
    const real = await photo(3);
    expect(real.length).toBeGreaterThan(1000);
    const r = root(pointerFor(real));
    const { impl, urls } = serving(real);
    const out = path.join(r, '.scratch/look/photo.jpg');
    const result = await fetchPhoto(
      { mediaPath: MEDIA, out },
      { root: r, fetchImpl: impl, retryDelayMs: 1 },
    );

    const written = readFileSync(out);
    expect(written.equals(real)).toBe(true);
    expect(written.length).toBeGreaterThan(1000);
    expect(imageKind(written)).toBe('jpeg');
    expect(result).toMatchObject({ mediaPath: MEDIA, out, kind: 'jpeg', bytes: real.length });
    expect(urls.at(-1)).toContain('https://media.githubusercontent.com/media/');
  });

  it('defaults --out to .scratch/photos/<basename> and never writes into the library', async () => {
    const real = await photo(4);
    const r = root(pointerFor(real));
    const result = await fetchPhoto(
      { mediaPath: MEDIA },
      { root: r, fetchImpl: serving(real).impl, retryDelayMs: 1 },
    );
    expect(result.out).toBe(path.join(r, '.scratch/photos/fetch-photo-test.jpg'));
    expect(readFileSync(result.out).equals(real)).toBe(true);
    expect(() =>
      resolveOutPath('apps/web/public/social/library/photos/x.jpg', MEDIA, { root: r }),
    ).toThrow(/apps\/web\/public/);
  });

  it('fails loudly when the bytes are still pointer text or not an image', async () => {
    const real = await photo(5);
    const pointer = pointerFor(real);
    // Pointer on disk AND an unverifiable download: resolveImageBytes gives up.
    const bad = root(pointer);
    await expect(
      fetchPhoto(
        { mediaPath: MEDIA, out: path.join(bad, '.scratch/x.jpg') },
        { root: bad, fetchImpl: serving(pointer).impl, retryDelayMs: 1 },
      ),
    ).rejects.toThrow(/could not read/);
    // Committed non-image bytes are read locally and rejected on their magic bytes.
    const junk = root(Buffer.from('this is a text file, not a photo at all'));
    await expect(
      fetchPhoto(
        { mediaPath: MEDIA, out: path.join(junk, '.scratch/x.jpg') },
        { root: junk, retryDelayMs: 1 },
      ),
    ).rejects.toThrow(/not a JPEG, PNG or WebP/);
  });

  it('normalizes the path and refuses anything outside the library', () => {
    expect(normalizeMediaPath(MEDIA)).toBe(MEDIA);
    expect(normalizeMediaPath('social/library/photos/a.png')).toBe('/social/library/photos/a.png');
    expect(normalizeMediaPath('apps/web/public/social/library/cards/a.png')).toBe(
      '/social/library/cards/a.png',
    );
    expect(() => normalizeMediaPath('/etc/passwd.jpg')).toThrow(/not a \/social\//);
    expect(() => normalizeMediaPath('/social/library/photos/../../../secret.jpg')).toThrow(/\.\./);
    expect(() => normalizeMediaPath('/social/library/photos/a.svg')).toThrow(/must end in/);
    expect(() => normalizeMediaPath('')).toThrow(/required/);
  });
});
