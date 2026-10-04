import type { MerchCatalogue, SongMoodsBundleFile } from '@swift2/content';
import type {
  ContentItem,
  Era,
  EraId,
  EraSecret,
  LoreItem,
  Milestone,
  TheoryNote,
  TrackNote,
  VideoNote,
} from '../types';
import type { SearchDoc } from '../search-index';
import type { EraFeedEntry } from '../feed-types';

/** Contract version, hashed with the domains: bump when a domain is added or its shape changes. 2: lore. */
export const READER_SNAPSHOT_VERSION = 2;

/**
 * 'error' = a last-good snapshot is shown and the latest refresh failed;
 * 'offline' = last-good served because the network failed;
 * 'stale' = cached, not yet confirmed current.
 */
export type ReaderSnapshotState = 'ready' | 'stale' | 'offline' | 'error';

type ByEra<T> = Partial<Record<EraId, T>>;

/** The core's raw, per-source data: everything the main reader route reads. */
export interface ReaderSnapshotCoreInputs {
  eras: Era[];
  /** Flat, any order; the snapshot groups it by era. */
  content: ContentItem[];
  milestones: Milestone[];
  tracks: ByEra<TrackNote[]>;
  theories: ByEra<TheoryNote[]>;
  /** EVERY video record per era, playable or not. */
  videos: ByEra<VideoNote[]>;
  eraSecrets: ByEra<EraSecret[]>;
}

/** The extension inputs: only the merch, mood and ClownChat (lore) chunks read these. */
export interface ReaderSnapshotExtensions {
  merch: MerchCatalogue;
  songMoods: SongMoodsBundleFile['songs'];
  /** ClownChat's static lore board; [] when the bundle carries none. */
  lore: LoreItem[];
}

/** Raw, per-source data both paths normalise to before derivation. */
export type ReaderSnapshotInputs = ReaderSnapshotCoreInputs & ReaderSnapshotExtensions;

/**
 * `@swift2/content-enrichment` imports this package, so it cannot be imported
 * back from here; the caller hands over its `eraVideoFeed`.
 */
export interface ReaderSnapshotDeps {
  eraVideoFeed(videosRaw: VideoNote[], embeddedYoutubeIds: ReadonlySet<string>): VideoNote[];
}

export interface EraStreamDomain {
  /** Curated watchable videos (slugs), newest first. */
  videos: string[];
  /** Thread + egg doorway entries as `buildEraStreamViewModel` receives them. */
  doorways: EraFeedEntry[];
  /** The render-ordered feed with no filter active, as `kind:key@sortDate`. */
  entries: string[];
}

export interface TrackGuideEntry {
  key: string;
  next: string | null;
  /** Resolved "keep exploring" targets as `song:<slug>` / `moment:<id>`. */
  explore: string[];
}

/** The core domains: built eagerly, everything the main route reads. */
export interface ReaderSnapshotCoreDomains {
  eras: Era[];
  content: ByEra<ContentItem[]>;
  milestones: Milestone[];
  videos: ByEra<VideoNote[]>;
  /** Equivalence fingerprint: the reader never reads this; it derives from the raw domains. */
  eraStream: ByEra<EraStreamDomain>;
  theories: ByEra<TheoryNote[]>;
  eraSecrets: ByEra<EraSecret[]>;
  /** Equivalence fingerprint: the reader never reads this; it derives from the raw domains. */
  threads: { id: string; itemIds: string[] }[];
  searchIndex: SearchDoc[];
  tracks: ByEra<TrackNote[]>;
  /** Equivalence fingerprint: the reader never reads this; it derives from the raw domains. */
  trackGuide: ByEra<TrackGuideEntry[]>;
}

/** Every hashed domain. A diverging domain is reported by its key. */
export type ReaderSnapshotDomains = ReaderSnapshotCoreDomains & ReaderSnapshotExtensions;

export type ReaderSnapshotDomainName = keyof ReaderSnapshotDomains;

/** All 14 domain names; `hashSnapshot` requires every one. */
export const READER_SNAPSHOT_DOMAIN_NAMES: readonly ReaderSnapshotDomainName[] = [
  'eras',
  'content',
  'milestones',
  'videos',
  'eraStream',
  'theories',
  'eraSecrets',
  'threads',
  'searchIndex',
  'tracks',
  'trackGuide',
  'merch',
  'songMoods',
  'lore',
];

/** A snapshot without the extension domains (merch, songMoods, lore): what the main route holds. Not hashable. */
export interface ReaderSnapshotCore {
  version: number;
  state: ReaderSnapshotState;
  /** Where it came from. Provenance only: never hashed. */
  origin: { kind: 'baked' } | { kind: 'bundle'; bundleVersion: string };
  domains: ReaderSnapshotCoreDomains;
}

export interface ReaderSnapshot extends ReaderSnapshotCore {
  domains: ReaderSnapshotDomains;
}

/** What the reader context holds: a core snapshot, or `loading` before the first one exists. */
export type ReaderSnapshotContextValue = { status: 'loading' } | ReaderSnapshotCore;
