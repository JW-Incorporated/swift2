import { describe, expect, it } from 'vitest';
import { videosForEra, musicVideosForEra, videoForTrack } from './videos';
import type { EraId } from './types';

const ALL_ERA_IDS: EraId[] = [
  'debut',
  'fearless',
  'speak-now',
  'red',
  '1989',
  'reputation',
  'lover',
  'folklore',
  'evermore',
  'midnights',
  'ttpd',
  'tloas',
];

describe('videoForTrack', () => {
  it('matches a song to its official video by title within the era', () => {
    const v = videoForTrack('1989', 'Shake It Off');
    expect(v?.youtubeId).toBe('nfWlot6h_JM');
  });

  it('normalizes parenthetical suffixes when matching', () => {
    // A track titled with a "(Taylor's Version)" suffix still finds the video.
    const v = videoForTrack('1989', "Shake It Off (Taylor's Version)");
    expect(v?.youtubeId).toBe('nfWlot6h_JM');
  });

  it('returns undefined for a song with no matching video', () => {
    expect(videoForTrack('1989', 'A Song That Has No Video Whatsoever')).toBeUndefined();
  });

  it('only ever returns entries that carry a youtubeId', () => {
    for (const eraId of ALL_ERA_IDS) {
      for (const v of videosForEra(eraId)) {
        const match = videoForTrack(eraId, v.title);
        if (match) expect(match.youtubeId).toBeTruthy();
      }
    }
  });
});

describe('musicVideosForEra', () => {
  it('only ever returns music_video-kind entries with a real release date', () => {
    for (const eraId of ALL_ERA_IDS) {
      for (const v of musicVideosForEra(eraId)) {
        expect(v.kind).toBe('music_video');
        expect(v.releasedOn).not.toBeNull();
      }
    }
  });

  it('is a subset of videosForEra for every era', () => {
    for (const eraId of ALL_ERA_IDS) {
      const all = new Set(videosForEra(eraId).map((v) => v.slug));
      for (const v of musicVideosForEra(eraId)) {
        expect(all.has(v.slug)).toBe(true);
      }
    }
  });

  it('excludes a music video with no known release date (tloas: the-fate-of-ophelia-mv)', () => {
    const slugs = musicVideosForEra('tloas').map((v) => v.slug);
    expect(slugs).not.toContain('the-fate-of-ophelia-mv');
  });

  it('excludes a non-music_video work even when it has a release date (tloas: the release-party film)', () => {
    const slugs = musicVideosForEra('tloas').map((v) => v.slug);
    expect(slugs).not.toContain('the-official-release-party-of-a-showgirl');
  });

  it('includes a dated music video (1989: shake-it-off-mv)', () => {
    const slugs = musicVideosForEra('1989').map((v) => v.slug);
    expect(slugs).toContain('shake-it-off-mv');
  });
});
