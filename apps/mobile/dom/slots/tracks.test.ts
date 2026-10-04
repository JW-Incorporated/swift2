import { beforeEach, describe, expect, it } from 'vitest';
import { TrackDetail } from '@swift2/ui/reader/tracks/TrackDetail';
import { TrackGuide } from '@swift2/ui/reader/tracks/TrackGuide';
import { register, resetSlotsForTests, slots } from './instance';
import { buildReaderSlots } from './reader-slots';
import { TRACKS_SLICE, TRACKS_SLOTS } from './tracks';

const C = (name: string) => Object.assign(() => null, { displayName: name });
const app = { overlays: [C('bridge'), C('fallback-overlay')], fallback: C('mode-fallback') };

describe('tracks slice', () => {
  beforeEach(() => resetSlotsForTests());

  it('registers the guide before the song, directly from @swift2/ui, with no theory guide', () => {
    expect(Object.keys(TRACKS_SLOTS)).toEqual(['overlay:track-guide', 'overlay:song']);
    expect(TRACKS_SLOTS['overlay:track-guide']).toBe(TrackGuide);
    expect(TRACKS_SLOTS['overlay:song']).toBe(TrackDetail);
    expect(Object.keys(TRACKS_SLOTS).some((k) => /theor/.test(k))).toBe(false);
  });

  it('stacks the song over the guide in ReaderSlots.overlays and re-registers idempotently', () => {
    register({ slice: TRACKS_SLICE, slots: TRACKS_SLOTS });
    register({ slice: TRACKS_SLICE, slots: TRACKS_SLOTS });
    expect(buildReaderSlots(slots(), app).overlays.slice(2)).toEqual([TrackGuide, TrackDetail]);
  });
});
