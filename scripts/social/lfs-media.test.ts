// Social photo library lives in Git LFS (docs/decisions.md 2026-10-07): photos
// are fetched from GitHub's LFS media endpoint, never from the deployed site,
// and no workflow may materialise LFS objects in a checkout.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../lib/generated-content.mjs';
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
