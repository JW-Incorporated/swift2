import { CONTENT } from './content';
import { ERAS } from '@swift2/experience';
import { EGG_NODES, motifOf, THREADS } from '@swift2/experience';
import { tracksForEra, trackKey } from './tracks';
import { theoriesForEra } from './theories';
import { allVideoRecordsForEra } from './videos';
import {
  makeSearchDoc,
  type SearchDoc,
  type SearchTarget,
} from '@swift2/experience';

// Re-export the generic ranking engine (OS-025: it now lives in
// `@swift2/experience`, `search-index.ts`) so existing imports of
// `./search` from this app keep working unchanged.
export {
  flattenGroups,
  MAX_RESULTS_PER_TYPE,
  normalize,
  scoreDoc,
  searchDocs,
  tokenize,
  WEIGHT_DEFINING,
  WEIGHT_NOTABLE,
  type SearchDoc,
  type SearchDocType,
  type SearchGroup,
  type SearchResult,
  type SearchTarget,
} from '@swift2/experience';

/**
 * Long Live — client-side search index builder (audit T7 / §E.11).
 *
 * A static in-memory index over content that is ALREADY shipped to the client
 * (moments, eras, threads, tracks, theories, videos, Clue Web eggs).
 * No backend, no per-user request, no fetch — the index is built lazily once
 * per session from the same modules the UI renders from, so it can never
 * drift from what is on screen (and respects the repo's cost-discipline
 * rule: search costs zero server work).
 *
 * The ranking engine itself (doc shape, normalization, scoring, grouping)
 * moved into `@swift2/experience`'s `search-index.ts` (OS-025) so any
 * renderer can build its own doc list against the same engine. This module
 * keeps only what's still app-specific: which content modules to read and
 * how to turn each record into a `SearchDoc` via the shared `makeSearchDoc`
 * factory — the same reason `progress.ts`'s pure logic moved out but the
 * `local-storage-adapter.ts` wiring stayed here.
 */

/**
 * Assemble the full index from the already-loaded static datasets. Pure and
 * deterministic (all inputs are module constants); exported for tests, but
 * app code should read the lazy `getSearchIndex()` singleton.
 */
export function buildSearchIndex(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const era of ERAS) {
    docs.push(
      makeSearchDoc('era', era.id, era.name, era.tagline, era.id, { kind: 'era', eraId: era.id }, [
        era.album,
        era.shortName,
        era.yearLabel,
        era.tagline,
        era.intro,
      ]),
    );
  }

  for (const item of CONTENT) {
    docs.push(
      makeSearchDoc(
        'moment',
        item.id,
        item.title,
        item.summary,
        item.eraId,
        { kind: 'moment', itemId: item.id },
        [item.summary, ...item.body, item.tags.join(' '), item.dateLabel],
        item.significance === 'defining'
          ? 45 // WEIGHT_DEFINING
          : item.significance === 'notable'
            ? 18 // WEIGHT_NOTABLE
            : 0,
      ),
    );
  }

  for (const node of EGG_NODES) {
    const motifId = motifOf(node.id);
    // Every egg lives on a motif trail (dev-guarded in lenses.ts); if one
    // ever doesn't, fall back to its era rather than a dead link.
    const target: SearchTarget = motifId
      ? { kind: 'trail', motifId }
      : { kind: 'era', eraId: node.eraId };
    docs.push(
      makeSearchDoc('egg', node.id, node.label, node.detail, node.eraId, target, [
        node.detail,
        String(node.year),
      ]),
    );
  }

  for (const thread of THREADS) {
    docs.push(
      makeSearchDoc('thread', thread.id, thread.title, thread.kicker, null, { kind: 'thread', lensId: thread.id }, [
        thread.kicker,
        thread.what,
      ]),
    );
  }

  for (const era of ERAS) {
    for (const track of tracksForEra(era.id)) {
      docs.push(
        makeSearchDoc(
          'track',
          `${era.id}:${track.trackNumber ?? 'x'}:${track.title}`,
          track.title,
          `${era.album} · ${track.note}`,
          era.id,
          { kind: 'track', eraId: era.id, trackKey: trackKey(era.id, track) },
          [track.note, era.album],
        ),
      );
    }
    for (const theory of theoriesForEra(era.id)) {
      docs.push(
        makeSearchDoc(
          'theory',
          `${era.id}:${theory.slug}`,
          theory.title,
          theory.claim,
          era.id,
          { kind: 'theory-guide', eraId: era.id },
          [theory.claim, theory.evidence ?? ''],
        ),
      );
    }
    // Deliberately the FULL record set, including the ones the rail hides for
    // having no playable embed (playable-first, docs/decisions.md 2026-08-13).
    // That rule is about not rendering a video CARD the reader can't play; a
    // search hit is not a card, and its failure mode is the opposite one —
    // filtering here would make the app look like it has never heard of
    // Miss Americana or The Eras Tour film, which reads as a content gap
    // rather than a curation choice. The target still carries `videoId`
    // (#652): SearchOverlay's openVideo scrolls straight to that video's own
    // card when one is mounted, and falls back to landing on the era (still
    // somewhere real) when it isn't — an unplayable record has no card at
    // all, and a playable one already embedded inline in a moment doesn't
    // get a second standalone card (era-feed.ts's de-dupe).
    for (const video of allVideoRecordsForEra(era.id)) {
      docs.push(
        makeSearchDoc(
          'video',
          `${era.id}:${video.slug}`,
          video.title,
          video.summary ?? `${era.album} era video`,
          era.id,
          { kind: 'video', eraId: era.id, videoId: video.slug },
          [video.summary ?? '', video.relatedSongs.join(' '), video.easterEggs.join(' ')],
        ),
      );
    }
  }

  return docs;
}

let cachedIndex: SearchDoc[] | null = null;

/** The app's index — built once, on first search, from already-loaded data. */
export function getSearchIndex(): SearchDoc[] {
  cachedIndex ??= buildSearchIndex();
  return cachedIndex;
}
