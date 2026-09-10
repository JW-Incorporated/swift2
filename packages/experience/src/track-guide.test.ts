import { describe, expect, it, beforeEach } from 'vitest';
import {
  adjacentTrackOnAlbum,
  keepExploring,
  nextTrackOnAlbum,
  releasedFactValue,
  resolveConnections,
  songTargetOf,
  tracksForEra,
} from './track-guide';
import { setTracksRawProvider } from './track-catalogue-provider';
import { setContentItemLookup } from './content-item-provider';
import type { ContentItem, EraId, TrackNote } from './types';

// This suite exercises track-guide.ts's pure behaviour against synthetic,
// injected fixtures — no app wiring, no generated data. See
// apps/web/lib/longlive/tracks.test.ts for the suite that runs the real
// generated tracks.generated.ts catalogue.

const track = (over: Partial<TrackNote> = {}): TrackNote => ({
  trackNumber: null,
  title: 'Untitled',
  note: 'a note',
  ...over,
});

describe('track-guide (injected fixtures)', () => {
  beforeEach(() => {
    setTracksRawProvider({
      red: [
        track({ trackNumber: 1, title: 'State of Grace', slug: 'state-of-grace' }),
        track({ trackNumber: 2, title: 'Red', slug: 'red' }),
        track({ trackNumber: null, title: 'Bonus Cut', slug: 'bonus-cut' }),
      ],
    });
    setContentItemLookup((id) => (id === 'real-moment' ? ({ id: 'real-moment' } as ContentItem) : undefined));
  });

  it('tracksForEra returns the wired list, or empty for an unknown era', () => {
    expect(tracksForEra('red' as EraId)).toHaveLength(3);
    expect(tracksForEra('folklore' as EraId)).toEqual([]);
  });

  describe('songTargetOf', () => {
    it('resolves a known slug to its era + track', () => {
      const target = songTargetOf('song:red');
      expect(target?.eraId).toBe('red');
      expect(target?.track.title).toBe('Red');
    });

    it('returns null for other namespaces, unknown slugs, and malformed ids', () => {
      expect(songTargetOf('moment:real-moment')).toBeNull();
      expect(songTargetOf('song:not-a-real-slug')).toBeNull();
      expect(songTargetOf('song:')).toBeNull();
      expect(songTargetOf('red')).toBeNull();
    });
  });

  describe('resolveConnections', () => {
    it('resolves song and moment ids, skipping unknowns and self-links', () => {
      const resolved = resolveConnections(
        [
          { relatedId: 'song:red', label: 'Red', why: 'w' },
          { relatedId: 'moment:real-moment', label: 'A real moment', why: 'w' },
          { relatedId: 'moment:not-a-real-moment', label: 'n', why: 'w' },
          { relatedId: 'song:nope', label: 'n', why: 'w' },
          { relatedId: 'motif:the-snake', label: 'n', why: 'w' },
        ],
        undefined,
      );
      expect(resolved).toHaveLength(2);
      expect(resolved[0]?.kind).toBe('song');
      expect(resolved[1]?.kind).toBe('moment');
      expect(
        resolveConnections([{ relatedId: 'song:red', label: 'self', why: 'w' }], 'red'),
      ).toHaveLength(0);
    });

    it('returns empty for undefined input', () => {
      expect(resolveConnections(undefined)).toEqual([]);
    });
  });

  describe('nextTrackOnAlbum / keepExploring', () => {
    const first = { trackNumber: 1, title: 'State of Grace', note: 'a note', slug: 'state-of-grace' };
    const last = { trackNumber: 2, title: 'Red', note: 'a note', slug: 'red' };

    it('returns the following numbered track, and null on the last one', () => {
      const next = nextTrackOnAlbum('red' as EraId, first);
      expect(next?.slug).toBe('red');
      expect(nextTrackOnAlbum('red' as EraId, last)).toBeNull();
    });

    it('keepExploring puts the next song FIRST, even with no curated connections', () => {
      const out = keepExploring('red' as EraId, first);
      const entry = out[0];
      expect(entry?.kind).toBe('song');
      expect(entry?.kind === 'song' && entry.track.slug).toBe('red');
      expect(entry?.connection.why).toContain('up next on');
    });

    it('falls back to curated connections alone on the album closer', () => {
      const out = keepExploring('red' as EraId, last);
      expect(out.every((c) => !(c.kind === 'song' && c.connection.why.includes('up next on')))).toBe(true);
    });
  });

  describe('adjacentTrackOnAlbum', () => {
    const first = { trackNumber: 1, title: 'State of Grace', note: 'a note', slug: 'state-of-grace' };
    const second = { trackNumber: 2, title: 'Red', note: 'a note', slug: 'red' };

    it('walks forward/backward by album position, and is null at either end (no wrap)', () => {
      expect(adjacentTrackOnAlbum('red' as EraId, first, 'next')).toEqual(second);
      expect(adjacentTrackOnAlbum('red' as EraId, second, 'previous')).toEqual(first);
      expect(adjacentTrackOnAlbum('red' as EraId, first, 'previous')).toBeNull();
    });

    it('returns null for a track key that does not resolve in this era', () => {
      const foreign: TrackNote = { trackNumber: 999, title: 'Not A Real Track', note: 'n' };
      expect(adjacentTrackOnAlbum('red' as EraId, foreign, 'next')).toBeNull();
    });

    it('crosses into unnumbered tracks where nextTrackOnAlbum stops', () => {
      expect(nextTrackOnAlbum('red' as EraId, second)).toBeNull();
      const next = adjacentTrackOnAlbum('red' as EraId, second, 'next');
      expect(next?.trackNumber).toBeNull();
    });
  });
});

describe('releasedFactValue', () => {
  it('shows only the date when a release date exists — never the album name (issue #458 regression)', () => {
    const value = releasedFactValue({
      release: 'The Life of a Showgirl',
      releaseDate: '2025-09-05',
    });
    expect(value).toBe('September 5, 2025');
    expect(value).not.toContain('The Life of a Showgirl');
  });

  it("drops edition-variant release names too when a date exists (the ticket's letter — pinned deliberately)", () => {
    expect(
      releasedFactValue({
        release: "Red (Taylor's Version) — From The Vault",
        releaseDate: '2021-11-12',
      }),
    ).toBe('November 12, 2021');
  });

  it('falls back to the release name only when there is no date', () => {
    expect(releasedFactValue({ release: 'The Life of a Showgirl' })).toBe(
      'The Life of a Showgirl',
    );
  });

  it('formats a date-only fact and returns undefined when neither field is known', () => {
    expect(releasedFactValue({ releaseDate: '2025-09-05' })).toBe('September 5, 2025');
    expect(releasedFactValue({})).toBeUndefined();
    expect(releasedFactValue({ release: '' })).toBeUndefined();
  });
});
