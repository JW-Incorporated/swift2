import type { ReaderSnapshotExtensions } from '@swift2/experience/reader-snapshot';
import { MERCH_CATALOGUE } from './merch';

/** Stable module constant: the merch chunk attaches this via ReaderExtensionsProvider. */
export const MERCH_EXTENSIONS: ReaderSnapshotExtensions = {
  merch: MERCH_CATALOGUE as ReaderSnapshotExtensions['merch'],
  songMoods: [],
  lore: [],
};
