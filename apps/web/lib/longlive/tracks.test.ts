import { describe, expect, it } from 'vitest';
import { TRACKS_RAW } from './tracks.generated';
import { resolveConnections, songTargetOf, tracksForEra } from './tracks';
import { getContentItem } from './content';
import { ERAS } from './eras';

// Guards the generated track-guide data against generator drift: everything
// the TrackGuide overlay assumes about tracks.generated.ts is asserted here.
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
    const resolved = resolveConnections(
      [
        { relatedId: 'song:the-fate-of-ophelia', label: 'The Fate of Ophelia', why: 'w' },
        { relatedId: 'song:the-fate-of-ophelia', label: 'self', why: 'w' },
        { relatedId: 'song:nope-nope', label: 'n', why: 'w' },
        { relatedId: 'motif:the-snake', label: 'n', why: 'w' },
      ],
      undefined,
    );
    expect(resolved).toHaveLength(2);
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

describe('tracksForEra', () => {
  it('returns the era track list, or empty (never undefined) when an era has none', () => {
    // The seeded catalog covers all 12 eras today, but the accessor must not
    // assume that — it backs a conditional entry point in the era hero.
    for (const era of ERAS) {
      expect(Array.isArray(tracksForEra(era.id))).toBe(true);
    }
  });
});
