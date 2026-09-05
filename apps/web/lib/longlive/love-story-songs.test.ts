import { describe, expect, it } from 'vitest';
import { RELATIONSHIPS, SINGLE_PERIODS } from '@swift2/experience';
import { songTargetOf } from './tracks';

// Split out of packages/experience/src/love-story.test.ts in OS-023: this
// test cross-references the real track-guide data (`tracks.ts`'s
// `songTargetOf`), which is still app-layer/OS-013-OS-014 scope, so it can't
// live inside the headless package without giving it a forbidden dependency
// on apps/web.
describe('relationship song links', () => {
  const songs = [...RELATIONSHIPS, ...SINGLE_PERIODS].flatMap((entry) => entry.songs ?? []);

  it('resolves every authored song id to a real track-guide entry', () => {
    for (const song of songs) {
      if (!song.relatedId) continue;
      expect(songTargetOf(song.relatedId), `${song.title} (${song.relatedId})`).not.toBeNull();
    }
  });

  it('leaves only songs absent from the track guide non-interactive', () => {
    expect(songs.filter((song) => !song.relatedId).map((song) => song.title)).toEqual([
      'This Is What You Came For',
    ]);
  });
});
