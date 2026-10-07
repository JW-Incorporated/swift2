// Social photo library lives in Git LFS (docs/decisions.md 2026-10-07): photos
// are fetched from GitHub's LFS media endpoint, never from the deployed site,
// and no workflow may materialise LFS objects in a checkout.

import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../lib/generated-content.mjs';
import { isLfsPointer, isLfsPointerBuffer } from './lib/lfs-pointer.mjs';
import { validatePhotoLibrary } from './validate-queue.mjs';
import { MEDIA_BASE_URL, PHOTO_MEDIA_BASE_URL, mediaUrlFor, mediaUrlsFor } from './lib/queue.mjs';

describe('mediaUrlFor', () => {
  it('serves library photos from the LFS media URL', () => {
    expect(mediaUrlFor('/social/library/photos/a.jpg')).toBe(`${PHOTO_MEDIA_BASE_URL}/social/library/photos/a.jpg`);
    expect(mediaUrlFor('/social/library/photos/a.jpg', 'https://example.test')).toBe(`${PHOTO_MEDIA_BASE_URL}/social/library/photos/a.jpg`);
  });

  it('serves everything else from the site host', () => {
    expect(mediaUrlFor('/social/tree-avatar.png')).toBe(`${MEDIA_BASE_URL}/social/tree-avatar.png`);
    expect(mediaUrlFor('/social/x.png', 'https://example.test')).toBe('https://example.test/social/x.png');
  });

  it('mediaUrlsFor maps each path through it', () => {
    expect(mediaUrlsFor({ media: ['/social/library/photos/a.jpg', '/social/x.png'] }, 'https://example.test')).toEqual([
      `${PHOTO_MEDIA_BASE_URL}/social/library/photos/a.jpg`,
      'https://example.test/social/x.png',
    ]);
  });
});

describe('Git LFS workflow guard', () => {
  it('no workflow checks out with `lfs: true` (the photo library would be downloaded on ~92 workflows)', () => {
    const dir = join(ROOT, '.github', 'workflows');
    const offenders = readdirSync(dir)
      .filter((f) => /\.ya?ml$/.test(f))
      .filter((f) => /^\s*lfs:\s*true\b/m.test(readFileSync(join(dir, f), 'utf8')));
    expect(offenders).toEqual([]);
  });
});

describe('isLfsPointer', () => {
  it('detects pointer files and ignores real images and missing files', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'lfs-pointer-'));
    try {
      const pointer = join(dir, 'p.jpg');
      const real = join(dir, 'r.jpg');
      writeFileSync(pointer, 'version https://git-lfs.github.com/spec/v1\noid sha256:' + 'a'.repeat(64) + '\nsize 3\n');
      writeFileSync(real, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]));
      expect(await isLfsPointer(pointer)).toBe(true);
      expect(await isLfsPointer(real)).toBe(false);
      expect(await isLfsPointer(join(dir, 'missing.jpg'))).toBe(false);
      expect(isLfsPointerBuffer(readFileSync(pointer))).toBe(true);
      expect(isLfsPointerBuffer(readFileSync(real))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('validatePhotoLibrary file facts', () => {
  const entry = { id: 'a', mediaPath: '/social/library/photos/a.jpg', source: 'https://example.test/a', alt: 'x', width: 10, height: 10, bytes: 5, sha256: 'a'.repeat(64) };
  it('accepts an entry with sha256/width/height/bytes and flags each missing one', () => {
    expect(validatePhotoLibrary([entry])).toEqual([]);
    for (const key of ['sha256', 'width', 'height', 'bytes']) {
      const rest: Record<string, unknown> = { ...entry };
      delete rest[key];
      expect(validatePhotoLibrary([rest]).join(' ')).toContain(`a: ${key} is required`);
    }
  });
});
