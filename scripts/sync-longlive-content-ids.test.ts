import { describe, expect, it } from 'vitest';
// The generator only writes files when invoked directly; importing it here
// just pulls in its pure functions.
import {
  loadEraIds,
  trackSlugIdsFrom,
  songSlugsFrom,
  theoryIdsFrom,
  videoIdsFrom,
  renderModule,
} from './sync-longlive-content-ids.mjs';
import { buildTrackGuide } from './sync-longlive-tracks.mjs';
import { buildTheoryGuide } from './sync-longlive-theories.mjs';
import { buildVideoGuide } from './sync-longlive-videos.mjs';

describe('loadEraIds', () => {
  it('returns all 12 EraIds in chronological (sort_order) order', async () => {
    const eraIds = await loadEraIds();
    expect(eraIds).toEqual([
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
    ]);
  });

  it('maps seed slugs through SLUG_TO_ERA_ID (tloas/ttpd)', async () => {
    const eraIds = await loadEraIds();
    // eras-data.mjs seeds these under 'the-life-of-a-showgirl' / 'tortured-poets'
    expect(eraIds).toContain('tloas');
    expect(eraIds).toContain('ttpd');
    expect(eraIds).not.toContain('the-life-of-a-showgirl');
    expect(eraIds).not.toContain('tortured-poets');
  });
});

describe('trackSlugIdsFrom', () => {
  it('emits sorted "${eraId}:${slug}" ids, skipping slug-less tracks', () => {
    const byEra = buildTrackGuide([
      { eraSlug: 'red', slug: 'all-too-well', trackTitle: 'All Too Well', trackNumber: 5, note: 'n', sources: [{ url: 'https://x.example', name: 'x' }] },
      { eraSlug: 'red', slug: 'begin-again', trackTitle: 'Begin Again', trackNumber: 16, note: 'n', sources: [{ url: 'https://x.example', name: 'x' }] },
      // No slug — must be dropped from the id list (still a valid TrackNote).
      { eraSlug: 'red', trackTitle: 'State of Grace', trackNumber: 1, note: 'n', sources: [{ url: 'https://x.example', name: 'x' }] },
    ]);
    expect(trackSlugIdsFrom(byEra)).toEqual(['red:all-too-well', 'red:begin-again']);
  });
});

describe('songSlugsFrom', () => {
  it('de-dupes slugs across eras via a Set, sorted', () => {
    const byEra = buildTrackGuide([
      { eraSlug: 'red', slug: 'all-too-well', trackTitle: 'All Too Well (10 Min)', trackNumber: 1, note: 'n', sources: [{ url: 'https://x.example', name: 'x' }] },
      { eraSlug: '1989', slug: 'style', trackTitle: 'Style', trackNumber: 3, note: 'n', sources: [{ url: 'https://x.example', name: 'x' }] },
    ]);
    expect(songSlugsFrom(byEra)).toEqual(['all-too-well', 'style']);
  });
});

describe('theoryIdsFrom', () => {
  it('emits sorted "${eraId}:${slug}" ids for every theory/easter-egg record', () => {
    const byEra = buildTheoryGuide([
      {
        eraSlug: '1989',
        slug: 'no-its-becky',
        kind: 'theory',
        title: 't',
        claim: 'c',
        confidence: 'joke_meme',
        outcome: 'confirmed',
        sources: [{ url: 'https://x.example' }],
      },
    ]);
    expect(theoryIdsFrom(byEra)).toEqual(['1989:no-its-becky']);
  });
});

describe('videoIdsFrom', () => {
  it('emits sorted "${eraId}:${slug}" ids for every video record', () => {
    const byEra = buildVideoGuide([
      {
        eraSlug: '1989',
        slug: 'shake-it-off-mv',
        title: 't',
        sources: [{ url: 'https://x.example' }],
      },
    ]);
    expect(videoIdsFrom(byEra)).toEqual(['1989:shake-it-off-mv']);
  });
});

describe('renderModule', () => {
  it('emits one `as const` array + derived union type per id list', () => {
    const out = renderModule({
      eraIds: ['debut', 'fearless'],
      trackSlugIds: ['debut:tim-mcgraw'],
      songSlugs: ['tim-mcgraw'],
      theoryIds: ['debut:some-egg'],
      videoIds: ['debut:some-video'],
    });
    expect(out).toContain('export const ERA_IDS = [');
    expect(out).toContain('"debut",');
    expect(out).toContain('export type EraId = (typeof ERA_IDS)[number];');
    expect(out).toContain('export const TRACK_SLUG_IDS = [');
    expect(out).toContain('export type TrackSlugId = (typeof TRACK_SLUG_IDS)[number];');
    expect(out).toContain('export const SONG_SLUGS = [');
    expect(out).toContain('export type SongSlug = (typeof SONG_SLUGS)[number];');
    expect(out).toContain('export const THEORY_IDS = [');
    expect(out).toContain('export type TheoryId = (typeof THEORY_IDS)[number];');
    expect(out).toContain('export const VIDEO_IDS = [');
    expect(out).toContain('export type VideoId = (typeof VIDEO_IDS)[number];');
    expect(out.startsWith('// GENERATED FILE')).toBe(true);
  });

  it('is deterministic — same input renders identical output', () => {
    const input = {
      eraIds: ['debut'],
      trackSlugIds: ['debut:tim-mcgraw'],
      songSlugs: ['tim-mcgraw'],
      theoryIds: [],
      videoIds: [],
    };
    expect(renderModule(input)).toBe(renderModule(input));
  });
});
