import { describe, expect, it } from 'vitest';
import { threadDoorwaysForEra, eggDoorwaysForEra } from './doorways';
import { threadsInEra } from './lenses';
import { theoriesForEra } from './theories';
import { ERAS } from './eras';

// Real-corpus invariants, in the idiom of track-video.test.ts's "every track
// guide entry either pairs with a real video or returns null — never
// throws": these functions read live seed data (THREADS, THEORIES_RAW), so a
// fixture-only test would prove nothing about the actual mapping.

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

describe('eggDoorwaysForEra', () => {
  it('never throws across every real era, and matches theoriesForEra 1:1', () => {
    for (const era of ERAS) {
      const doorways = eggDoorwaysForEra(era.id, era.start, era.end);
      expect(doorways).toHaveLength(theoriesForEra(era.id).length);
    }
  });

  // The honesty rule: TheoryNote carries no date, no song pointer and no
  // moment pointer (verified against types.ts, PLAN.md § Plan amendments 3)
  // — nothing real to anchor to, so every egg doorway is era-scatter, never
  // exact, and never displays a synthetic date as fact.
  it('always anchors via era-scatter, never a displayed date', () => {
    for (const era of ERAS) {
      for (const d of eggDoorwaysForEra(era.id, era.start, era.end)) {
        expect(d.anchor.via).toBe('era-scatter');
        expect(d.anchor.displayDate).toBeNull();
      }
    }
  });

  it('eggId is globally stable — prefixed with the era so per-era slugs never collide', () => {
    for (const d of eggDoorwaysForEra('lover', '2019-08-23', '2019-12-13')) {
      expect(d.doorway.eggId.startsWith('lover:')).toBe(true);
    }
  });

  // R4: an easter_egg doorway points back to the Clue Web (the-eggs thread
  // it is drawn from); a speculative theory has no thread to point back to
  // and must not invent one.
  it('R4: threadId is easter-eggs for an easter_egg, null for a theory', () => {
    for (const era of ERAS) {
      for (const d of eggDoorwaysForEra(era.id, era.start, era.end)) {
        const theory = theoriesForEra(era.id).find((t) => `${era.id}:${t.slug}` === d.doorway.eggId);
        expect(theory).toBeDefined();
        if (theory!.kind === 'easter_egg') {
          expect(d.doorway.threadId).toBe('easter-eggs');
        } else {
          expect(d.doorway.threadId).toBeNull();
        }
      }
    }
  });

  it('is deterministic — the same era yields the same doorways on repeat calls', () => {
    const era = ERAS.find((e) => e.id === 'ttpd')!;
    const a = eggDoorwaysForEra(era.id, era.start, era.end);
    const b = eggDoorwaysForEra(era.id, era.start, era.end);
    expect(a).toEqual(b);
  });
});
