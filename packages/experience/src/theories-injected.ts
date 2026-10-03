import type { EraId, TheoryNote } from './types';
import { injectedCorpus } from './corpus-injected';
import { resolveRelatedTheoryIn, theoriesForEraIn } from './theories';

export function theoriesForEra(eraId: EraId): TheoryNote[] {
  return theoriesForEraIn(injectedCorpus(), eraId);
}

export function resolveRelatedTheory(ref: string): { eraId: EraId; theory: TheoryNote } | null {
  return resolveRelatedTheoryIn(injectedCorpus(), ref);
}
