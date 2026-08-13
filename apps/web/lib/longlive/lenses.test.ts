import { describe, expect, it } from 'vitest';
import { ERAS } from './eras';
import {
  CROSSING_THREADS,
  EGG_NODES,
  MOTIF_BY_ID,
  RELATIONSHIPS,
  RUNWAY_LOOKS,
  THREADS,
  getThread,
  motifOf,
  threadHeroCredit,
  threadHeroTiles,
  threadPoints,
  threadsInEra,
} from './lenses';

describe('threadPoints("love-story")', () => {
  it('emits a point for every era a relationship spans, not just the first', () => {
    const points = threadPoints('love-story');
    for (const rel of RELATIONSHIPS) {
      for (const eraId of rel.eraIds) {
        expect(
          points.some((p) => p.label === rel.name && p.eraId === eraId),
          `expected a love-story point for "${rel.name}" in era "${eraId}"`,
        ).toBe(true);
      }
    }
  });
});

describe('threadsInEra', () => {
  it('offers Fashion for every era, including the current one', () => {
    for (const era of ERAS) {
      const threads = threadsInEra(era.id).map((t) => t.id);
      expect(threads, `Fashion missing from era "${era.id}"`).toContain('fashion');
    }
  });

  it('only returns threads registered in CROSSING_THREADS', () => {
    for (const era of ERAS) {
      for (const t of threadsInEra(era.id)) {
        expect(CROSSING_THREADS).toContain(t.id);
      }
    }
  });
});

describe('RUNWAY_LOOKS', () => {
  it('covers every era', () => {
    const covered = new Set(RUNWAY_LOOKS.map((l) => l.eraId));
    for (const era of ERAS) {
      expect(covered.has(era.id), `no runway look for era "${era.id}"`).toBe(true);
    }
  });

  it('has 2-3 real, credited photos per era (30 total) — no placeholders', () => {
    const total = RUNWAY_LOOKS.reduce((n, look) => n + look.images.length, 0);
    expect(total, 'total photo count across all eras').toBe(30);

    for (const look of RUNWAY_LOOKS) {
      expect(
        look.images.length,
        `"${look.id}" should have 2-3 photos, has ${look.images.length}`,
      ).toBeGreaterThanOrEqual(2);
      expect(look.images.length).toBeLessThanOrEqual(3);

      for (const img of look.images) {
        expect(img.url, `"${look.id}" image url`).toMatch(/^https?:\/\//);
        expect(img.url, `"${look.id}" image url must not be a local placeholder`).not.toMatch(/^\/(placeholder|eras)\//);
        expect(img.credit, `"${look.id}" image missing a credit`).toBeTruthy();
        expect(img.caption, `"${look.id}" image missing a caption`).toBeTruthy();
        expect(img.kind, `"${look.id}" image kind`).toBe('primary');
      }
    }
  });
});

// DoD item 2 (Joey, 2026-08-13): the two relationship threads were twins —
// same hero art, both blurbs bracelet-led. These lock in that they can never
// silently become twins again.
describe('thread card art', () => {
  it('gives every thread its own hero art', () => {
    const heroes = THREADS.map((t) => (threadHeroTiles(t.id).length > 0 ? `grid:${t.id}` : t.hero));
    expect(new Set(heroes).size, `duplicate hero art across threads: ${heroes.join(', ')}`).toBe(
      THREADS.length,
    );
  });

  it('opens End Game and Blank Spaces on different words', () => {
    const endGame = getThread('the-proposal');
    const blankSpaces = getThread('love-story');
    expect(endGame.kicker).not.toBe(blankSpaces.kicker);
    // The twins bug was both blurbs leading with the friendship bracelet.
    expect(blankSpaces.what.toLowerCase()).not.toContain('bracelet');
    // Item 2's acceptance criterion: Blank Spaces must say plainly that it is
    // about the past relationships.
    expect(blankSpaces.what.toLowerCase()).toContain('past relationships');
  });

  it('leads End Game with the rehosted, credited Travis photo', () => {
    const meta = getThread('the-proposal');
    expect(meta.hero).toBe('/threads/end-game-travis-kelce.jpg');
    expect(meta.heroAlt, 'a photo carrying meaning needs real alt text').toBeTruthy();
    expect(threadHeroCredit('the-proposal')).toContain('Adam Schultz');
  });
});

describe('threadHeroTiles("love-story")', () => {
  const tiles = threadHeroTiles('love-story');

  it('is the wall of past partners — every ended relationship that has a portrait', () => {
    const expected = RELATIONSHIPS.filter((r) => r.end !== null && r.image);
    expect(tiles.map((t) => t.id)).toEqual(expected.map((r) => r.id));
    expect(tiles.length, 'the grid needs enough faces to read as a list, not a couple').toBeGreaterThanOrEqual(4);
  });

  it('excludes the ongoing relationship — that one is End Game’s card', () => {
    const ongoing = RELATIONSHIPS.filter((r) => r.end === null).map((r) => r.name);
    expect(ongoing.length).toBeGreaterThan(0);
    for (const name of ongoing) {
      expect(tiles.map((t) => t.name)).not.toContain(name);
    }
  });

  it('carries a credit and alt for every tile — attribution is a licence condition', () => {
    for (const tile of tiles) {
      expect(tile.url, `${tile.name} url`).toMatch(/^https:\/\//);
      expect(tile.credit, `${tile.name} is missing a credit`).toBeTruthy();
      expect(tile.alt, `${tile.name} is missing alt text`).toBeTruthy();
    }
  });

  it('renders every tile credit in the one visible credit line', () => {
    const credit = threadHeroCredit('love-story') ?? '';
    for (const tile of tiles) {
      expect(credit, `${tile.name} is not attributed on the thread`).toContain(tile.credit);
      expect(credit).toContain(tile.name);
    }
  });

  it('is empty for threads with no grid hero, so they fall back to their photo', () => {
    for (const thread of THREADS) {
      if (thread.id === 'love-story') continue;
      expect(threadHeroTiles(thread.id), `${thread.id} should have no tiles`).toEqual([]);
    }
  });
});

describe('EGG_NODES motif classification', () => {
  it('every egg node belongs to exactly one motif trail', () => {
    for (const node of EGG_NODES) {
      const motifId = motifOf(node.id);
      expect(motifId, `"${node.id}" is not classified in MOTIF_MEMBERSHIP`).toBeDefined();
      expect(MOTIF_BY_ID[motifId!]).toBeDefined();
    }
  });
});
