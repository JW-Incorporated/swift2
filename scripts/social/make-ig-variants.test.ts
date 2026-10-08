import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeIgVariants } from './make-ig-variants.mjs';

let root: string;
const photosDir = () => path.join(root, 'apps', 'web', 'public', 'social', 'library', 'photos');
const inventoryPath = () => path.join(root, 'social', 'photo-library.json');
const entry = (id: string) => ({ id, mediaPath: `/social/library/photos/${id}.jpg`, credit: 'Someone (CC BY 2.0), via Wikimedia Commons', source: 'https://commons.wikimedia.org/wiki/File:X.jpg', alt: `Alt for ${id}.`, tags: ['red'] });
const jpeg = (width: number, height: number) => sharp({ create: { width, height, channels: 3, background: '#357' } }).jpeg().toBuffer();

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'ig-variants-'));
  await mkdir(photosDir(), { recursive: true });
  await mkdir(path.join(root, 'social'), { recursive: true });
  await writeFile(path.join(photosDir(), 'tall.jpg'), await jpeg(500, 1400));
  await writeFile(path.join(photosDir(), 'wide.jpg'), await jpeg(2400, 800));
  await writeFile(path.join(photosDir(), 'fine.jpg'), await jpeg(1000, 1000));
  const photos = [entry('tall'), entry('wide'), entry('fine'), entry('absent')];
  await writeFile(inventoryPath(), `${JSON.stringify({ version: 1, policy: 'p', photos }, null, 2)}\n`);
});
afterEach(() => rm(root, { recursive: true, force: true }));

describe('make-ig-variants', () => {
  it('dry run reports what it would do and writes nothing', async () => {
    const before = await readFile(inventoryPath(), 'utf8');
    const { made, skipped } = await makeIgVariants({ root });
    expect(made.map((m) => m.id).sort()).toEqual(['tall-ig45', 'wide-ig191']);
    expect(skipped).toEqual([{ id: 'absent', reason: 'source file not found locally' }]);
    expect(await readFile(inventoryPath(), 'utf8')).toBe(before);
    await expect(stat(path.join(photosDir(), 'tall-ig45.jpg'))).rejects.toThrow();
  });

  it('--write produces correctly sized files and library entries, leaving in-window photos alone', async () => {
    await makeIgVariants({ root, write: true });
    const dims = async (name: string) => {
      const m = await sharp(path.join(photosDir(), name)).metadata();
      return [m.width, m.height];
    };
    expect(await dims('tall-ig45.jpg')).toEqual([1080, 1350]);
    expect(await dims('wide-ig191.jpg')).toEqual([1080, 566]);
    await expect(stat(path.join(photosDir(), 'fine-ig45.jpg'))).rejects.toThrow();
    const { photos } = JSON.parse(await readFile(inventoryPath(), 'utf8'));
    expect(photos.map((p: { id: string }) => p.id)).toEqual(['tall', 'tall-ig45', 'wide', 'wide-ig191', 'fine', 'absent']);
    expect(photos[1]).toMatchObject({ credit: photos[0].credit, source: photos[0].source, alt: photos[0].alt, tags: ['red'], variantOf: 'tall', mediaPath: '/social/library/photos/tall-ig45.jpg' });
  });

  it('is idempotent: a second --write changes no file and no library byte', async () => {
    await makeIgVariants({ root, write: true });
    const lib = await readFile(inventoryPath(), 'utf8');
    const img = await readFile(path.join(photosDir(), 'tall-ig45.jpg'));
    const again = await makeIgVariants({ root, write: true });
    expect(again.made).toEqual([]);
    expect(await readFile(inventoryPath(), 'utf8')).toBe(lib);
    expect((await readFile(path.join(photosDir(), 'tall-ig45.jpg'))).equals(img)).toBe(true);
  });

  it('never makes a variant of a variant, and repairs a missing entry without re-rendering the file', async () => {
    await makeIgVariants({ root, write: true });
    const lib = JSON.parse(await readFile(inventoryPath(), 'utf8'));
    lib.photos = lib.photos.filter((p: { id: string }) => p.id !== 'tall-ig45');
    await writeFile(inventoryPath(), `${JSON.stringify(lib, null, 2)}\n`);
    const { made } = await makeIgVariants({ root, write: true });
    expect(made).toMatchObject([{ id: 'tall-ig45', wroteFile: false, addedEntry: true }]);
    const ids = JSON.parse(await readFile(inventoryPath(), 'utf8')).photos.map((p: { id: string }) => p.id);
    expect(ids.filter((id: string) => id.startsWith('tall'))).toEqual(['tall', 'tall-ig45']);
  });
});

describe('make-ig-variants — recorded file facts (LFS-safe)', () => {
  it('records width/height/bytes/sha256 for the variant, never the original\'s', async () => {
    const lib = JSON.parse(await readFile(inventoryPath(), 'utf8'));
    lib.photos[0] = { ...lib.photos[0], width: 500, height: 1400, bytes: 1, sha256: 'a'.repeat(64) };
    await writeFile(inventoryPath(), `${JSON.stringify(lib, null, 2)}\n`);
    await makeIgVariants({ root, write: true });
    const { photos } = JSON.parse(await readFile(inventoryPath(), 'utf8'));
    const variant = photos.find((p: { id: string }) => p.id === 'tall-ig45');
    const file = await readFile(path.join(photosDir(), 'tall-ig45.jpg'));
    expect(variant).toMatchObject({ width: 1080, height: 1350, bytes: file.byteLength, sha256: createHash('sha256').update(file).digest('hex') });
  });

  it('skips a Git LFS pointer source instead of treating it as an image', async () => {
    await writeFile(path.join(photosDir(), 'tall.jpg'), 'version https://git-lfs.github.com/spec/v1\noid sha256:' + 'b'.repeat(64) + '\nsize 9\n');
    const { made, skipped } = await makeIgVariants({ root });
    expect(made.map((m) => m.id)).toEqual(['wide-ig191']);
    expect(skipped).toContainEqual({ id: 'tall', reason: 'Git LFS pointer, not an image' });
  });
});
