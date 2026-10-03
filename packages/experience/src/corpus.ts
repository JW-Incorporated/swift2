import type { ContentItem, EraId, EraSecret, TheoryNote, TrackNote } from './types';
import type { SongTarget } from './track-guide';

/**
 * The data the content-derived functions read, passed explicitly. Every member
 * is a function, never a prebuilt Map: `injectedCorpus()` must stay O(1) so the
 * wrappers around the pure `*In` functions cost nothing per call. Maps are built
 * only where a corpus is made from whole inputs (`corpusFromInputs`).
 */
export interface ReaderCorpus {
  content(): readonly ContentItem[];
  getContentItem(id: string): ContentItem | undefined;
  tracks(): Partial<Record<EraId, TrackNote[]>>;
  theories(): Partial<Record<EraId, TheoryNote[]>>;
  eraSecrets(): Partial<Record<EraId, EraSecret[]>>;
  songTarget(relatedId: string): SongTarget | null;
}
