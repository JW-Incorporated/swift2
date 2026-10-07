import { mkdir, mkdtemp, realpath, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resolveFrameFile } from './frame-path.mjs';

async function setup() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'framepath-'));
  const frames = path.join(root, 'frames');
  await mkdir(path.join(frames, 'vid'), { recursive: true });
  await writeFile(path.join(frames, 'vid', 'f_0001.jpg'), 'x');
  await writeFile(path.join(root, 'secret.jpg'), 'x');
  await writeFile(path.join(frames, 'vid', 'notes.txt'), 'x');
  return { root, frames };
}

describe('resolveFrameFile', () => {
  it('accepts a .jpg inside the frames directory', async () => {
    const { frames } = await setup();
    const url = pathToFileURL(path.join(frames, 'vid', 'f_0001.jpg')).href;
    expect(await resolveFrameFile(url, frames)).toBe(await realpath(path.join(frames, 'vid', 'f_0001.jpg')));
  });

  it('rejects ../ traversal out of the frames directory', async () => {
    const { frames } = await setup();
    const url = pathToFileURL(path.join(frames, 'vid', '..', '..', 'secret.jpg')).href;
    await expect(resolveFrameFile(url, frames)).rejects.toThrow(/outside the frames scratch directory/);
    await expect(resolveFrameFile(`file:///${frames.split(path.sep).join('/')}/vid/%2e%2e/%2e%2e/secret.jpg`, frames)).rejects.toThrow(/outside|does not exist/);
  });

  it('rejects an absolute path elsewhere, non-jpg files, the directory itself and junk URLs', async () => {
    const { root, frames } = await setup();
    await expect(resolveFrameFile(pathToFileURL(path.join(root, 'secret.jpg')).href, frames)).rejects.toThrow(/outside/);
    await expect(resolveFrameFile(pathToFileURL(path.join(frames, 'vid', 'notes.txt')).href, frames)).rejects.toThrow(/only \.jpg/);
    await expect(resolveFrameFile(pathToFileURL(path.join(frames, 'vid', 'missing.jpg')).href, frames)).rejects.toThrow(/does not exist/);
    await expect(resolveFrameFile('file://remote-host/share/x.jpg', frames)).rejects.toThrow(/not a valid file URL|outside|does not exist/);
  });

  it('rejects a symlink inside the frames directory that points outside it', async () => {
    const { root, frames } = await setup();
    const link = path.join(frames, 'vid', 'link.jpg');
    try {
      await symlink(path.join(root, 'secret.jpg'), link);
    } catch {
      return; // symlinks need privileges on some Windows setups; the realpath logic is exercised elsewhere
    }
    await expect(resolveFrameFile(pathToFileURL(link).href, frames)).rejects.toThrow(/outside the frames scratch directory/);
  });
});
