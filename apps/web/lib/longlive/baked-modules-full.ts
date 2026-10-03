import type { BakedModules } from '@swift2/experience/reader-snapshot';

import { bakedModules } from './baked-modules';
import { MERCH_CATALOGUE } from './merch';
import { SONG_MOODS } from './song-moods.generated';

/** Core plus extensions, for the parity probe and tests. Never import this from a client component on the main route. */
export function bakedModulesFull(): BakedModules {
  return {
    ...bakedModules(),
    MERCH_CATALOGUE: MERCH_CATALOGUE as unknown as BakedModules['MERCH_CATALOGUE'],
    SONG_MOODS,
  };
}
