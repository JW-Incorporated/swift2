'use client';

import { useCallback, useReducer, useRef } from 'react';
import { getEra } from '@swift2/experience';
import { pushBackEntry } from '../useBackDismiss';
import type { EraId, LensId } from '@swift2/experience';

export type AppMode = 'era' | 'threads' | 'mood' | 'clownbot' | 'community' | 'merch';

/**
 * A saved position in the era stream, captured when the user leaves era mode
 * (e.g. pivots into a thread) so we can drop them back exactly where they were.
 * Records the anchor era, how many older eras had been lazily appended, and the
 * raw window scroll offset.
 */
export interface EraScrollSnapshot {
  anchorId: EraId;
  count: number;
  scrollY: number;
}

export interface NavState {
  mode: AppMode;
  /** The era currently driving theming, the top bar, and the scrubber. */
  eraId: EraId;
  /**
   * Bumped whenever the user *explicitly* jumps to an era (selector, home).
   * The era stream watches this to re-anchor and scroll to the top — scroll-
   * driven active-era changes do NOT bump it, so they never reset the stream.
   */
  eraJumpSeq: number;
  /** Selected thread, or null on the Threads landing gallery. */
  lensId: LensId | null;
  /**
   * Active thread-crossing overlay (two threads on a shared axis), or null.
   * Only meaningful in threads mode; takes precedence over the gallery/thread.
   */
  crossing: { a: LensId; b: LensId } | null;
  /** Whether the era selector overlay is open. */
  selectorOpen: boolean;
  /**
   * True while the user is actively dragging the TimelineScrubber. EraStream's
   * scroll-driven active-era detection checks this and skips re-anchoring
   * while true — the scrubber's own auto-scroll can otherwise cross into the
   * next era's viewport-center mid-drag, flipping the active era (and with it
   * the scrubber's whole per-era anchor set) out from under the still-active
   * gesture, which reads as the rail jumping partway through a drag.
   */
  scrubbing: boolean;
}

export type NavSnapshot = Pick<NavState, 'mode' | 'eraId' | 'lensId' | 'crossing'>;

export type NavAction =
  | { type: 'setSelectorOpen'; open: boolean }
  | { type: 'setScrubbing'; v: boolean }
  /** Explicit jump to an era (re-anchors + scrolls the stream to top). */
  | { type: 'setEra'; eraId: EraId }
  /** Scroll-driven active-era change (theming only; does not re-anchor). */
  | { type: 'setActiveEra'; eraId: EraId }
  /** Mode switch; entering Threads always resets the thread selection. */
  | { type: 'setMode'; mode: AppMode }
  /** Pivot from an era into a thread (switches to threads mode). */
  | { type: 'openThread'; lensId: LensId }
  /** Pivot from a thread back into an era (switches to era mode + jumps). */
  | { type: 'openEra'; eraId: EraId }
  /** Raw lensId setter (no nav-history push) — `setLens`/`clearLens` actions. */
  | { type: 'setLensId'; lensId: LensId | null }
  /** Open the crossings overlay for a pair of threads. */
  | { type: 'openCrossing'; a: LensId; b: LensId }
  /** Close the crossings overlay (back to the thread gallery). */
  | { type: 'closeCrossing' }
  /** Reset to the main screen: era mode, current era. */
  | { type: 'goHome'; currentEraId: EraId }
  /** Restore a previously-pushed nav snapshot (back-gesture undo). */
  | { type: 'restoreNav'; prev: NavSnapshot; bumpJump: boolean };

export function navReducer(state: NavState, action: NavAction): NavState {
  switch (action.type) {
    case 'setSelectorOpen':
      return { ...state, selectorOpen: action.open };
    case 'setScrubbing':
      return { ...state, scrubbing: action.v };
    case 'setEra':
      return {
        ...state,
        mode: 'era',
        eraId: action.eraId,
        selectorOpen: false,
        eraJumpSeq: state.eraJumpSeq + 1,
      };
    case 'setActiveEra':
      return state.eraId === action.eraId ? state : { ...state, eraId: action.eraId };
    case 'setMode':
      return action.mode === 'threads'
        ? { ...state, mode: action.mode, lensId: null, crossing: null }
        : { ...state, mode: action.mode };
    case 'openThread':
      return {
        ...state,
        mode: 'threads',
        crossing: null,
        lensId: action.lensId,
        selectorOpen: false,
      };
    case 'openEra':
      return {
        ...state,
        mode: 'era',
        eraId: action.eraId,
        eraJumpSeq: state.eraJumpSeq + 1,
        lensId: null,
        crossing: null,
        selectorOpen: false,
      };
    case 'setLensId':
      return { ...state, lensId: action.lensId };
    case 'openCrossing':
      return { ...state, mode: 'threads', lensId: null, crossing: { a: action.a, b: action.b } };
    case 'closeCrossing':
      return { ...state, crossing: null };
    case 'goHome':
      return {
        ...state,
        mode: 'era',
        eraId: action.currentEraId,
        eraJumpSeq: state.eraJumpSeq + 1,
        lensId: null,
        crossing: null,
        selectorOpen: false,
      };
    case 'restoreNav':
      return {
        ...state,
        mode: action.prev.mode,
        eraId: action.prev.eraId,
        lensId: action.prev.lensId,
        crossing: action.prev.crossing,
        eraJumpSeq: action.bumpJump ? state.eraJumpSeq + 1 : state.eraJumpSeq,
      };
    default:
      return state;
  }
}

export function navInitialState(currentEraId: EraId): NavState {
  return {
    mode: 'era',
    eraId: currentEraId,
    eraJumpSeq: 0,
    lensId: null,
    crossing: null,
    selectorOpen: false,
    scrubbing: false,
  };
}

/**
 * Owns navigation state (mode/era/lens/crossing/selector/scrubbing) plus the
 * imperative machinery around it: the era-stream scroll snapshot, and the
 * back-gesture nav-history stack (P3 step 16 — a top-level navigation pushes
 * one history entry so mobile back-swipe undoes it instead of leaving the
 * app).
 *
 * `consumeReturnPoint` is injected by the composing AppProvider (it lives on
 * the return-points slice) rather than owned here — a nav restore consumes a
 * matching doorway return point, but the stack itself is that slice's state.
 */
export function useNavigation(
  currentEraId: EraId,
  consumeReturnPoint: (prev: NavSnapshot) => { scrollY: number } | null,
) {
  const [state, dispatch] = useReducer(navReducer, currentEraId, navInitialState);

  // Era-stream position to restore on the next era-mode entry. Held in a ref so
  // saving/reading it never triggers a render (the stream reads it imperatively
  // on mount). Explicit jumps clear it so they always land at the top.
  const eraScrollRef = useRef<EraScrollSnapshot | null>(null);
  const saveEraScroll = useCallback((snap: EraScrollSnapshot) => {
    eraScrollRef.current = snap;
  }, []);
  const getEraScroll = useCallback(() => eraScrollRef.current, []);
  const clearEraScroll = useCallback(() => {
    eraScrollRef.current = null;
  }, []);

  // Top-level navigations (era jumps, mode switches, thread opens) are pure
  // state — without a history entry the mobile back-swipe leaves the app
  // (Joey, 2026-07-15: "swiping back still takes me out of the app on many
  // screens"). Each pushes one entry that restores the pre-navigation state;
  // the module-level stack in useBackDismiss keeps LIFO order with overlays.
  const navStateRef = useRef<NavSnapshot>({
    mode: state.mode,
    eraId: state.eraId,
    lensId: state.lensId,
    crossing: state.crossing,
  });
  navStateRef.current = {
    mode: state.mode,
    eraId: state.eraId,
    lensId: state.lensId,
    crossing: state.crossing,
  };
  const suppressNavPushRef = useRef(false);

  const restoreNav = useCallback(
    (prev: NavSnapshot) => {
      suppressNavPushRef.current = true;
      const bumpJump = prev.mode === 'era' && eraScrollRef.current == null;
      dispatch({ type: 'restoreNav', prev, bumpJump });
      // Doorway back-to-position (P3 step 16): consume the top ReturnPoint only
      // when this restore reaches its origin. Unrelated navigation can sit above
      // a doorway's nav entry, so a mismatch must remain for a later restore.
      const rp = consumeReturnPoint(prev);
      if (rp && typeof window !== 'undefined') {
        requestAnimationFrame(() => window.scrollTo({ top: rp.scrollY, behavior: 'auto' }));
      }
      suppressNavPushRef.current = false;
    },
    [consumeReturnPoint],
  );

  const pushNav = useCallback(() => {
    if (suppressNavPushRef.current) return;
    const prev = { ...navStateRef.current };
    pushBackEntry(() => restoreNav(prev));
  }, [restoreNav]);

  const setEra = useCallback(
    (id: EraId) => {
      const valid = getEra(id).id;
      const cur = navStateRef.current;
      if (valid !== cur.eraId || cur.mode !== 'era') pushNav();
      clearEraScroll();
      dispatch({ type: 'setEra', eraId: valid });
    },
    [clearEraScroll, pushNav],
  );

  const setActiveEra = useCallback((id: EraId) => {
    // Theming-only update from scroll; guard to avoid needless renders.
    dispatch({ type: 'setActiveEra', eraId: getEra(id).id });
  }, []);

  const setMode = useCallback(
    (m: AppMode) => {
      if (m !== navStateRef.current.mode) pushNav();
      dispatch({ type: 'setMode', mode: m });
    },
    [pushNav],
  );

  const openThread = useCallback(
    (id: LensId) => {
      const cur = navStateRef.current;
      if (!(cur.mode === 'threads' && cur.lensId === id && !cur.crossing)) pushNav();
      dispatch({ type: 'openThread', lensId: id });
    },
    [pushNav],
  );

  const openEra = useCallback(
    (id: EraId) => {
      const valid = getEra(id).id;
      const cur = navStateRef.current;
      if (cur.mode !== 'era' || valid !== cur.eraId) pushNav();
      clearEraScroll();
      dispatch({ type: 'openEra', eraId: valid });
    },
    [clearEraScroll, pushNav],
  );

  const openCrossing = useCallback((a: LensId, b: LensId) => {
    dispatch({ type: 'openCrossing', a, b });
  }, []);

  const closeCrossing = useCallback(() => dispatch({ type: 'closeCrossing' }), []);

  const goHome = useCallback(
    (currentEraId2: EraId) => {
      clearEraScroll();
      dispatch({ type: 'goHome', currentEraId: currentEraId2 });
    },
    [clearEraScroll],
  );

  const setSelectorOpen = useCallback((open: boolean) => dispatch({ type: 'setSelectorOpen', open }), []);
  const setScrubbing = useCallback((v: boolean) => dispatch({ type: 'setScrubbing', v }), []);
  const setLensId = useCallback((id: LensId | null) => dispatch({ type: 'setLensId', lensId: id }), []);

  return {
    state,
    navStateRef,
    suppressNavPushRef,
    setEra,
    setActiveEra,
    setMode,
    openThread,
    openEra,
    openCrossing,
    closeCrossing,
    goHome,
    pushNav,
    saveEraScroll,
    getEraScroll,
    clearEraScroll,
    setSelectorOpen,
    setScrubbing,
    setLensId,
  };
}
