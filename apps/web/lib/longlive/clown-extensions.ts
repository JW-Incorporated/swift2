import type { ReaderSnapshotExtensions } from '@swift2/experience/reader-snapshot';
import { LORE } from './clownbot-lore';

/** Stable module constant: ClownChat reads its lore from the snapshot via this; merch and moods are unused there. */
export const CLOWN_EXTENSIONS: ReaderSnapshotExtensions = {
  merch: { shopTheLook: [], officialStore: [], fanMade: [] },
  songMoods: [],
  lore: [...LORE],
};
