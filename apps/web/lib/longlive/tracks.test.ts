import { describe, expect, it, beforeAll } from 'vitest';
import { TRACKS_RAW } from './tracks.generated';
import {
  adjacentTrackOnAlbum,
  keepExploring,
  nextTrackOnAlbum,
  releasedFactValue,
  resolveConnections,
  songTargetOf,
  tracksForEra,
  setTracksRawProvider,
  setContentItemLookup,
  ERAS,
} from '@swift2/experience';
import { CONTENT, getContentItem } from './content';
import type { EraId, TrackNote } from '@swift2/experience';

// Guards the generated track-guide data against generator drift: everything
// the TrackGuide overlay assumes about tracks.generated.ts is asserted here.
// The track-guide logic itself moved to packages/experience/src/track-guide.ts
// (OS-024); this file wires the real generated catalogue in via the
// providers so the same invariants are exercised against real data.
beforeAll(() => {
  setTracksRawProvider(TRACKS_RAW);
  setContentItemLookup(getContentItem);
});

describe('tracks.generated.ts invariants', () => {
  const eraIds = new Set(ERAS.map((e) => e.id));

  it('only contains known era ids (seed slugs fully mapped)', () => {
    for (const key of Object.keys(TRACKS_RAW)) {
      expect(eraIds, `unknown era id ${key}`).toContain(key);
    }
  });

  it('every track is renderable: non-empty title + note, well-formed sources', () => {
    for (const tracks of Object.values(TRACKS_RAW)) {
      for (const t of tracks) {
        expect(t.title.trim()).not.toBe('');
        expect(t.note.trim()).not.toBe('');
        for (const s of t.sources ?? []) {
          expect(s.name.trim()).not.toBe('');
          expect(s.url).toMatch(/^https?:\/\//);
        }
      }
    }
  });

  it('each era is sorted by track number, unnumbered last', () => {
    for (const [eraId, tracks] of Object.entries(TRACKS_RAW)) {
      const numbers = tracks.map((t) => t.trackNumber);
      const numbered = numbers.filter((n): n is number => n !== null);
      expect(numbered, `era ${eraId} out of order`).toEqual([...numbered].sort((a, b) => a - b));
      const firstNull = numbers.indexOf(null);
      if (firstNull !== -1) {
        expect(numbers.slice(firstNull).every((n) => n === null), `era ${eraId} mixes null into numbered run`).toBe(true);
      }
    }
  });

  it('slugs are globally unique across eras (song:<slug> resolution depends on it)', () => {
    const seen = new Map<string, string>();
    for (const [eraId, tracks] of Object.entries(TRACKS_RAW)) {
      for (const t of tracks) {
        if (!t.slug) continue;
        expect(seen.get(t.slug), `slug ${t.slug} in both ${seen.get(t.slug)} and ${eraId}`).toBeUndefined();
        seen.set(t.slug, eraId);
      }
    }
  });

  it('every dossier connection resolves to real data (no silently-dead links shipped)', () => {
    for (const [eraId, tracks] of Object.entries(TRACKS_RAW)) {
      for (const t of tracks) {
        for (const c of t.dossier?.connections ?? []) {
          const resolves = c.relatedId.startsWith('song:')
            ? songTargetOf(c.relatedId) !== null
            : c.relatedId.startsWith('moment:')
              ? getContentItem(c.relatedId.slice('moment:'.length)) !== undefined
              : false;
          expect(resolves, `${eraId}/${t.title}: unresolvable connection ${c.relatedId}`).toBe(true);
        }
      }
    }
  });

  it('all 12 TLOAS tracks ship a dossier (issue #440 Phase-1 acceptance — a dropped dossier is a regression, not a gap)', () => {
    // The generator silently drops a dossier that loses its sources; this
    // pins the content wave so that failure mode breaks CI instead.
    const tloas = TRACKS_RAW.tloas ?? [];
    expect(tloas.length).toBe(12);
    for (const t of tloas) {
      expect(t.dossier, `${t.title} lost its dossier`).toBeDefined();
    }
  });

  it('every dossier ships with sources (the generator contract, re-asserted on real data)', () => {
    for (const tracks of Object.values(TRACKS_RAW)) {
      for (const t of tracks) {
        if (!t.dossier) continue;
        expect(t.dossier.sources.length).toBeGreaterThan(0);
        for (const s of t.dossier.sources) {
          expect(s.url).toMatch(/^https?:\/\//);
        }
      }
    }
  });
});

describe('songTargetOf', () => {
  it('resolves a known slug to its era + track', () => {
    // 'the-fate-of-ophelia' is stable seeded data (tloas track 1).
    const target = songTargetOf('song:the-fate-of-ophelia');
    expect(target?.eraId).toBe('tloas');
    expect(target?.track.title).toBe('The Fate of Ophelia');
  });

  it('returns null for other namespaces, unknown slugs, and malformed ids', () => {
    expect(songTargetOf('moment:rep-album')).toBeNull();
    expect(songTargetOf('song:not-a-real-slug-xyz')).toBeNull();
    expect(songTargetOf('song:')).toBeNull();
    expect(songTargetOf('the-fate-of-ophelia')).toBeNull();
  });
});

describe('resolveConnections', () => {
  it('resolves song and moment ids, skipping unknowns and self-links', () => {
    // Any real moment id will do — the resolver is what's under test.
    const realMomentId = CONTENT[0].id;
    const resolved = resolveConnections(
      [
        { relatedId: 'song:the-fate-of-ophelia', label: 'The Fate of Ophelia', why: 'w' },
        { relatedId: `moment:${realMomentId}`, label: 'A real moment', why: 'w' },
        { relatedId: 'moment:not-a-real-moment-xyz', label: 'n', why: 'w' },
        { relatedId: 'song:the-fate-of-ophelia', label: 'dupe still resolves', why: 'w' },
        { relatedId: 'song:nope-nope', label: 'n', why: 'w' },
        { relatedId: 'motif:the-snake', label: 'n', why: 'w' },
      ],
      undefined,
    );
    expect(resolved).toHaveLength(3);
    expect(resolved[0].kind).toBe('song');
    expect(resolved[1].kind).toBe('moment');
    expect(resolved[1].kind === 'moment' && resolved[1].item.id).toBe(realMomentId);
    expect(
      resolveConnections(
        [{ relatedId: 'song:the-fate-of-ophelia', label: 'self', why: 'w' }],
        'the-fate-of-ophelia',
      ),
    ).toHaveLength(0);
  });

  it('returns empty for undefined input', () => {
    expect(resolveConnections(undefined)).toEqual([]);
  });
});

describe('nextTrackOnAlbum / keepExploring (Joey 2026-07-15: next song leads the section)', () => {
  // Use a real era with 2+ numbered tracks so the tests survive data churn.
  const entry = (Object.entries(TRACKS_RAW) as [Parameters<typeof tracksForEra>[0], TrackNote[]][])
    .find(([, t]) => t.filter((x) => x.trackNumber != null).length >= 2)!;
  const eraId = entry[0];
  const numbered = entry[1].filter((t) => t.trackNumber != null);
  const first = numbered[0];
  const last = numbered[numbered.length - 1];

  it('returns the following numbered track, and null on the last one', () => {
    const next = nextTrackOnAlbum(eraId, first);
    expect(next).not.toBeNull();
    expect(next!.trackNumber!).toBeGreaterThan(first.trackNumber!);
    expect(nextTrackOnAlbum(eraId, last)).toBeNull();
  });

  it('keepExploring puts the next song FIRST, even with no curated connections', () => {
    const out = keepExploring(eraId, first);
    expect(out.length).toBeGreaterThan(0);
    expect(out[0].kind).toBe('song');
    expect(out[0].kind === 'song' && out[0].track.slug).toBe(nextTrackOnAlbum(eraId, first)!.slug);
    expect(out[0].connection.why).toContain('up next on');
  });

  it('de-dupes a curated connection that already points at the next song', () => {
    const next = nextTrackOnAlbum(eraId, first)!;
    const withDupe = {
      ...first,
      dossier: {
        ...(first.dossier ?? { sources: [] }),
        connections: [{ relatedId: `song:${next.slug}` as const, label: next.title, why: 'curated dupe' }],
      },
    };
    const out = keepExploring(eraId, withDupe);
    const hits = out.filter((c) => c.kind === 'song' && c.track.slug === next.slug);
    expect(hits).toHaveLength(1);
    expect(hits[0].connection.why).toContain('up next on');
  });

  it('falls back to curated connections alone on the album closer', () => {
    const out = keepExploring(eraId, last);
    expect(out.every((c) => !(c.kind === 'song' && c.connection.why.includes('up next on')))).toBe(true);
  });
});

describe('adjacentTrackOnAlbum (#774: Previous/Next traverses every sourced track in album order)', () => {
  const entry = (Object.entries(TRACKS_RAW) as [Parameters<typeof tracksForEra>[0], TrackNote[]][])
    .find(([, t]) => t.length >= 2)!;
  const [eraId, tracks] = entry;
  const first = tracks[0];
  const second = tracks[1];
  const last = tracks[tracks.length - 1];

  it('walks forward/backward by album position, and is null at either end (no wrap)', () => {
    expect(adjacentTrackOnAlbum(eraId, first, 'next')).toEqual(second);
    expect(adjacentTrackOnAlbum(eraId, second, 'previous')).toEqual(first);
    expect(adjacentTrackOnAlbum(eraId, first, 'previous')).toBeNull();
    expect(adjacentTrackOnAlbum(eraId, last, 'next')).toBeNull();
  });

  it('returns null for a track key that does not resolve in this era', () => {
    const foreign: TrackNote = { trackNumber: 999, title: 'Not A Real Track', note: 'n' };
    expect(adjacentTrackOnAlbum(eraId, foreign, 'next')).toBeNull();
  });

  // #774 explicit scope decision: unlike nextTrackOnAlbum (numbered tracks
  // only, used by "Keep exploring"), Previous/Next must not skip a sourced
  // note just because it has no track number — so the last numbered track
  // should still step forward onto the first unnumbered one, where
  // nextTrackOnAlbum stops dead.
  const unnumberedEntry = Object.entries(TRACKS_RAW).find(([, t]) => {
    const numbered = t.filter((x) => x.trackNumber != null);
    return numbered.length > 0 && numbered.length < t.length;
  });

  it.runIf(unnumberedEntry)(
    'crosses into unnumbered tracks where nextTrackOnAlbum stops (era with mixed numbering)',
    () => {
      const [mixedEraId, mixedTracks] = unnumberedEntry!;
      const numbered = mixedTracks.filter((t) => t.trackNumber != null);
      const lastNumbered = numbered[numbered.length - 1];
      expect(nextTrackOnAlbum(mixedEraId as EraId, lastNumbered)).toBeNull();
      const next = adjacentTrackOnAlbum(mixedEraId as EraId, lastNumbered, 'next');
      expect(next).not.toBeNull();
      expect(next!.trackNumber).toBeNull();
    },
  );
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
    // ~57 tracks have a release that is NOT the album being viewed (vault,
    // deluxe/3am editions, charity single, soundtrack). Per #458's explicit
    // instruction the date still wins; whether those should instead keep
    // their name (e.g. shown only when release ≠ the era's album) is flagged
    // on the PR as an open product call for Joey. If he opts to keep them,
    // this is the assertion to flip.
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

describe('tracksForEra', () => {
  it('returns the era track list, or empty (never undefined) when an era has none', () => {
    // The seeded catalog covers all 12 eras today, but the accessor must not
    // assume that — it backs a conditional entry point in the era hero.
    for (const era of ERAS) {
      expect(Array.isArray(tracksForEra(era.id))).toBe(true);
    }
  });
});
