import { describe, expect, it } from 'vitest';
import { eggDoorwaysForEra, ERAS } from '@swift2/experience';
import './theories'; // side effect: wires the real generated THEORIES_RAW into @swift2/experience
import { theoriesForEra } from './theories';

// `eggDoorwaysForEra` (packages/experience/src/doorways.ts, moved there in
// OS-022) reads live seed data via `theoriesForEra`, which itself reads the
// generated `THEORIES_RAW` dataset the app injects at import time
// (`./theories.ts`'s `setTheoriesRawProvider` call — see
// thread-content-provider.ts's header doc: content-loading stays OS-013/
// OS-014 scope, so `packages/experience` can't load THEORIES_RAW itself).
// These real-corpus invariants therefore live here, in the app, rather than
// in packages/experience/src/doorways.test.ts (which only wires synthetic
// providers) — same split as apps/web/lib/longlive/tracks.test.ts vs.
// packages/experience/src/track-guide.test.ts (OS-024).

describe('eggDoorwaysForEra (real corpus)', () => {
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
