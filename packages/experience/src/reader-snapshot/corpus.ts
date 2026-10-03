import type { ReaderCorpus } from '../corpus';
import { songTargetOfIn } from '../track-guide';
import type { RelatedId } from '../types';
import type { ReaderSnapshotInputs } from './types';

/**
 * The pure corpus over one set of snapshot inputs: it reads only `inputs`, never a
 * module-global provider. The id map is built here, once, not in the `*In`
 * functions (those take lookups as functions, so `injectedCorpus()` stays O(1)).
 */
export function corpusFromInputs(inputs: ReaderSnapshotInputs): ReaderCorpus {
  const byId = new Map(inputs.content.map((c) => [c.id, c] as const));
  const corpus: ReaderCorpus = {
    content: () => inputs.content,
    getContentItem: (id) => byId.get(id),
    tracks: () => inputs.tracks,
    theories: () => inputs.theories,
    eraSecrets: () => inputs.eraSecrets,
    songTarget: (relatedId) => songTargetOfIn(corpus, relatedId as RelatedId),
  };
  return corpus;
}
