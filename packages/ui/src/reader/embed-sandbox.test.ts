import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(__dirname, '..', '..', '..', '..');
const FILES = [
  'packages/ui/src/reader/moment/MomentSocialPost.tsx',
  'packages/ui/src/reader/threads/taylors-version/SpotifyCompare.tsx',
  'packages/ui/src/reader/clown/MoodSongCard.tsx',
  'packages/ui/src/reader/era/MomentVideo.tsx',
  'apps/web/app/embed/youtube/[id]/route.ts',
  'apps/web/app/embed/spotify/[type]/[id]/route.ts',
];
const REQUIRED = ['allow-scripts', 'allow-same-origin', 'allow-popups', 'allow-popups-to-escape-sandbox'];

describe('third-party embed iframes are sandboxed', () => {
  for (const file of FILES) {
    it(`${file} sets sandbox without top navigation`, () => {
      const src = readFileSync(join(root, file), 'utf8');
      const tokens = /sandbox="([^"]*)"/.exec(src)?.[1]?.split(' ') ?? [];
      for (const t of REQUIRED) expect(tokens).toContain(t);
      expect(tokens).not.toContain('allow-presentation');
      expect(src).not.toContain('allow-top-navigation');
    });
  }
});
