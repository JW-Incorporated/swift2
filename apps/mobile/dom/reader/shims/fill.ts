// Populates the shims from a ReaderSnapshot, in place, then installs the same
// experience-core providers the baked web modules install at import time.
// Call before the reader components are first imported (they derive
// module-level constants from these arrays).
import {
  setContentItemLookup,
  setEraSecretsRawProvider,
  setSongTargetResolver,
  setThreadContentProvider,
  setTheoriesRawProvider,
  setTracksRawProvider,
  songTargetOf,
} from '@swift2/experience';
import type { ReaderSnapshotCore } from '@swift2/experience/reader-snapshot';
import { CONTENT, MILESTONES, getContentItem } from './content';
import { ERA_SECRETS_RAW } from './era-secrets';
import { THEORIES_RAW } from './theories';
import { TRACKS_RAW } from './tracks';
import { VIDEOS_RAW } from './videos';
import { replaceArray, replaceRecord } from './live';

export function fill(snapshot: ReaderSnapshotCore): void {
  const d = snapshot.domains;
  replaceArray(
    CONTENT,
    d.eras.flatMap((era) => d.content[era.id] ?? []),
  );
  replaceArray(MILESTONES, d.milestones);
  replaceRecord(VIDEOS_RAW, d.videos);
  replaceRecord(TRACKS_RAW, d.tracks);
  replaceRecord(THEORIES_RAW, d.theories);
  replaceRecord(ERA_SECRETS_RAW, d.eraSecrets);

  setContentItemLookup(getContentItem);
  setThreadContentProvider(() => CONTENT);
  setTracksRawProvider(TRACKS_RAW);
  setTheoriesRawProvider(() => THEORIES_RAW);
  setEraSecretsRawProvider(() => ERA_SECRETS_RAW);
  setSongTargetResolver(songTargetOf);
}
