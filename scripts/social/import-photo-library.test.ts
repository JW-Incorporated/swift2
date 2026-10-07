import { mkdtemp, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertNotAllFailed, fetchCandidates, resolvePhotoDestPath } from './import-photo-library.mjs';

const PHOTOS_DIR = '/repo/apps/web/public/social/library/photos';

describe('resolvePhotoDestPath', () => {
  it('resolves a normal mediaPath under the photos directory', () => {
    const result = resolvePhotoDestPath('/social/library/photos/taylor-lover-2023.jpg', PHOTOS_DIR);
    expect(result).toBe(path.join(PHOTOS_DIR, 'taylor-lover-2023.jpg'));
  });

  // Fresh-context review finding, kanban t_e1d26de7 PR #4522: validatePhotoEntry
  // only checks that mediaPath STARTS WITH /social/library/photos/, so a
  // crafted path with ".." segments would otherwise escape the intended
  // write directory entirely.
  it('rejects a mediaPath that escapes the photos directory via ..', () => {
    expect(() => resolvePhotoDestPath('/social/library/photos/../../../../etc/evil.jpg', PHOTOS_DIR)).toThrow(
      /resolves outside the photos directory/,
    );
  });

  it('rejects a mediaPath that escapes via a single leading ..', () => {
    expect(() => resolvePhotoDestPath('/social/library/photos/../sibling.jpg', PHOTOS_DIR)).toThrow(
      /resolves outside the photos directory/,
    );
  });

  it('allows a nested subdirectory that stays within the photos directory', () => {
    const result = resolvePhotoDestPath('/social/library/photos/2026/taylor-red-2026.jpg', PHOTOS_DIR);
    expect(result).toBe(path.join(PHOTOS_DIR, '2026', 'taylor-red-2026.jpg'));
  });
});

describe('fetchCandidates', () => {
  const cand = (n: number) => ({
    id: `wikimedia-${n}`,
    mediaPath: `/social/library/photos/wikimedia-${n}.jpg`,
    sourceUrl: `https://upload.wikimedia.org/${n}.jpg`,
  });
  const ok = (n: number) => ({ ok: true, arrayBuffer: async () => new TextEncoder().encode(`bytes-${n}`).buffer });
  const run = async (candidates: ReturnType<typeof cand>[], fetchImpl: (url: string) => Promise<unknown>) => {
    const photosDir = await mkdtemp(path.join(os.tmpdir(), 'photos-'));
    const result = await fetchCandidates(candidates, {
      write: true,
      photosDir,
      seenHashes: new Map(),
      fetchImpl: fetchImpl as never,
      sleepImpl: async () => {},
    });
    return { result, files: await readdir(photosDir) };
  };

  it('skips a failing candidate and still imports the others', async () => {
    const { result, files } = await run([cand(1), cand(2), cand(3)], async (url) =>
      url.includes('/2.') ? { ok: false, status: 404, statusText: 'Not Found' } : ok(Number(url.slice(-5, -4))),
    );
    expect(result.failed.map((f) => f.id)).toEqual(['wikimedia-2']);
    expect(result.failed[0].reason).toContain('404');
    expect(files.sort()).toEqual(['wikimedia-1.jpg', 'wikimedia-3.jpg']);
  });

  it('records every candidate as failed when all fail', async () => {
    const { result } = await run([cand(1), cand(2)], async () => ({ ok: false, status: 500, statusText: 'x' }));
    expect(result.failed).toHaveLength(2);
  });

  it('records a thrown network error and a missing sourceUrl as failures, not crashes', async () => {
    const { result } = await run([cand(1), { ...cand(2), sourceUrl: undefined as never }], async () => {
      throw new Error('socket hang up');
    });
    expect(result.failed.map((f) => f.reason)).toEqual(['socket hang up', expect.stringContaining('sourceUrl')]);
  });
});

describe('assertNotAllFailed', () => {
  it('throws only when every candidate failed (and there was at least one)', () => {
    expect(() => assertNotAllFailed(3, 3)).toThrow(/all 3 candidate/);
    expect(() => assertNotAllFailed(3, 2)).not.toThrow();
    expect(() => assertNotAllFailed(0, 0)).not.toThrow();
  });
});
