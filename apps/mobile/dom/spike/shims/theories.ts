// Shim for apps/web/lib/longlive/theories.ts: same exports; THEORIES_RAW is
// live and `fill()` installs it. Shimmed too because the baked module installs
// its own provider at import time and would overwrite the filled one.
import type { EraId, TheoryNote } from '@swift2/experience';

export { theoriesForEra, resolveRelatedTheory } from '@swift2/experience';

export const THEORIES_RAW: Partial<Record<EraId, TheoryNote[]>> = {};
