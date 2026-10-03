import type { ReaderCorpus } from '../corpus';
import { eggDoorwaysForEraIn, threadDoorwaysForEraIn } from '../doorways';
import { resolveEraSecretLinkIn } from '../era-secrets-link';
import { threadPointsIn } from '../lenses';
import { contentForThreadIn } from '../threads';
import { theoriesForEraIn } from '../theories';
import { songTargetOfIn, tracksForEraIn } from '../track-guide';
import type { ContentItem, EraId, EraSecret, LensId, Milestone, RelatedId, VideoNote } from '../types';
import { corpusFromInputs } from './corpus';
import type { ReaderSnapshotCore, ReaderSnapshotCoreInputs } from './types';

/**
 * TODO: callers migrate in WP2.2-C1..C3 (docs/plans/one-ui/briefs/brief-wp22.md); until then
 * web reads both paths, and equivalence is proven by queries.test.
 */

/**
 * The video helpers live in `@swift2/content-enrichment`, which imports this
 * package, so the caller hands them over (same seam as `ReaderSnapshotDeps`).
 */
export interface ReaderQueryDeps<W extends VideoNote = VideoNote, M extends W = W> {
  videosForEra(raw: VideoNote[]): W[];
  musicVideosForEra(raw: VideoNote[]): M[];
  allVideoRecords(raw: VideoNote[]): VideoNote[];
}

/** Content and per-era domains back as the pure derivation's inputs. Era order, so a flat read is era-grouped. */
function inputsFromSnapshot(snapshot: ReaderSnapshotCore): ReaderSnapshotCoreInputs {
  const d = snapshot.domains;
  return {
    eras: d.eras,
    content: d.eras.flatMap((e) => d.content[e.id] ?? []),
    milestones: d.milestones,
    tracks: d.tracks,
    theories: d.theories,
    videos: d.videos,
    eraSecrets: d.eraSecrets,
  };
}

/**
 * The reader's accessors over one snapshot: the same names, semantics and order
 * as the web's `apps/web/lib/longlive` modules (the equality tests prove it),
 * reading only the snapshot, never a module-global provider.
 */
export function createReaderQueries<W extends VideoNote = VideoNote, M extends W = W>(
  snapshot: ReaderSnapshotCore,
  deps: ReaderQueryDeps<W, M>,
) {
  const { domains } = snapshot;
  const inputs = inputsFromSnapshot(snapshot);
  const corpus: ReaderCorpus = corpusFromInputs(inputs);
  const slugs = new Map<string, ContentItem>();
  for (const c of inputs.content) if (c.slug !== undefined && !slugs.has(c.slug)) slugs.set(c.slug, c);
  const rawVideos = (eraId: EraId): VideoNote[] => domains.videos[eraId] ?? [];

  return {
    eras: domains.eras,
    searchIndex: domains.searchIndex,
    milestones: domains.milestones as readonly Milestone[],
    contentForEra: (eraId: EraId): ContentItem[] =>
      [...(domains.content[eraId] ?? [])].sort((a, b) => b.date.localeCompare(a.date)),
    getContentItem: (id: string): ContentItem | undefined => corpus.getContentItem(id),
    getContentItemByIdOrSlug: (value: string): ContentItem | undefined =>
      corpus.getContentItem(value) ?? slugs.get(value),
    milestonesForEra: (eraId: EraId): Milestone[] =>
      domains.milestones.filter((m) => m.eraId === eraId).sort((a, b) => a.date.localeCompare(b.date)),
    tracksForEra: (eraId: EraId) => tracksForEraIn(corpus, eraId),
    theoriesForEra: (eraId: EraId) => theoriesForEraIn(corpus, eraId),
    eraSecretsForEra: (eraId: EraId): EraSecret[] => corpus.eraSecrets()[eraId] ?? [],
    videosForEra: (eraId: EraId): W[] => deps.videosForEra(rawVideos(eraId)),
    allVideoRecordsForEra: (eraId: EraId): VideoNote[] => deps.allVideoRecords(rawVideos(eraId)),
    musicVideosForEra: (eraId: EraId): M[] => deps.musicVideosForEra(rawVideos(eraId)),
    contentForThread: (threadId: LensId) => contentForThreadIn(corpus, threadId),
    contentForThreadInRange: (threadId: LensId, start: string, end: string | null): ContentItem[] => {
      const upto = end ?? new Date().toISOString().slice(0, 10);
      return contentForThreadIn(corpus, threadId).filter((c) => c.date >= start && c.date <= upto);
    },
    contentForThreadInEra: (threadId: LensId, eraId: EraId): ContentItem[] =>
      contentForThreadIn(corpus, threadId).filter((c) => c.eraId === eraId),
    songTargetOf: (relatedId: RelatedId) => songTargetOfIn(corpus, relatedId),
    resolveEraSecretLink: (deeperLink?: string) => resolveEraSecretLinkIn(corpus, deeperLink),
    threadPoints: (threadId: LensId) => threadPointsIn(corpus, threadId),
    threadDoorwaysForEra: (eraId: EraId, eraStart: string, eraEnd: string) =>
      threadDoorwaysForEraIn(corpus, eraId, eraStart, eraEnd),
    eggDoorwaysForEra: (eraId: EraId, eraStart: string, eraEnd: string) =>
      eggDoorwaysForEraIn(corpus, eraId, eraStart, eraEnd),
  };
}

export type ReaderQueries<W extends VideoNote = VideoNote, M extends W = W> = ReturnType<
  typeof createReaderQueries<W, M>
>;
