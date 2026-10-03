import { buildEraStreamViewModel } from '../era-stream';
import { embeddedYoutubeIds } from '../era-feed';
import { eggDoorwaysForEraIn, threadDoorwaysForEraIn } from '../doorways';
import { THREADS } from '../lenses';
import { contentForThreadIn } from '../threads';
import { keepExploringIn, nextTrackOnAlbumIn, trackKey } from '../track-guide';
import type { ContentItem, EraId, VideoNote } from '../types';
import type { SearchDoc } from '../search-index';
import type { RenderFeedEntry } from '../era-feed-clusters';
import { corpusFromInputs } from './corpus';
import { buildSearchDocs } from './search-docs';
import {
  READER_SNAPSHOT_VERSION,
  type ReaderSnapshot,
  type ReaderSnapshotDeps,
  type ReaderSnapshotDomains,
  type ReaderSnapshotInputs,
  type ReaderSnapshotState,
  type TrackGuideEntry,
} from './types';

function groupContent(inputs: ReaderSnapshotInputs): Partial<Record<EraId, ContentItem[]>> {
  const out: Partial<Record<EraId, ContentItem[]>> = {};
  for (const era of inputs.eras) out[era.id] = inputs.content.filter((c) => c.eraId === era.id);
  return out;
}

/**
 * The bundle regroups content by era, so it cannot reproduce the web's global
 * `CONTENT` order (that order is VAULT_RAW's key order, not in the bundle).
 * Ranking breaks ties on score, title, then key (search-index.ts), never on
 * position, so the index is hashed in key order instead.
 */
function sortedDocs(docs: SearchDoc[]): SearchDoc[] {
  const key = (d: SearchDoc) => d.key;
  return [...docs].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
}

function entryKey(e: RenderFeedEntry): string {
  switch (e.kind) {
    case 'moment':
      return `moment:${e.item.id}@${e.anchor.sortDate}`;
    case 'video':
      return `video:${e.video.slug}@${e.anchor.sortDate}`;
    case 'thread':
      return `thread:${e.doorway.threadId}@${e.anchor.sortDate}`;
    case 'egg':
      return `egg:${e.doorway.eggId}@${e.anchor.sortDate}`;
    case 'cluster':
      return `cluster:${e.items.map((i) => i.id).join('+')}@${e.anchor.sortDate}`;
    case 'current':
      return `current:${e.item.id}@${e.anchor.sortDate}`;
  }
}

/**
 * Derives every domain from `inputs` alone: the derived ones (threads,
 * doorways, track guide) run the pure `*In` functions over `corpusFromInputs`,
 * so a build reads and writes no module-global state. One pipeline for both
 * paths, so any difference traces to the inputs.
 */
export function buildReaderSnapshot(
  inputs: ReaderSnapshotInputs,
  deps: ReaderSnapshotDeps,
  origin: ReaderSnapshot['origin'],
  state: ReaderSnapshotState = 'ready',
): ReaderSnapshot {
  return derive(inputs, deps, origin, state);
}

function derive(
  inputs: ReaderSnapshotInputs,
  deps: ReaderSnapshotDeps,
  origin: ReaderSnapshot['origin'],
  state: ReaderSnapshotState,
): ReaderSnapshot {
  const corpus = corpusFromInputs(inputs);
  const content = groupContent(inputs);
  const eraStream: ReaderSnapshotDomains['eraStream'] = {};
  const trackGuide: ReaderSnapshotDomains['trackGuide'] = {};

  for (const era of inputs.eras) {
    const items = content[era.id] ?? [];
    const videoFeed = deps.eraVideoFeed(inputs.videos[era.id] ?? [], embeddedYoutubeIds(items)) as VideoNote[];
    const doorways = [
      ...threadDoorwaysForEraIn(corpus, era.id, era.start, era.end),
      ...eggDoorwaysForEraIn(corpus, era.id, era.start, era.end),
    ];
    const vm = buildEraStreamViewModel({ era, items, videoFeed, doorwayEntries: doorways, filters: new Set() });
    eraStream[era.id] = { videos: videoFeed.map((v) => v.slug), doorways, entries: vm.entries.map(entryKey) };

    trackGuide[era.id] = (inputs.tracks[era.id] ?? []).map(
      (track): TrackGuideEntry => {
        const next = nextTrackOnAlbumIn(corpus, era.id, track);
        return {
          key: trackKey(era.id, track),
          next: next ? trackKey(era.id, next) : null,
          explore: keepExploringIn(corpus, era.id, track).map((c) =>
            c.kind === 'song' ? `song:${c.track.slug}` : `moment:${c.item.id}`,
          ),
        };
      },
    );
  }

  const domains: ReaderSnapshotDomains = {
    eras: inputs.eras,
    content,
    milestones: inputs.milestones,
    videos: inputs.videos,
    eraStream,
    theories: inputs.theories,
    eraSecrets: inputs.eraSecrets,
    threads: THREADS.map((t) => ({ id: t.id, itemIds: contentForThreadIn(corpus, t.id).map((i) => i.id) })),
    searchIndex: sortedDocs(inputs.searchIndex ?? buildSearchDocs(inputs)),
    tracks: inputs.tracks,
    trackGuide,
    merch: inputs.merch,
    songMoods: inputs.songMoods,
  };
  return { version: READER_SNAPSHOT_VERSION, state, origin, domains };
}
