'use client';

import { useCallback, useReducer } from 'react';
import { getEra } from '../eras';
import type { EraId, MotifId } from '../types';

interface OverlaysState {
  /** Currently open content item id (immersive detail), or null. */
  openItemId: string | null;
  /** Era whose album track guide overlay is open, or null. */
  trackGuideEraId: EraId | null;
  /**
   * Currently open track detail (immersive per-song page), keyed as
   * `${eraId}::${trackNumber ?? 'x'}::${title}` (TrackNote has no stable id).
   * Stacks on top of the track guide overlay, or null when closed.
   */
  openTrackKey: string | null;
  /** Era whose theories/easter-eggs overlay is open, or null. */
  theoryGuideEraId: EraId | null;
  /**
   * Egg/theory slug to scroll to and highlight once TheoryGuide opens, or
   * null. Set alongside `theoryGuideEraId` by an egg doorway tap (R4 —
   * "egg/theory doorways open that single egg's detail") so the reader lands
   * on the one card they tapped, not just the era's guide in general.
   */
  theoryGuideHighlightSlug: string | null;
  /**
   * Pending Clue Web trail focus, set by cross-links (openClueWebTrail) so the
   * Clue Web opens directly on that motif's trail instead of its home screen.
   * Consumed (cleared) by ClueWeb once it lands there.
   */
  clueWebTrail: MotifId | null;
  /**
   * Pending video-card scroll target, set by `openVideo` (search's video
   * results — #652) as the exact `data-ll-item` value (`era-video-<slug>`)
   * to scroll to once it mounts in the era stream. EraStream consumes
   * (clears) it after a bounded poll; a video with no standalone card
   * (unplayable, or embedded inline in a moment — see search.ts) times out
   * and leaves the reader on the era, same as before this field existed.
   */
  pendingVideoAnchor: string | null;
}

type OverlaysAction =
  | { type: 'openItem'; id: string | null }
  | { type: 'openTrackGuide'; eraId: EraId }
  | { type: 'closeTrackGuide' }
  | { type: 'openTrack'; key: string | null }
  | { type: 'openSong'; eraId: EraId; key: string }
  | { type: 'openTheoryGuide'; eraId: EraId; highlightSlug: string | null }
  | { type: 'closeTheoryGuide' }
  | { type: 'setClueWebTrail'; motif: MotifId | null }
  | { type: 'setPendingVideoAnchor'; anchor: string | null }
  /**
   * Closes the moment overlay and both era-hero guide overlays, but leaves
   * `openTrackKey`/`theoryGuideHighlightSlug` untouched — the exact field
   * set `openThread`/`openEra`/`openCrossing` (moment only) closed inline
   * in the pre-split store.tsx (they never called `setOpenTrackKey(null)`
   * or cleared the highlight slug directly).
   */
  | { type: 'closeMomentAndEraGuides' }
  | { type: 'closeMomentOnly' }
  /** Bulk-close every overlay this slice owns (mode switches, goHome, etc). */
  | { type: 'closeAll' };

export function overlaysReducer(state: OverlaysState, action: OverlaysAction): OverlaysState {
  switch (action.type) {
    case 'openItem':
      return { ...state, openItemId: action.id };
    case 'openTrackGuide':
      // The two era-hero overlays are mutually exclusive — opening one always
      // closes the other so they can never stack.
      return {
        ...state,
        theoryGuideEraId: null,
        openTrackKey: null,
        trackGuideEraId: getEra(action.eraId).id,
      };
    case 'closeTrackGuide':
      return { ...state, openTrackKey: null, trackGuideEraId: null };
    case 'openTrack':
      return { ...state, openTrackKey: action.key };
    case 'openSong':
      return {
        ...state,
        theoryGuideEraId: null,
        trackGuideEraId: getEra(action.eraId).id,
        openTrackKey: action.key,
      };
    case 'openTheoryGuide':
      return {
        ...state,
        trackGuideEraId: null,
        theoryGuideEraId: getEra(action.eraId).id,
        theoryGuideHighlightSlug: action.highlightSlug,
      };
    case 'closeTheoryGuide':
      return { ...state, theoryGuideEraId: null, theoryGuideHighlightSlug: null };
    case 'setClueWebTrail':
      return { ...state, clueWebTrail: action.motif };
    case 'setPendingVideoAnchor':
      return { ...state, pendingVideoAnchor: action.anchor };
    case 'closeMomentAndEraGuides':
      return { ...state, openItemId: null, trackGuideEraId: null, theoryGuideEraId: null };
    case 'closeMomentOnly':
      return { ...state, openItemId: null };
    case 'closeAll':
      return {
        ...state,
        openItemId: null,
        trackGuideEraId: null,
        theoryGuideEraId: null,
      };
    default:
      return state;
  }
}

export function overlaysInitialState(): OverlaysState {
  return {
    openItemId: null,
    trackGuideEraId: null,
    openTrackKey: null,
    theoryGuideEraId: null,
    theoryGuideHighlightSlug: null,
    clueWebTrail: null,
    pendingVideoAnchor: null,
  };
}

/**
 * Owns every immersive-overlay id (moment detail, track guide/detail, theory
 * guide, clue-web trail focus, pending video scroll anchor). Exposes raw
 * per-field setters plus `closeAllOverlays` (clears openItemId/
 * trackGuideEraId/theoryGuideEraId together — the exact three fields
 * `goHome`/`openThread`/`openEra`/`openCrossing` closed inline in the
 * pre-split store.tsx). Composition with the navigation/search-share slices
 * (openThread also closing these overlays, openVideo pivoting through
 * openEra, openClueWebTrail pivoting through openThread) happens in the
 * top-level AppProvider (store/index.tsx), which owns all three slices and
 * can sequence cross-slice dispatches without a circular dependency here.
 */
export function useOverlays() {
  const [state, dispatch] = useReducer(overlaysReducer, undefined, overlaysInitialState);

  const openItem = useCallback((id: string) => dispatch({ type: 'openItem', id }), []);
  const closeItem = useCallback(() => dispatch({ type: 'openItem', id: null }), []);

  const openTrackGuide = useCallback((id: EraId) => dispatch({ type: 'openTrackGuide', eraId: id }), []);
  const closeTrackGuide = useCallback(() => dispatch({ type: 'closeTrackGuide' }), []);
  const openTrack = useCallback((key: string) => dispatch({ type: 'openTrack', key }), []);
  const closeTrack = useCallback(() => dispatch({ type: 'openTrack', key: null }), []);
  const openSong = useCallback(
    (eraId: EraId, key: string) => dispatch({ type: 'openSong', eraId, key }),
    [],
  );

  const openVideo = useCallback(
    (eraId: EraId, videoId: string) => dispatch({ type: 'setPendingVideoAnchor', anchor: `era-video-${videoId}` }),
    [],
  );
  const clearPendingVideoAnchor = useCallback(
    () => dispatch({ type: 'setPendingVideoAnchor', anchor: null }),
    [],
  );

  const openTheoryGuide = useCallback(
    (id: EraId, highlightSlug?: string) =>
      dispatch({ type: 'openTheoryGuide', eraId: id, highlightSlug: highlightSlug ?? null }),
    [],
  );
  const closeTheoryGuide = useCallback(() => dispatch({ type: 'closeTheoryGuide' }), []);

  const setClueWebTrail = useCallback((motif: MotifId | null) => dispatch({ type: 'setClueWebTrail', motif }), []);
  const clearClueWebTrail = useCallback(() => dispatch({ type: 'setClueWebTrail', motif: null }), []);

  const closeAllOverlays = useCallback(() => dispatch({ type: 'closeAll' }), []);
  const closeMomentAndEraGuides = useCallback(() => dispatch({ type: 'closeMomentAndEraGuides' }), []);
  const closeMomentOnly = useCallback(() => dispatch({ type: 'closeMomentOnly' }), []);

  return {
    state,
    dispatch,
    openItem,
    closeItem,
    openTrackGuide,
    closeTrackGuide,
    openTrack,
    closeTrack,
    openSong,
    openVideo,
    clearPendingVideoAnchor,
    openTheoryGuide,
    closeTheoryGuide,
    setClueWebTrail,
    clearClueWebTrail,
    closeAllOverlays,
    closeMomentAndEraGuides,
    closeMomentOnly,
  };
}
