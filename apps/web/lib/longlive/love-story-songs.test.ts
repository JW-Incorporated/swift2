import { describe, expect, it } from 'vitest';
import { RELATIONSHIPS, SINGLE_PERIODS, songTargetOf } from '@swift2/experience';
import './tracks'; // wires setTracksRawProvider so songTargetOf resolves real data

// Split out of packages/experience/src/love-story.test.ts in OS-023: this
// test cross-references the real track-guide data (OS-024 moved
// `songTargetOf` itself into packages/experience/src/track-guide.ts, but the
// GENERATED per-era track map it reads is still app-layer, so this test
// stays in apps/web to wire the real data in and can't live inside the
// headless package without giving it a forbidden dependency on apps/web).
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
