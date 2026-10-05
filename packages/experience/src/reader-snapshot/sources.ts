import {
  LOAD_SOURCE,
  clownbotLoreBundleFileSchema,
  type ContentBundleFile,
  type EraSecretsBundleFile,
  type LoadSource,
  type MerchCatalogue,
  type SongMoodsBundleFile,
  type TheoriesBundleFile,
  type TracksBundleFile,
  type VideosBundleFile,
} from '@swift2/content';
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
import { attachExtensions, buildReaderSnapshot, buildReaderSnapshotCore } from './build';
import type {
  ReaderSnapshot,
  ReaderSnapshotCore,
  ReaderSnapshotCoreInputs,
  ReaderSnapshotDeps,
  ReaderSnapshotExtensions,
  ReaderSnapshotInputs,
  ReaderSnapshotState,
} from './types';

/** The web's generated/derived modules (`apps/web/lib/longlive/*`), passed in so this package never imports app code. */
export interface BakedCoreModules {
  ERAS: readonly Era[];
  CONTENT: readonly ContentItem[];
  MILESTONES: readonly Milestone[];
  tracksForEra(eraId: EraId): TrackNote[];
  theoriesForEra(eraId: EraId): TheoryNote[];
  allVideoRecordsForEra(eraId: EraId): VideoNote[];
  eraSecretsForEra(eraId: EraId): EraSecret[];
}

export interface BakedModules extends BakedCoreModules {
  MERCH_CATALOGUE: MerchCatalogue;
  SONG_MOODS: SongMoodsBundleFile['songs'];
  LORE: readonly LoreItem[];
}

function coreInputsFromBaked(mods: BakedCoreModules): ReaderSnapshotCoreInputs {
  const byEra = <T>(read: (id: EraId) => T) =>
    Object.fromEntries(mods.ERAS.map((e) => [e.id, read(e.id)])) as Partial<Record<EraId, T>>;
  return {
    eras: [...mods.ERAS],
    content: [...mods.CONTENT],
    milestones: [...mods.MILESTONES],
    tracks: byEra(mods.tracksForEra),
    theories: byEra(mods.theoriesForEra),
    videos: byEra(mods.allVideoRecordsForEra),
    eraSecrets: byEra(mods.eraSecretsForEra),
  };
}

/** Web path, core only: no merch or songMoods, so the caller need not import those chunks. */
export function fromBakedCore(
  mods: BakedCoreModules,
  deps: ReaderSnapshotDeps,
): ReaderSnapshotCore {
  return buildReaderSnapshotCore(coreInputsFromBaked(mods), deps, { kind: 'baked' }, 'ready');
}

/** Web path, full. Reads the web's accessors, then wires those same inputs itself for the derived domains. */
export function fromBaked(mods: BakedModules, deps: ReaderSnapshotDeps): ReaderSnapshot {
  return attachExtensions(fromBakedCore(mods, deps), {
    merch: mods.MERCH_CATALOGUE,
    songMoods: mods.SONG_MOODS,
    lore: [...mods.LORE],
  });
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
  return Object.fromEntries((files ?? []).map((f) => [f.eraId, pick(f)])) as Partial<
    Record<EraId, T>
  >;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Optional and all-or-nothing: a missing file (an old cached bundle) or any
 * structurally invalid item (schema, ISO dates, http(s) source URLs) is an
 * empty board, never a throw and never a partially valid array.
 */
function loreFromBundle(file: unknown): LoreItem[] {
  const parsed = clownbotLoreBundleFileSchema.safeParse(file);
  if (!parsed.success) return [];
  const ok = parsed.data.lore.every(
    (i) =>
      ISO_DAY.test(i.date) &&
      ISO_DAY.test(i.lastCheckedOn) &&
      i.sources.every((s) => isHttpUrl(s.url)),
  );
  return ok ? (file as { lore: LoreItem[] }).lore : [];
}

/** Normalises a loaded bundle's files to the snapshot inputs. */
export function inputsFromBundle(bundle: BundleLike): ReaderSnapshotInputs {
  const f = bundle.files;
  const eras = (f.eras as Era[] | undefined) ?? [];
  const content = eras.flatMap(
    (e) => (f[`content:${e.id}`] as ContentBundleFile | undefined)?.items ?? [],
  );
  return {
    eras,
    content: content as ContentItem[],
    milestones: (f.milestones as Milestone[] | undefined) ?? [],
    tracks: perEra(f.tracks as TracksBundleFile[] | undefined, (x) => x.tracks as TrackNote[]),
    theories: perEra(
      f.theories as TheoriesBundleFile[] | undefined,
      (x) => x.theories as TheoryNote[],
    ),
    videos: perEra(f.videos as VideosBundleFile[] | undefined, (x) => x.videos as VideoNote[]),
    eraSecrets: perEra(
      f.eraSecrets as EraSecretsBundleFile[] | undefined,
      (x) => x.secrets as EraSecret[],
    ),
    merch: f.merch as MerchCatalogue,
    songMoods: (f.songMoods as SongMoodsBundleFile | undefined)?.songs ?? [],
    lore: loreFromBundle(f.clownbotLore),
  };
}

/** Loader outcome to snapshot state: last-good-after-data-error is `error` (last-good shown, refresh failed). */
function stateFromBundle(bundle: BundleLike): ReaderSnapshotState {
  if (bundle.source === LOAD_SOURCE.offlineLastGood) return 'offline';
  if (bundle.source === LOAD_SOURCE.lastGoodAfterDataError) return 'error';
  return bundle.stale ? 'stale' : 'ready';
}

/** App path, core only: a loaded D1 bundle without the merch and songMoods domains. */
export function fromBundleCore(bundle: BundleLike, deps: ReaderSnapshotDeps): ReaderSnapshotCore {
  return buildReaderSnapshotCore(
    inputsFromBundle(bundle),
    deps,
    { kind: 'bundle', bundleVersion: bundle.manifest.bundleVersion },
    stateFromBundle(bundle),
  );
}

/** The extension domains of a loaded bundle, for `attachExtensions`. */
export function extensionsFromBundle(bundle: BundleLike): ReaderSnapshotExtensions {
  const { merch, songMoods, lore } = inputsFromBundle(bundle);
  return { merch, songMoods, lore };
}

/** App path, core + extensions in ONE traversal of the bundle (`inputsFromBundle` runs once, not once per half). */
export function snapshotPartsFromBundle(
  bundle: BundleLike,
  deps: ReaderSnapshotDeps,
): { core: ReaderSnapshotCore; extensions: ReaderSnapshotExtensions } {
  const inputs = inputsFromBundle(bundle);
  const core = buildReaderSnapshotCore(
    inputs,
    deps,
    { kind: 'bundle', bundleVersion: bundle.manifest.bundleVersion },
    stateFromBundle(bundle),
  );
  return { core, extensions: { merch: inputs.merch, songMoods: inputs.songMoods, lore: inputs.lore } };
}

/** App path: builds from a loaded D1 bundle; reads only the bundle, no module-global provider. */
export function fromBundle(bundle: BundleLike, deps: ReaderSnapshotDeps): ReaderSnapshot {
  const inputs = inputsFromBundle(bundle);
  const state = stateFromBundle(bundle);
  return buildReaderSnapshot(
    inputs,
    deps,
    { kind: 'bundle', bundleVersion: bundle.manifest.bundleVersion },
    state,
  );
}
