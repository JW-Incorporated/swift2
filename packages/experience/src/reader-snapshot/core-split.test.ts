// The core/extension split: a core snapshot never carries merch or songMoods,
// attachExtensions yields exactly the full snapshot, and only that is hashable.
import { beforeAll, describe, expect, it } from 'vitest';
import { eraVideoFeed } from '@swift2/content-enrichment';
import { attachExtensions } from './build';
import { hashSnapshot } from './hash';
import { fromBaked, fromBakedCore, type BakedCoreModules, type BakedModules } from './sources';
import type { ReaderSnapshotCore } from './types';

const web = '../../../../apps/web/lib/longlive/';
const deps = { eraVideoFeed };

let full: BakedModules;
let core: ReaderSnapshotCore;

beforeAll(async () => {
  const [bm, bf] = await Promise.all([
    import(/* @vite-ignore */ `${web}baked-modules`),
    import(/* @vite-ignore */ `${web}baked-modules-full`),
  ]);
  full = (bf as { bakedModulesFull(): BakedModules }).bakedModulesFull();
  core = fromBakedCore((bm as { bakedModules(): BakedCoreModules }).bakedModules(), deps);
}, 120_000);

describe('core / extension split', () => {
  it('the core carries neither merch nor songMoods', () => {
    expect(Object.keys(core.domains)).not.toContain('merch');
    expect(Object.keys(core.domains)).not.toContain('songMoods');
  });

  it('attachExtensions(core) is the full snapshot, hash for hash', async () => {
    const attached = attachExtensions(core, { merch: full.MERCH_CATALOGUE, songMoods: full.SONG_MOODS, lore: [...full.LORE] });
    expect((await hashSnapshot(attached)).hash).toBe((await hashSnapshot(fromBaked(full, deps))).hash);
  });

  it('attachExtensions does not mutate the core', () => {
    const before = Object.keys(core.domains).sort();
    attachExtensions(core, { merch: full.MERCH_CATALOGUE, songMoods: full.SONG_MOODS, lore: [...full.LORE] });
    expect(Object.keys(core.domains).sort()).toEqual(before);
  });

  it('a core snapshot cannot be hashed', async () => {
    await expect(hashSnapshot(core as never)).rejects.toThrow(/merch, songMoods/);
  });
});
