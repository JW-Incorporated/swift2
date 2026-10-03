import {
  LOAD_SOURCE,
  type ContentBundleFile,
  type EraSecretsBundleFile,
  type LoadSource,
  type MerchCatalogue,
  type SongMoodsBundleFile,
  type TheoriesBundleFile,
  type TracksBundleFile,
  type VideosBundleFile,
} from '@swift2/content';
import type { ContentItem, Era, EraId, EraSecret, Milestone, TheoryNote, TrackNote, VideoNote } from '../types';
import type { SearchDoc } from '../search-index';
import { buildReaderSnapshot } from './build';
import type { ReaderSnapshot, ReaderSnapshotDeps, ReaderSnapshotInputs, ReaderSnapshotState } from './types';

/** The web's generated/derived modules (`apps/web/lib/longlive/*`), passed in so this package never imports app code. */
export interface BakedModules {
  ERAS: readonly Era[];
  CONTENT: readonly ContentItem[];
  MILESTONES: readonly Milestone[];
  MERCH_CATALOGUE: MerchCatalogue;
  SONG_MOODS: SongMoodsBundleFile['songs'];
  tracksForEra(eraId: EraId): TrackNote[];
  theoriesForEra(eraId: EraId): TheoryNote[];
  allVideoRecordsForEra(eraId: EraId): VideoNote[];
  eraSecretsForEra(eraId: EraId): EraSecret[];
  getSearchIndex(): SearchDoc[];
}

/** Web path. Reads the web's accessors, then wires those same inputs itself for the derived domains. */
export function fromBaked(mods: BakedModules, deps: ReaderSnapshotDeps): ReaderSnapshot {
  const byEra = <T>(read: (id: EraId) => T) =>
    Object.fromEntries(mods.ERAS.map((e) => [e.id, read(e.id)])) as Partial<Record<EraId, T>>;
  const inputs: ReaderSnapshotInputs = {
    eras: [...mods.ERAS],
    content: [...mods.CONTENT],
    milestones: [...mods.MILESTONES],
    tracks: byEra(mods.tracksForEra),
    theories: byEra(mods.theoriesForEra),
    videos: byEra(mods.allVideoRecordsForEra),
    eraSecrets: byEra(mods.eraSecretsForEra),
    merch: mods.MERCH_CATALOGUE,
    songMoods: mods.SONG_MOODS,
    searchIndex: mods.getSearchIndex(),
  };
  return buildReaderSnapshot(inputs, deps, { kind: 'baked' }, 'ready');
}

/** The parts of `@swift2/content`'s `LoadedBundle` this path reads. */
export interface BundleLike {
  manifest: { bundleVersion: string };
  /** Manifest entry name -> parsed file (`eras`, `content:<eraId>`, `tracks`, ...). */
  files: Record<string, unknown>;
  stale?: boolean;
  source?: LoadSource;
}

function perEra<F extends { eraId: string }, T>(
  files: F[] | undefined,
  pick: (f: F) => T,
): Partial<Record<EraId, T>> {
  return Object.fromEntries((files ?? []).map((f) => [f.eraId, pick(f)])) as Partial<Record<EraId, T>>;
}

/** Normalises a loaded bundle's files to the snapshot inputs. */
export function inputsFromBundle(bundle: BundleLike): ReaderSnapshotInputs {
  const f = bundle.files;
  const eras = (f.eras as Era[] | undefined) ?? [];
  const content = eras.flatMap((e) => (f[`content:${e.id}`] as ContentBundleFile | undefined)?.items ?? []);
  return {
    eras,
    content: content as ContentItem[],
    milestones: (f.milestones as Milestone[] | undefined) ?? [],
    tracks: perEra(f.tracks as TracksBundleFile[] | undefined, (x) => x.tracks as TrackNote[]),
    theories: perEra(f.theories as TheoriesBundleFile[] | undefined, (x) => x.theories as TheoryNote[]),
    videos: perEra(f.videos as VideosBundleFile[] | undefined, (x) => x.videos as VideoNote[]),
    eraSecrets: perEra(f.eraSecrets as EraSecretsBundleFile[] | undefined, (x) => x.secrets as EraSecret[]),
    merch: f.merch as MerchCatalogue,
    songMoods: (f.songMoods as SongMoodsBundleFile | undefined)?.songs ?? [],
  };
}

/** Loader outcome to snapshot state: last-good-after-data-error is `error` (last-good shown, refresh failed). */
function stateFromBundle(bundle: BundleLike): ReaderSnapshotState {
  if (bundle.source === LOAD_SOURCE.offlineLastGood) return 'offline';
  if (bundle.source === LOAD_SOURCE.lastGoodAfterDataError) return 'error';
  return bundle.stale ? 'stale' : 'ready';
}

/** App path: builds from a loaded D1 bundle; reads only the bundle, no module-global provider. */
export function fromBundle(bundle: BundleLike, deps: ReaderSnapshotDeps): ReaderSnapshot {
  const inputs = inputsFromBundle(bundle);
  const state = stateFromBundle(bundle);
  return buildReaderSnapshot(inputs, deps, { kind: 'bundle', bundleVersion: bundle.manifest.bundleVersion }, state);
}
