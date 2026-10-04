// The extension half of `fill`: merch and songMoods, poured in only when the
// merch or mood modules are first required (see `loadReader`), never with the
// core domains. Same in-place semantics as `fill`.
import { setDefaultSongCatalogue } from '@swift2/experience';
import type { ReaderSnapshotExtensions } from '@swift2/experience/reader-snapshot';
import { MERCH_CATALOGUE } from './merch';
import { replaceArray } from './live';

export function fillExtensions(extensions: ReaderSnapshotExtensions): void {
  replaceArray(MERCH_CATALOGUE.shopTheLook, extensions.merch.shopTheLook);
  replaceArray(MERCH_CATALOGUE.officialStore, extensions.merch.officialStore);
  replaceArray(MERCH_CATALOGUE.fanMade, extensions.merch.fanMade);
  setDefaultSongCatalogue(extensions.songMoods);
}
