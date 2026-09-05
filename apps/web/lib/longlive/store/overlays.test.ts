import { describe, expect, it } from 'vitest';
import { overlaysReducer, overlaysInitialState } from './overlays';
import { CURRENT_ERA_ID, ERAS } from '../eras';
import type { MotifId } from '../types';

const eraA = CURRENT_ERA_ID;
const eraB = ERAS[0].id;

describe('overlaysReducer', () => {
  it('has the expected initial state', () => {
    expect(overlaysInitialState()).toEqual({
      openItemId: null,
      trackGuideEraId: null,
      openTrackKey: null,
      theoryGuideEraId: null,
      theoryGuideHighlightSlug: null,
      clueWebTrail: null,
      pendingVideoAnchor: null,
    });
  });

  it('openItem/closeItem set and clear openItemId', () => {
    const start = overlaysInitialState();
    const opened = overlaysReducer(start, { type: 'openItem', id: 'moment-1' });
    expect(opened.openItemId).toBe('moment-1');
    const closed = overlaysReducer(opened, { type: 'openItem', id: null });
    expect(closed.openItemId).toBeNull();
  });

  it('openTrackGuide closes the theory guide (mutually exclusive overlays)', () => {
    const start = {
      ...overlaysInitialState(),
      theoryGuideEraId: eraB as never,
      theoryGuideHighlightSlug: 'egg-1',
      openTrackKey: 'stale-key',
    };
    const next = overlaysReducer(start, { type: 'openTrackGuide', eraId: eraA as never });
    expect(next.trackGuideEraId).toBe(eraA);
    expect(next.theoryGuideEraId).toBeNull();
    expect(next.openTrackKey).toBeNull();
  });

  it('closeTrackGuide clears both track guide and track key', () => {
    const start = { ...overlaysInitialState(), trackGuideEraId: eraA as never, openTrackKey: 'k' };
    const next = overlaysReducer(start, { type: 'closeTrackGuide' });
    expect(next.trackGuideEraId).toBeNull();
    expect(next.openTrackKey).toBeNull();
  });

  it('openTrack / closeTrack set and clear the track key only', () => {
    const start = overlaysInitialState();
    const opened = overlaysReducer(start, { type: 'openTrack', key: 'era::1::Song' });
    expect(opened.openTrackKey).toBe('era::1::Song');
    const closed = overlaysReducer(opened, { type: 'openTrack', key: null });
    expect(closed.openTrackKey).toBeNull();
  });

  it('openSong retargets the guide era and opens the track, closing theory guide', () => {
    const start = { ...overlaysInitialState(), theoryGuideEraId: eraB as never };
    const next = overlaysReducer(start, { type: 'openSong', eraId: eraA as never, key: 'k' });
    expect(next.trackGuideEraId).toBe(eraA);
    expect(next.openTrackKey).toBe('k');
    expect(next.theoryGuideEraId).toBeNull();
  });

  it('openTheoryGuide closes the track guide overlay (but not a stacked track key) and sets an optional highlight slug', () => {
    const start = { ...overlaysInitialState(), trackGuideEraId: eraA as never, openTrackKey: 'k' };
    const next = overlaysReducer(start, {
      type: 'openTheoryGuide',
      eraId: eraB as never,
      highlightSlug: 'egg-1',
    });
    expect(next.theoryGuideEraId).toBe(eraB);
    expect(next.theoryGuideHighlightSlug).toBe('egg-1');
    expect(next.trackGuideEraId).toBeNull();
    // Matches original store.tsx behaviour: openTheoryGuide never touched openTrackKey.
    expect(next.openTrackKey).toBe('k');
  });

  it('closeTheoryGuide clears both the guide era and the highlight slug', () => {
    const start = {
      ...overlaysInitialState(),
      theoryGuideEraId: eraA as never,
      theoryGuideHighlightSlug: 'egg-1',
    };
    const next = overlaysReducer(start, { type: 'closeTheoryGuide' });
    expect(next.theoryGuideEraId).toBeNull();
    expect(next.theoryGuideHighlightSlug).toBeNull();
  });

  it('setClueWebTrail / setPendingVideoAnchor are independent fields', () => {
    const start = overlaysInitialState();
    const withTrail = overlaysReducer(start, { type: 'setClueWebTrail', motif: 'clock' as MotifId });
    expect(withTrail.clueWebTrail).toBe('clock');
    const withAnchor = overlaysReducer(withTrail, {
      type: 'setPendingVideoAnchor',
      anchor: 'era-video-x',
    });
    expect(withAnchor.pendingVideoAnchor).toBe('era-video-x');
    expect(withAnchor.clueWebTrail).toBe('clock');
  });

  it('closeAll clears the moment/track-guide/theory-guide overlays but leaves clue-web/video anchor alone', () => {
    const start = {
      ...overlaysInitialState(),
      openItemId: 'm1',
      trackGuideEraId: eraA as never,
      theoryGuideEraId: eraB as never,
      clueWebTrail: 'clock' as MotifId,
      pendingVideoAnchor: 'era-video-x',
    };
    const next = overlaysReducer(start, { type: 'closeAll' });
    expect(next.openItemId).toBeNull();
    expect(next.trackGuideEraId).toBeNull();
    expect(next.theoryGuideEraId).toBeNull();
    expect(next.clueWebTrail).toBe('clock');
    expect(next.pendingVideoAnchor).toBe('era-video-x');
  });

  it('closeMomentAndEraGuides clears the moment + both era-hero guides but leaves openTrackKey/highlightSlug (openThread/openEra contract)', () => {
    const start = {
      ...overlaysInitialState(),
      openItemId: 'm1',
      trackGuideEraId: eraA as never,
      openTrackKey: 'k',
      theoryGuideEraId: eraB as never,
      theoryGuideHighlightSlug: 'egg-1',
    };
    const next = overlaysReducer(start, { type: 'closeMomentAndEraGuides' });
    expect(next.openItemId).toBeNull();
    expect(next.trackGuideEraId).toBeNull();
    expect(next.theoryGuideEraId).toBeNull();
    // Matches original store.tsx: openThread/openEra never cleared these two.
    expect(next.openTrackKey).toBe('k');
    expect(next.theoryGuideHighlightSlug).toBe('egg-1');
  });

  it('closeMomentOnly clears only the moment overlay (openCrossing contract)', () => {
    const start = {
      ...overlaysInitialState(),
      openItemId: 'm1',
      trackGuideEraId: eraA as never,
      theoryGuideEraId: eraB as never,
    };
    const next = overlaysReducer(start, { type: 'closeMomentOnly' });
    expect(next.openItemId).toBeNull();
    expect(next.trackGuideEraId).toBe(eraA);
    expect(next.theoryGuideEraId).toBe(eraB);
  });
});
