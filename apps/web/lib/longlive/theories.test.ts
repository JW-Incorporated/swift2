import { describe, expect, it } from 'vitest';
import { theoriesForEra, resolveRelatedTheory } from './theories';
import { THEORIES_RAW } from './theories.generated';
import type { EraId } from '@swift2/experience';

const ALL_ERA_IDS: EraId[] = [
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
];

// OS-014b-3 (kanban t_a68139a4, docs/proposals/2026-09-vault-read-path.md):
// theories.ts now reads its raw per-era data (THEORIES_RAW) from
// theories-bundle.generated.ts, which scripts/generate-bundle-backed-
// modules.mjs regenerates from the PUBLISHED content bundle
// (apps/web/public/content/<bundleVersion>/theories.json) — instead of
// importing theories.generated.ts (the seed-derived intermediate that
// feeds the bundle build itself) directly. This test proves the swap is
// byte-identical to the pre-OS-014b-3 behavior: run `npm run prebuild`
// (apps/web) first so theories.generated.ts, the published bundle, AND
// theories-bundle.generated.ts all exist on disk, matching production's
// build order.
describe('theoriesForEra reads the published bundle (byte-identical to THEORIES_RAW)', () => {
  it('returns exactly what THEORIES_RAW held for each era', () => {
    for (const eraId of ALL_ERA_IDS) {
      expect(theoriesForEra(eraId)).toEqual(THEORIES_RAW[eraId] ?? []);
    }
  });

  it('resolveRelatedTheory finds a real cross-linked theory', () => {
    for (const eraId of ALL_ERA_IDS) {
      for (const theory of theoriesForEra(eraId)) {
        for (const ref of theory.relatedSlugs ?? []) {
          const resolved = resolveRelatedTheory(ref);
          expect(resolved, `${eraId}:${theory.slug} -> ${ref} did not resolve`).not.toBeNull();
        }
      }
    }
  });
});
