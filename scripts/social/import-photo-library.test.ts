import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolvePhotoDestPath } from './import-photo-library.mjs';

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
