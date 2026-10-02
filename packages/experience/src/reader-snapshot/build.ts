import { buildEraStreamViewModel } from '../era-stream';
import { embeddedYoutubeIds } from '../era-feed';
import { eggDoorwaysForEra, threadDoorwaysForEra } from '../doorways';
import { THREADS } from '../lenses';
import { contentForThread } from '../threads';
import { keepExploring, nextTrackOnAlbum, songTargetOf, trackKey } from '../track-guide';
import { setContentItemLookup } from '../content-item-provider';
import { setTracksRawProvider } from '../track-catalogue-provider';
import {
  setEraSecretsRawProvider,
  setSongTargetResolver,
  setTheoriesRawProvider,
  setThreadContentProvider,
} from '../thread-content-provider';
import type { ContentItem, EraId, VideoNote } from '../types';
import type { SearchDoc } from '../search-index';
import type { RenderFeedEntry } from '../era-feed-clusters';
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

/**
 * Installs `inputs` into the experience core's injected providers, the same
 * seams `apps/web/lib/longlive/*` wires at import time. The bundle path must
 * call this before `buildReaderSnapshot`; the web has already done it.
 * Global by design (the core's providers are module singletons).
 */
export function wireProviders(inputs: ReaderSnapshotInputs): void {
  const byId = new Map(inputs.content.map((c) => [c.id, c] as const));
  setContentItemLookup((id) => byId.get(id));
  setThreadContentProvider(() => inputs.content);
  setTracksRawProvider(inputs.tracks);
  setTheoriesRawProvider(() => inputs.theories);
  setEraSecretsRawProvider(() => inputs.eraSecrets);
  setSongTargetResolver(songTargetOf);
}

function groupContent(inputs: ReaderSnapshotInputs): Partial<Record<EraId, ContentItem[]>> {
  const out: Partial<Record<EraId, ContentItem[]>> = {};
  for (const era of inputs.eras) out[era.id] = inputs.content.filter((c) => c.eraId === era.id);
  return out;
}

/**
 * Ranking ties break on score then title, never on position, so doc order is
 * not meaningful; the bundle also regroups content by era where the web keeps
 * its own global order. Hashing the index as a set keeps that from reading as
 * divergence.
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
 * Derives every domain from `inputs` (reading the providers for the derived
 * ones: threads, doorways, track guide). One pipeline for both paths, so any
 * difference traces to the inputs.
 */
export function buildReaderSnapshot(
  inputs: ReaderSnapshotInputs,
  deps: ReaderSnapshotDeps,
  origin: ReaderSnapshot['origin'],
  state: ReaderSnapshotState = 'ready',
): ReaderSnapshot {
  const content = groupContent(inputs);
  const eraStream: ReaderSnapshotDomains['eraStream'] = {};
  const trackGuide: ReaderSnapshotDomains['trackGuide'] = {};

  for (const era of inputs.eras) {
    const items = content[era.id] ?? [];
    const videoFeed = deps.eraVideoFeed(inputs.videos[era.id] ?? [], embeddedYoutubeIds(items)) as VideoNote[];
    const doorways = [
      ...threadDoorwaysForEra(era.id, era.start, era.end),
      ...eggDoorwaysForEra(era.id, era.start, era.end),
    ];
    const vm = buildEraStreamViewModel({ era, items, videoFeed, doorwayEntries: doorways, filters: new Set() });
    eraStream[era.id] = { videos: videoFeed.map((v) => v.slug), doorways, entries: vm.entries.map(entryKey) };

    trackGuide[era.id] = (inputs.tracks[era.id] ?? []).map(
      (track): TrackGuideEntry => {
        const next = nextTrackOnAlbum(era.id, track);
        return {
          key: trackKey(era.id, track),
          next: next ? trackKey(era.id, next) : null,
          explore: keepExploring(era.id, track).map((c) =>
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
    threads: THREADS.map((t) => ({ id: t.id, itemIds: contentForThread(t.id).map((i) => i.id) })),
    searchIndex: sortedDocs(inputs.searchIndex ?? buildSearchDocs(inputs)),
    tracks: inputs.tracks,
    trackGuide,
    merch: inputs.merch,
    songMoods: inputs.songMoods,
  };
  return { version: READER_SNAPSHOT_VERSION, state, origin, domains };
}
