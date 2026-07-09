import { describe, expect, it } from 'vitest';
import { ERAS } from './eras';
import {
  CROSSING_THREADS,
  EGG_NODES,
  MOTIF_BY_ID,
  RELATIONSHIPS,
  RUNWAY_LOOKS,
  motifOf,
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
