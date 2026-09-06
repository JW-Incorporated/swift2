import { describe, expect, it } from 'vitest';
import { threadDoorwaysForEra } from './doorways';
import { threadsInEra } from './lenses';
import { ERAS } from './eras';

// Real-corpus invariants, in the idiom of track-video.test.ts's "every track
// guide entry either pairs with a real video or returns null — never
// throws": `threadDoorwaysForEra` reads live seed data (THREADS, both
// curated in-package in `lenses.ts`), so a fixture-only test would prove
// nothing about the actual mapping.
//
// `eggDoorwaysForEra` also needs real data (THEORIES_RAW), but that dataset
// is generated at build time and injected by the app (OS-013/OS-014 scope —
// see thread-content-provider.ts's header doc) — this package must stay
// data-source-free, so `eggDoorwaysForEra`'s real-corpus assertions live in
// apps/web/lib/longlive/doorways-real-corpus.test.ts instead, which wires
// the real generated theories in via `setTheoriesRawProvider` the same way
// apps/web/lib/longlive/tracks.test.ts does for track-guide.ts (OS-024).

describe('threadDoorwaysForEra', () => {
  it('never throws across every real era, and matches threadsInEra 1:1', () => {
    for (const era of ERAS) {
      const doorways = threadDoorwaysForEra(era.id, era.start, era.end);
      expect(doorways).toHaveLength(threadsInEra(era.id).length);
    }
  });

  it('anchors via exact when the thread point falls inside the era, clamped when it does not', () => {
    for (const era of ERAS) {
      for (const d of threadDoorwaysForEra(era.id, era.start, era.end)) {
        expect(['exact', 'clamped']).toContain(d.anchor.via);
        if (d.anchor.via === 'exact') {
          expect(d.anchor.displayDate).toBe(d.anchor.sortDate);
        } else {
          expect(d.anchor.displayDate).toBeNull();
        }
      }
    }
  });

  it('carries a real, non-empty title and example line — never invented copy', () => {
    for (const era of ERAS) {
      for (const d of threadDoorwaysForEra(era.id, era.start, era.end)) {
        expect(d.doorway.title.length).toBeGreaterThan(0);
        expect(d.doorway.example.length).toBeGreaterThan(0);
      }
    }
  });

  // PLAN.md P3 step 14a: every doorway anchor now falls inside its own era's
  // window, whatever `threadPoints` originally handed back — a point outside
  // the window is clamped to the nearer boundary rather than left to distort
  // the scrubber's rail. Real corpus case: debut's `taylors-version` doorway
  // sources a point of 2006-01-01, before debut's own 2006-10-24 start.
  it('always sorts inside [era.start, era.end] — an out-of-window point is clamped, not left outside', () => {
    for (const era of ERAS) {
      const startMs = Date.parse(`${era.start}T00:00:00Z`);
      const endMs = Date.parse(`${era.end}T00:00:00Z`);
      for (const d of threadDoorwaysForEra(era.id, era.start, era.end)) {
        const ms = Date.parse(`${d.anchor.sortDate}T00:00:00Z`);
        expect(ms).toBeGreaterThanOrEqual(startMs);
        expect(ms).toBeLessThanOrEqual(endMs);
      }
    }
  });

  it('clamps a real out-of-window point (debut / taylors-version) to the era start, and drops its displayDate', () => {
    const era = ERAS.find((e) => e.id === 'debut')!;
    const doorway = threadDoorwaysForEra(era.id, era.start, era.end).find(
      (d) => d.doorway.threadId === 'taylors-version',
    )!;
    expect(doorway.anchor.via).toBe('clamped');
    expect(doorway.anchor.sortDate).toBe(era.start);
    expect(doorway.anchor.displayDate).toBeNull();
  });

  it('keeps a real in-window point exact and displayed (debut / love-story)', () => {
    const era = ERAS.find((e) => e.id === 'debut')!;
    const doorway = threadDoorwaysForEra(era.id, era.start, era.end).find(
      (d) => d.doorway.threadId === 'love-story',
    )!;
    expect(doorway.anchor.via).toBe('exact');
    expect(doorway.anchor.displayDate).toBe(doorway.anchor.sortDate);
  });

  it('is deterministic — the same era yields the same doorways on repeat calls', () => {
    const era = ERAS.find((e) => e.id === 'reputation')!;
    const a = threadDoorwaysForEra(era.id, era.start, era.end);
    const b = threadDoorwaysForEra(era.id, era.start, era.end);
    expect(a).toEqual(b);
  });
});
