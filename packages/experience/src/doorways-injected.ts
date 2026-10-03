import type { EraId } from './types';
import { injectedCorpus } from './corpus-injected';
import { eggDoorwaysForEraIn, threadDoorwaysForEraIn } from './doorways';
import type { Anchored, EggDoorway, ThreadDoorway } from './feed-types';

export function threadDoorwaysForEra(
  eraId: EraId,
  eraStart: string,
  eraEnd: string,
): { kind: 'thread'; doorway: ThreadDoorway; anchor: Anchored }[] {
  return threadDoorwaysForEraIn(injectedCorpus(), eraId, eraStart, eraEnd);
}

export function eggDoorwaysForEra(
  eraId: EraId,
  eraStart: string,
  eraEnd: string,
): { kind: 'egg'; doorway: EggDoorway; anchor: Anchored }[] {
  return eggDoorwaysForEraIn(injectedCorpus(), eraId, eraStart, eraEnd);
}
