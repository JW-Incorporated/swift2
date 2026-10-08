import { describe, expect, it, afterAll } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadImageAsDataUri } from './image-source.mjs';

describe('loadImageAsDataUri', () => {
  let dir: string;

  afterAll(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it('reads a local PNG file into a data: URI with the right mime type', async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'social-image-'));
    const file = path.join(dir, 'pixel.png');
    // 1x1 transparent PNG.
    const onePxPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );
    await writeFile(file, onePxPng);
    const uri = await loadImageAsDataUri(file);
    expect(uri.startsWith('data:image/png;base64,')).toBe(true);
    expect(Buffer.from(uri.split(',')[1], 'base64').equals(onePxPng)).toBe(true);
  });

  it('defaults unknown extensions to image/jpeg', async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'social-image-'));
    const file = path.join(dir, 'photo.jfif');
    await writeFile(file, Buffer.from([0xff, 0xd8, 0xff]));
    const uri = await loadImageAsDataUri(file);
    expect(uri.startsWith('data:image/jpeg;base64,')).toBe(true);
  });
});
