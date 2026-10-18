import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';

import { guardImageReuse } from './guard-image-reuse.mjs';
import { fingerprintMedia, resolveImageBytes } from './lib/image-ledger.mjs';
import { parseLfsPointer } from './lib/lfs-pointer.mjs';

const MEDIA = '/social/library/photos/lfs-test.jpg';
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const pointerFor = (b: Buffer, oid = sha(b)) => Buffer.from(`version https://git-lfs.github.com/spec/v1\noid sha256:${oid}\nsize ${b.length}\n`);
const body = (b: Buffer) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);

async function photo(seed: number) {
  const cells = Buffer.alloc(12 * 12 * 3);
  let s = seed;
  for (let i = 0; i < cells.length; i += 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    cells[i] = s >>> 24;
  }
  return sharp(cells, { raw: { width: 12, height: 12, channels: 3 } }).resize(320, 240, { kernel: 'cubic' }).jpeg().toBuffer();
}

/** Mock fetch: the first (public-URL) request serves the pointer; later media-endpoint requests serve `real`. */
function mockFetch(pointer: Buffer, real: Buffer, local = false) {
  const urls: string[] = [];
  const impl = (async (url: string) => {
    urls.push(url);
    const out = urls.length === 1 && !local ? pointer : real;
    return { ok: true, status: 200, arrayBuffer: async () => body(out) };
  }) as unknown as typeof fetch;
  return { impl, urls };
}

describe('LFS pointer resolution (#6062)', () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true });
  });
  const root = (pointer?: Buffer) => {
    const r = mkdtempSync(path.join(tmpdir(), 'lfs-resolve-'));
    roots.push(r);
    mkdirSync(path.join(r, 'apps/web/public/social/library/photos'), { recursive: true });
    if (pointer) writeFileSync(path.join(r, 'apps/web/public', MEDIA), pointer);
    return r;
  };

  it('parses oid and size from a pointer', () => {
    const real = Buffer.from('abc');
    expect(parseLfsPointer(pointerFor(real))).toEqual({ oid: sha(real), size: 3 });
    expect(parseLfsPointer(Buffer.from('not a pointer'))).toBeNull();
  });

  it('resolves a URL-served pointer through the media endpoint and hashes the real bytes', async () => {
    const real = await photo(7);
    const { impl, urls } = mockFetch(pointerFor(real), real);
    const bytes = await resolveImageBytes(MEDIA, { root: root(), fetchImpl: impl, retryDelayMs: 1 });
    expect(bytes.equals(real)).toBe(true);
    expect(urls.at(-1)).toMatch(/^https:\/\/media\.githubusercontent\.com\/media\/JW-Incorporated\/swift2\/.+\/apps\/web\/public\/social\/library\/photos\/lfs-test\.jpg$/);
    expect(await fingerprintMedia(MEDIA, { root: root(), fetchImpl: impl, retryDelayMs: 1 })).not.toBeNull();
  });

  it('resolves a local pointer file without touching the public URL', async () => {
    const real = await photo(8);
    const { impl, urls } = mockFetch(pointerFor(real), real, true);
    const bytes = await resolveImageBytes(MEDIA, { root: root(pointerFor(real)), fetchImpl: impl, retryDelayMs: 1 });
    expect(bytes.equals(real)).toBe(true);
    expect(urls.every((u) => u.startsWith('https://media.githubusercontent.com/'))).toBe(true);
  });

  it('fails closed when the downloaded bytes do not match the pointer oid', async () => {
    const real = await photo(9);
    const { impl } = mockFetch(pointerFor(real, 'f'.repeat(64)), real);
    await expect(resolveImageBytes(MEDIA, { root: root(), fetchImpl: impl, retryDelayMs: 1 })).rejects.toThrow(/could not read/);
    expect(await fingerprintMedia(MEDIA, { root: root(), fetchImpl: mockFetch(pointerFor(real, 'f'.repeat(64)), real).impl, retryDelayMs: 1 })).toBeNull();
  });

  it('leaves a non-LFS image untouched (no network)', async () => {
    const real = await photo(10);
    const r = root(real);
    const impl = (async () => {
      throw new Error('network must not be used');
    }) as unknown as typeof fetch;
    expect((await resolveImageBytes(MEDIA, { root: r, fetchImpl: impl })).equals(real)).toBe(true);
  });

  it('guard pre-step: a due item whose image is an LFS pointer resolves and passes; a bad oid is held', async () => {
    const real = await photo(11);
    const build = (pointer: Buffer) => {
      const r = root(pointer);
      mkdirSync(path.join(r, 'social/queue'), { recursive: true });
      mkdirSync(path.join(r, 'social/posted'), { recursive: true });
      writeFileSync(path.join(r, 'social/photo-library.json'), JSON.stringify({ photos: [] }));
      writeFileSync(path.join(r, 'social/queue/due.json'), JSON.stringify({ platform: 'x', campaign: 'c', scheduledAt: '2026-10-01T00:00:00Z', media: [MEDIA] }));
      return r;
    };
    const now = new Date('2026-10-16T00:00:00Z');
    const ok = await guardImageReuse({ root: build(pointerFor(real)), now, fetchImpl: mockFetch(pointerFor(real), real, true).impl, retryDelayMs: 1 });
    expect(ok.problems).toEqual([]);
    const bad = await guardImageReuse({ root: build(pointerFor(real, 'e'.repeat(64))), now, fetchImpl: mockFetch(pointerFor(real, 'e'.repeat(64)), real, true).impl, retryDelayMs: 1 });
    expect(bad.problems).toHaveLength(1);
    expect(bad.problems[0]).toContain('fail closed');
  });
});
