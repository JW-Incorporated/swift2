import { describe, expect, it } from 'vitest';
import { normalizeTrackVideoTitle, trackVideoFor } from './track-video';
import { tracksForEra } from './tracks';
import { allVideoRecordsForEra } from './videos';
import type { VideoNote, VideoNoteKind } from './types';

function video(overrides: Partial<VideoNote> & { title: string }): VideoNote {
  return {
    slug: overrides.slug ?? overrides.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    kind: overrides.kind ?? ('music_video' as VideoNoteKind),
    title: overrides.title,
    director: overrides.director ?? null,
    releasedOn: overrides.releasedOn ?? null,
    relatedSongs: overrides.relatedSongs ?? [],
    summary: overrides.summary ?? null,
    easterEggs: overrides.easterEggs ?? [],
    symbolism: overrides.symbolism ?? null,
    youtubeId: overrides.youtubeId ?? 'abc123abc12',
    sources: overrides.sources ?? [],
  };
}

describe('normalizeTrackVideoTitle', () => {
  it('lowercases, trims, and strips punctuation', () => {
    expect(normalizeTrackVideoTitle("  Should've Said No  ")).toBe('should ve said no');
    expect(normalizeTrackVideoTitle('...Ready for It?')).toBe('ready for it');
  });

  it('strips pure video-format decorations', () => {
    expect(normalizeTrackVideoTitle('Style (Official Music Video)')).toBe('style');
    expect(normalizeTrackVideoTitle('Style (Official Video)')).toBe('style');
    expect(normalizeTrackVideoTitle('Style (Music Video)')).toBe('style');
    expect(normalizeTrackVideoTitle('willow (Official Lyric Video)')).toBe('willow');
    expect(normalizeTrackVideoTitle('willow (Lyric Video)')).toBe('willow');
  });

  it('does NOT strip an edition/recording qualifier — those change which recording is named', () => {
    expect(normalizeTrackVideoTitle('Fifteen')).not.toBe(normalizeTrackVideoTitle("Fifteen (Taylor's Version)"));
    expect(normalizeTrackVideoTitle('The Best Day')).not.toBe(
      normalizeTrackVideoTitle("The Best Day (Taylor's Version)"),
    );
    expect(normalizeTrackVideoTitle('Bye Bye Baby')).not.toBe(
      normalizeTrackVideoTitle('Bye Bye Baby (From The Vault)'),
    );
  });
});

describe('trackVideoFor — conservative matching', () => {
  it('matches on the curated relatedSongs pointer, not just the video title', () => {
    const karmaVideo = video({ title: 'Karma (feat. Ice Spice)', relatedSongs: ['Karma'] });
    expect(trackVideoFor('Karma', [karmaVideo])).toBe(karmaVideo);
  });

  it('falls back to the video title when relatedSongs is empty', () => {
    const v = video({ title: 'cardigan', relatedSongs: [] });
    expect(trackVideoFor('cardigan', [v])).toBe(v);
  });

  it('is case- and punctuation-insensitive', () => {
    const v = video({ title: "Should've Said No", relatedSongs: [] });
    expect(trackVideoFor("SHOULD'VE SAID NO", [v])).toBe(v);
  });

  it('"Fifteen" must never match "Fifteen (Taylor\'s Version)" — wrong-direction pairing', () => {
    const tv = video({ title: "Fifteen (Taylor's Version)", relatedSongs: ["Fifteen (Taylor's Version)"] });
    expect(trackVideoFor('Fifteen', [tv])).toBeNull();
  });

  it('short titles like "22" must not match anything containing "22" as a substring', () => {
    const decoy = video({ title: '2022 Recap', relatedSongs: ['The 22 Tour Stop'] });
    expect(trackVideoFor('22', [decoy])).toBeNull();
  });

  it('a track with no matching video returns null', () => {
    const unrelated = video({ title: 'Blank Space', relatedSongs: ['Blank Space'] });
    expect(trackVideoFor('A Song That Has No Video Whatsoever', [unrelated])).toBeNull();
  });

  it('an empty or whitespace-only track title returns null even against a real video list', () => {
    const v = video({ title: 'Anti-Hero', relatedSongs: ['Anti-Hero'] });
    expect(trackVideoFor('', [v])).toBeNull();
    expect(trackVideoFor('   ', [v])).toBeNull();
  });

  it('on ambiguous matches, prefers music_video, then lyric_video, then input order', () => {
    const lyric = video({ slug: 'x-lyric', kind: 'lyric_video', title: 'X (Lyric Video)', relatedSongs: ['X'] });
    const music = video({ slug: 'x-music', kind: 'music_video', title: 'X (Official Music Video)', relatedSongs: ['X'] });
    expect(trackVideoFor('X', [lyric, music])).toBe(music);
    expect(trackVideoFor('X', [music, lyric])).toBe(music);
    expect(trackVideoFor('X', [lyric])).toBe(lyric);
  });

  it('no video returns undefined-shaped null, never throws, for an empty video list', () => {
    expect(trackVideoFor('Anything', [])).toBeNull();
  });
});

describe('trackVideoFor — real corpus', () => {
  it('pairs a well-known song to its real official video', () => {
    const videos = allVideoRecordsForEra('1989');
    const v = trackVideoFor('Shake It Off', videos);
    expect(v?.youtubeId).toBe('nfWlot6h_JM');
  });

  it('does not conflate the Fearless "The Best Day" with its Taylor\'s Version re-record video', () => {
    // The fearless era carries BOTH a "The Best Day" video and a
    // "The Best Day (Taylor's Version)" video (same era bucket) — proof this
    // exact wrong-direction pairing is a real, not hypothetical, risk.
    const videos = allVideoRecordsForEra('fearless');
    const titles = videos.map((v) => v.title);
    expect(titles).toContain('The Best Day');
    expect(titles).toContain("The Best Day (Taylor's Version)");

    const match = trackVideoFor('The Best Day', videos);
    expect(match?.title).toBe('The Best Day');
  });

  it('every track guide entry either pairs with a real video or returns null — never throws', () => {
    const ERAS = [
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
    ] as const;
    let paired = 0;
    let total = 0;
    for (const eraId of ERAS) {
      const tracks = tracksForEra(eraId);
      const videos = allVideoRecordsForEra(eraId);
      for (const t of tracks) {
        total++;
        const v = trackVideoFor(t.title, videos);
        if (v) paired++;
      }
    }
    // 50 of 244 track-guide songs pair with a real video today (2026-08-13
    // corpus). Not a hard equality on the exact number — the seed grows — but
    // a floor that fails loudly if the matcher regresses to near-zero.
    expect(total).toBeGreaterThan(0);
    expect(paired).toBeGreaterThanOrEqual(40);
  });

  it('a track with no video anywhere in its era returns null', () => {
    const videos = allVideoRecordsForEra('1989');
    expect(trackVideoFor('Welcome to New York', videos)).toBeNull();
  });
});
