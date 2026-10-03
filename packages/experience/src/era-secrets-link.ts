import type { ContentItem, EraId, TrackNote } from './types';
import type { ReaderCorpus } from './corpus';

/** A resolved `EraSecret.deeperLink`, ready to navigate. */
export type EraSecretLink =
  | { kind: 'song'; eraId: EraId; track: TrackNote }
  | { kind: 'moment'; item: ContentItem };

/**
 * Resolve an `EraSecret.deeperLink` to a concrete navigation target. `song:`
 * ids resolve against the track guide, `moment:` ids against era content.
 * Everything else — `egg:` (the Clue Web has no per-egg deep-link target yet),
 * other namespaces, and unknown ids — resolves to null, and the card renders
 * with no deeper link rather than a dead one (same silent-skip contract as
 * lib/longlive/related.ts and the dossier connections).
 */
export function resolveEraSecretLinkIn(corpus: ReaderCorpus, deeperLink?: string): EraSecretLink | null {
  if (!deeperLink) return null;
  const song = corpus.songTarget(deeperLink);
  if (song) return { kind: 'song', eraId: song.eraId, track: song.track };
  if (deeperLink.startsWith('moment:')) {
    const item = corpus.getContentItem(deeperLink.slice('moment:'.length));
    if (item) return { kind: 'moment', item };
  }
  return null;
}
