import { ERAS } from '@swift2/experience';
import type { BakedModules } from '@swift2/experience/reader-snapshot';

import { CONTENT, MILESTONES } from './content';
import { eraSecretsForEra } from './era-secrets';
import { MERCH_CATALOGUE } from './merch';
import { SONG_MOODS } from './song-moods.generated';
import { theoriesForEra } from './theories';
import { tracksForEra } from './tracks';
import { allVideoRecordsForEra } from './videos';

/** The web's baked modules, in the shape `fromBaked` reads. The parity probe and the reader provider both build from this. */
export function bakedModules(): BakedModules {
  return {
    ERAS,
    CONTENT,
    MILESTONES,
    MERCH_CATALOGUE: MERCH_CATALOGUE as unknown as BakedModules['MERCH_CATALOGUE'],
    SONG_MOODS,
    tracksForEra,
    theoriesForEra,
    allVideoRecordsForEra,
    eraSecretsForEra,
  };
}
