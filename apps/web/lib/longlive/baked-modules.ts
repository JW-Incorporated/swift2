import { ERAS } from '@swift2/experience';
import type { BakedCoreModules } from '@swift2/experience/reader-snapshot';

import { CONTENT, MILESTONES } from './content';
import { eraSecretsForEra } from './era-secrets';
import { theoriesForEra } from './theories';
import { tracksForEra } from './tracks';
import { allVideoRecordsForEra } from './videos';

/** The web's core baked modules, in the shape `fromBakedCore` reads. No merch or song moods: the root client component must not import those chunks. */
export function bakedModules(): BakedCoreModules {
  return {
    ERAS,
    CONTENT,
    MILESTONES,
    tracksForEra,
    theoriesForEra,
    allVideoRecordsForEra,
    eraSecretsForEra,
  };
}
