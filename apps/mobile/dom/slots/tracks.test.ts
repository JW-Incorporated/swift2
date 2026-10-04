import { beforeEach, describe, expect, it } from 'vitest';
import { TrackDetail } from '@swift2/ui/reader/tracks/TrackDetail';
import { TrackGuide } from '@swift2/ui/reader/tracks/TrackGuide';
import { createSlotRegistry } from './registry';
import { resetSlotsForTests, slots } from './instance';

describe('tracks slice', () => {
  beforeEach(() => resetSlotsForTests());

  it('registers the guide before the song, directly from @swift2/ui, with no theory guide', async () => {
    const mod = await import('./tracks');
    expect(Object.keys(mod.TRACKS_SLOTS)).toEqual(['overlay:track-guide', 'overlay:song']);
    expect(mod.TRACKS_SLOTS['overlay:track-guide']).toBe(TrackGuide);
    expect(mod.TRACKS_SLOTS['overlay:song']).toBe(TrackDetail);
    expect(Object.keys(mod.TRACKS_SLOTS).some((k) => /theor/.test(k))).toBe(false);
  });

  it('registers into the app registry and is idempotent on re-register', async () => {
    const mod = await import('./tracks');
    const r = createSlotRegistry();
    r.register({ slice: mod.TRACKS_SLICE, slots: mod.TRACKS_SLOTS });
    r.register({ slice: mod.TRACKS_SLICE, slots: mod.TRACKS_SLOTS });
    expect(Object.keys(r.slots())).toEqual(['overlay:track-guide', 'overlay:song']);
    expect(Object.keys(slots())).toEqual([]);
  });
});
