import { describe, expect, it } from 'vitest';
import { normalizeTrackVideoTitle, resolvedTrackVideo, trackVideoFor } from './track-video';
import { tracksForEra } from '@swift2/experience';
import './tracks.generated'; // wires setTracksRawProvider so tracksForEra resolves real data
import { allVideoRecordsForEra, videosForEra } from './videos';
import type { VideoNote, VideoNoteKind } from '@swift2/experience';

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
    const shortFilm = video({ title: 'All Too Well: The Short Film', relatedSongs: ['All Too Well (10 Minute Version)'] });
    expect(trackVideoFor('All Too Well (10 Minute Version)', [shortFilm])).toBe(shortFilm);
  });

  // Regression for finding #4 (adversarial review, 2026-08-13): the album
  // track "Karma" must NOT pair with "Karma (feat. Ice Spice)" — the corpus's
  // own summary describes it as the Til Dawn edition remix with a new verse,
  // i.e. a DIFFERENT RECORDING from the album track, exactly like
  // "(Taylor's Version)" is. relatedSongs pointing at the base song name is
  // not enough to bridge a recording qualifier the video's own title carries
  // and relatedSongs drops. No video is correct here — never the wrong one.
  it('a featured-artist/remix video must never pair with the base recording via relatedSongs alone', () => {
    const karmaVideo = video({ title: 'Karma (feat. Ice Spice)', relatedSongs: ['Karma'] });
    expect(trackVideoFor('Karma', [karmaVideo])).toBeNull();
  });

  it('the same featured-artist video DOES pair when relatedSongs echoes its own qualifier', () => {
    const karmaVideo = video({
      title: 'Karma (feat. Ice Spice)',
      relatedSongs: ['Karma (feat. Ice Spice)'],
    });
    expect(trackVideoFor('Karma (feat. Ice Spice)', [karmaVideo])).toBe(karmaVideo);
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
    const fearlessVideos = allVideoRecordsForEra('fearless');
    const evermoreVideos = allVideoRecordsForEra('evermore');
    expect(fearlessVideos.map((v) => v.title)).toContain('The Best Day');
    expect(fearlessVideos.map((v) => v.title)).not.toContain("The Best Day (Taylor's Version)");
    expect(evermoreVideos.map((v) => v.title)).toContain("The Best Day (Taylor's Version)");

    const match = trackVideoFor('The Best Day', [...fearlessVideos, ...evermoreVideos]);
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
        const v = trackVideoFor(t.title, videos, t.youtubeId);
        if (v) paired++;
      }
    }
    // 49 of 244 track-guide songs pair with a real video today (2026-08-13
    // re-review fix — was 48 before the authored-`youtubeId` short-circuit
    // brought Fortnight's legitimate "(feat. Post Malone)" pairing back, and
    // 50 before recording separation was first enforced on the relatedSongs
    // bridge, which correctly dropped Karma's featured-artist video). Not a
    // hard equality on the exact number — the seed grows — but a floor that
    // fails loudly if the matcher regresses to near-zero.
    expect(total).toBeGreaterThan(0);
    expect(paired).toBeGreaterThanOrEqual(40);
  });

  // Issue #771 ("missing youtube embeds on track pages"): TrackDetail resolves
  // `resolvedTrackVideo` against the era's PLAYABLE videos (`videosForEra`,
  // same call TrackDetail makes), never the unfiltered list above — this is
  // the actual coverage a reader hits. Every track carries its own verified
  // audio/lyric `youtubeId` as of 2026-07-20, so this is a floor of 100%, not
  // just "greater than zero": a track resolving to null here is a real
  // regression of #771's fix, not content the seed hasn't caught up on yet.
  it('every track resolves a playable video via resolvedTrackVideo — none regress to no embed', () => {
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
    const unresolved: string[] = [];
    let total = 0;
    for (const eraId of ERAS) {
      const videos = videosForEra(eraId);
      for (const t of tracksForEra(eraId)) {
        total++;
        if (!resolvedTrackVideo(t, videos)) unresolved.push(`${eraId}: ${t.title}`);
      }
    }
    expect(total).toBeGreaterThan(0);
    expect(unresolved).toEqual([]);
  });

  // Re-review finding C (2026-08-13): "Fortnight (feat. Post Malone)" IS the
  // original album recording — the track record names the video's own
  // youtubeId directly — so authored data must win over the title/
  // relatedSongs heuristics that would otherwise reject the qualifier
  // mismatch. Karma must stay unpaired: its own track record has no
  // youtubeId naming the "(feat. Ice Spice)" video, so it falls through to
  // the same heuristics that correctly refuse the bridge.
  it('Fortnight pairs via its authored youtubeId; Karma stays unpaired', () => {
    const ttpdTracks = tracksForEra('ttpd');
    const ttpdVideos = allVideoRecordsForEra('ttpd');
    const fortnight = ttpdTracks.find((t) => t.title === 'Fortnight');
    expect(fortnight?.youtubeId).toBeTruthy();
    const fortnightVideo = trackVideoFor(fortnight!.title, ttpdVideos, fortnight!.youtubeId);
    expect(fortnightVideo?.title).toBe('Fortnight (feat. Post Malone)');

    const midnightsTracks = tracksForEra('midnights');
    const midnightsVideos = allVideoRecordsForEra('midnights');
    const karma = midnightsTracks.find((t) => t.title === 'Karma');
    expect(karma).toBeTruthy();
    const karmaVideo = trackVideoFor(karma!.title, midnightsVideos, karma!.youtubeId);
    expect(karmaVideo).toBeNull();
  });

  it('a track with no video anywhere in its era returns null', () => {
    const videos = allVideoRecordsForEra('1989');
    expect(trackVideoFor('Welcome to New York', videos)).toBeNull();
  });
});
