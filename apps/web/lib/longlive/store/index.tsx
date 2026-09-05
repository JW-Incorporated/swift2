'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { deepLinkTarget, resolveVideoDeepLink } from '@swift2/experience';
import { CURRENT_ERA_ID, getEra } from '@swift2/experience';
import { getContentItem } from '../content';
import { allVideoRecordsForEra, findVideoEraId } from '../videos';
import { THREADS } from '@swift2/experience';
import { resolveTrackKey } from '../tracks';
import { createLocalStorageAdapter } from '../local-storage-adapter';
import {
  emptyProgress,
  readStoredProgress,
  withAdded,
  withToggled,
  writeStoredProgress,
  type Progress,
} from '@swift2/experience';
import type { FilterId } from '@swift2/experience';
import type { EraId, LensId, MotifId } from '@swift2/experience';
import type { ClownAnswer } from '../clown-answer';

import { useNavigation, type AppMode, type EraScrollSnapshot } from './navigation';
import { useReturnPoints, type ReturnPoint } from './return-points';
import { useOverlays } from './overlays';
import { useSearchShare, type ShareTarget, type ClownMessage } from './search-share';

export type { AppMode, EraScrollSnapshot } from './navigation';
export type { ReturnPoint } from './return-points';
export type { ShareTarget, ClownMessage } from './search-share';

export interface AppState {
  mode: AppMode;
  /** The era currently driving theming, the top bar, and the scrubber. */
  eraId: EraId;
  eraJumpSeq: number;
  /** Selected thread, or null on the Threads landing gallery. */
  lensId: LensId | null;
  crossing: { a: LensId; b: LensId } | null;
  /** Currently open content item id (immersive detail), or null. */
  openItemId: string | null;
  /** Era whose album track guide overlay is open, or null. */
  trackGuideEraId: EraId | null;
  openTrackKey: string | null;
  /** Era whose theories/easter-eggs overlay is open, or null. */
  theoryGuideEraId: EraId | null;
  theoryGuideHighlightSlug: string | null;
  /** Whether the era selector overlay is open. */
  selectorOpen: boolean;
  scrubbing: boolean;
  /** Whether the search overlay is open. */
  searchOpen: boolean;
  /** Whether the share sheet is open, and for what target. */
  share: ShareTarget | null;
  clueWebTrail: MotifId | null;
  pendingVideoAnchor: string | null;
  /** Active global timeline filter chips. Empty = show everything (P1). */
  filters: ReadonlySet<FilterId>;
  clownMessages: ClownMessage[];
  clownChatExpanded: boolean;
}

interface AppActions {
  /** Reset to the main screen: era mode, current era, all overlays closed. */
  goHome: () => void;
  setMode: (m: AppMode) => void;
  /** Explicit jump to an era (re-anchors + scrolls the stream to top). */
  setEra: (id: EraId) => void;
  /** Scroll-driven active-era change (theming only; does not re-anchor). */
  setActiveEra: (id: EraId) => void;
  /** Open a specific thread. */
  setLens: (id: LensId) => void;
  /** Return to the Threads landing gallery. */
  clearLens: () => void;
  /** Pivot from an era into a thread (switches to threads mode). */
  openThread: (id: LensId) => void;
  openClueWebTrail: (motif: MotifId) => void;
  clearClueWebTrail: () => void;
  /** Pivot from a thread back into an era (switches to era mode + jumps). */
  openEra: (id: EraId) => void;
  openCrossing: (a: LensId, b: LensId) => void;
  closeCrossing: () => void;
  openItem: (id: string) => void;
  closeItem: () => void;
  openTrackGuide: (id: EraId) => void;
  closeTrackGuide: () => void;
  openTrack: (key: string) => void;
  closeTrack: () => void;
  openSong: (eraId: EraId, key: string) => void;
  openVideo: (eraId: EraId, videoId: string) => void;
  clearPendingVideoAnchor: () => void;
  openTheoryGuide: (id: EraId, highlightSlug?: string) => void;
  closeTheoryGuide: () => void;
  saveEraScroll: (snap: EraScrollSnapshot) => void;
  getEraScroll: () => EraScrollSnapshot | null;
  clearEraScroll: () => void;
  setSelectorOpen: (open: boolean) => void;
  setScrubbing: (v: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  openShare: (t: ShareTarget) => void;
  closeShare: () => void;
  toggleFilter: (id: FilterId) => void;
  clearFilters: () => void;
  pushReturnPoint: (p: ReturnPoint) => void;
  popReturnPoint: () => ReturnPoint | null;
  addClownMessage: (question: string, answer: ClownAnswer) => void;
  clearClownMessages: () => void;
  setClownChatExpanded: (v: boolean) => void;
}

/**
 * Exploration progress (visited moments, seen eggs/trails, favorites) —
 * persisted to localStorage, in its own context pair so the low-frequency
 * "mark seen" writes don't re-render everything hanging off AppState.
 */
export interface ProgressState {
  progress: Progress;
  hydrated: boolean;
}

export interface ProgressActions {
  markMomentVisited: (id: string) => void;
  markEggsSeen: (ids: readonly string[]) => void;
  markTrailSeen: (motif: MotifId) => void;
  toggleFavorite: (id: string) => void;
}

const StateCtx = createContext<AppState | null>(null);
const ActionsCtx = createContext<AppActions | null>(null);
const ProgressStateCtx = createContext<ProgressState | null>(null);
const ProgressActionsCtx = createContext<ProgressActions | null>(null);

/**
 * SSR-safe persistence, following the TimelineScrubber hint-flag pattern:
 * first render (server AND client) is always empty progress, the real blob is
 * read in a mount effect, and every subsequent change is written back. If
 * localStorage is unavailable (private mode), reads/writes silently no-op and
 * the session simply isn't remembered.
 */
function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [hydrated, setHydrated] = useState(false);
  // Injected adapter (OS-025): stable across renders, created once — the
  // module itself is renderer-agnostic and knows nothing about localStorage.
  const storage = useMemo(() => createLocalStorageAdapter(), []);

  useEffect(() => {
    setProgress(readStoredProgress(storage));
    setHydrated(true);
  }, [storage]);

  useEffect(() => {
    if (hydrated) writeStoredProgress(storage, progress);
  }, [progress, hydrated, storage]);

  const actions = useMemo<ProgressActions>(
    () => ({
      markMomentVisited: (id) =>
        setProgress((p) => {
          const moments = withAdded(p.moments, [id]);
          return moments === p.moments ? p : { ...p, moments };
        }),
      markEggsSeen: (ids) =>
        setProgress((p) => {
          const eggs = withAdded(p.eggs, ids);
          return eggs === p.eggs ? p : { ...p, eggs };
        }),
      markTrailSeen: (motif) =>
        setProgress((p) => {
          const trails = withAdded(p.trails, [motif]);
          return trails === p.trails ? p : { ...p, trails };
        }),
      toggleFavorite: (id) =>
        setProgress((p) => ({ ...p, favorites: withToggled(p.favorites, id) })),
    }),
    [],
  );

  const state = useMemo<ProgressState>(() => ({ progress, hydrated }), [progress, hydrated]);

  return (
    <ProgressStateCtx.Provider value={state}>
      <ProgressActionsCtx.Provider value={actions}>{children}</ProgressActionsCtx.Provider>
    </ProgressStateCtx.Provider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const returnPoints = useReturnPoints();
  const nav = useNavigation(CURRENT_ERA_ID, returnPoints.consumeMatching);
  const searchShare = useSearchShare();
  const overlays = useOverlays();

  // Cross-slice composition: several nav-slice pivots also close overlays
  // this slice doesn't own (the original store.tsx did this inline in one
  // component). Each wrapper below reproduces that exact original field set.
  const openThread = useCallback(
    (id: LensId) => {
      nav.openThread(id);
      overlays.closeMomentAndEraGuides();
    },
    [nav.openThread, overlays.closeMomentAndEraGuides],
  );

  const openEra = useCallback(
    (id: EraId) => {
      nav.openEra(id);
      overlays.closeMomentAndEraGuides();
    },
    [nav.openEra, overlays.closeMomentAndEraGuides],
  );

  const openCrossing = useCallback(
    (a: LensId, b: LensId) => {
      nav.openCrossing(a, b);
      overlays.closeMomentOnly();
    },
    [nav.openCrossing, overlays.closeMomentOnly],
  );

  // The Clue Web lives inside the 'easter-eggs' thread; a cross-link jump is
  // openThread plus a pending trail focus that ClueWeb consumes on landing.
  const openClueWebTrail = useCallback(
    (motif: MotifId) => {
      overlays.setClueWebTrail(motif);
      openThread('easter-eggs' as LensId);
    },
    [overlays.setClueWebTrail, openThread],
  );

  const openVideo = useCallback(
    (eraId: EraId, videoId: string) => {
      openEra(eraId);
      // Ensures the target video's card is actually in the filtered feed —
      // an active filter unrelated to the video's own tags would otherwise
      // hide the very card we're about to scroll for.
      searchShare.clearFilters();
      overlays.openVideo(eraId, videoId);
    },
    [openEra, searchShare.clearFilters, overlays.openVideo],
  );

  const goHome = useCallback(() => {
    // Home is now (R1, PLAN.md 2026-08-14): the current era, top of the stream
    // — no separate front door. Mirrors setEra's re-anchor (bump eraJumpSeq) so
    // the jump fires even when already in era mode, e.g. the OriginCap
    // "Return to now" button, where EraStream never remounts.
    nav.goHome(CURRENT_ERA_ID);
    overlays.closeAllOverlays();
    searchShare.closeSearchAndShare();
  }, [nav.goHome, overlays.closeAllOverlays, searchShare.closeSearchAndShare]);

  // Deep link support: a shared URL (?item=, ?lens=, ?era=, or ?mode= —
  // #2105) lands the visitor on the shared target instead of the front-door
  // era stream. One-time read on mount — ongoing navigation stays
  // state-only, not URL-synced.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const target = deepLinkTarget(
      window.location.search,
      THREADS.map((t) => t.id),
    );
    if (!target) return;
    // A deep link is the visitor's FIRST state, not a navigation away from
    // one — pushing a back-entry here would trap the first back gesture.
    nav.suppressNavPushRef.current = true;
    if (target.kind === 'item') {
      if (getContentItem(target.id)) {
        // The moment overlay reads over the era stream.
        overlays.openItem(target.id);
      } else {
        // Not a moment id — resolve it as a video slug instead (#3312). A
        // still-unresolved id falls through to the front door, same as a bad
        // moment id always has.
        const eraHint = new URLSearchParams(window.location.search).get('era');
        const videoEraId = resolveVideoDeepLink(
          target.id,
          eraHint,
          (id) => getEra(id).id === id,
          (eraId, slug) => allVideoRecordsForEra(eraId as EraId).some((v) => v.slug === slug),
          findVideoEraId,
        );
        if (videoEraId) {
          // Mirrors the `openVideo` action (defined below) exactly: jump to
          // the video's era, clear filters so its card can't be hidden, and
          // queue the scroll-to-card anchor EraStream consumes on mount.
          openVideo(videoEraId as EraId, target.id);
        }
      }
    } else if (target.kind === 'song') {
      // The song dossier stacks on top of its album's track guide, so open
      // both — same state openSong sets. A stale key resolves to null; drop it
      // and fall through to the front door rather than open an empty overlay.
      const resolved = resolveTrackKey(target.key);
      if (resolved) {
        overlays.openTrackGuide(resolved.eraId);
        overlays.openTrack(target.key);
      }
    } else if (target.kind === 'guide') {
      // Open the album track guide over the era stream. getEra round-trips a
      // real id (it falls back to the newest era for a bad one); reject the
      // fallback so a mangled ?guide= can't open the wrong album.
      const eraId = getEra(target.eraId).id;
      if (eraId === target.eraId) {
        overlays.openTrackGuide(eraId);
      }
    } else if (target.kind === 'theories') {
      const eraId = getEra(target.eraId).id;
      if (eraId === target.eraId) {
        overlays.openTheoryGuide(eraId);
      }
    } else if (target.kind === 'lens') {
      openThread(target.id as LensId);
    } else if (target.kind === 'mode') {
      // Threads gallery / Mood / Clownbot / Community / Merch: land on the
      // bare surface — every other piece of state is still at its
      // fresh-load default this early in mount, so setting the mode alone
      // is enough (#2105).
      nav.setMode(target.mode);
    } else {
      nav.setEra(target.id as EraId);
    }
    nav.suppressNavPushRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions = useMemo<AppActions>(
    () => ({
      goHome,
      setMode: nav.setMode,
      setEra: nav.setEra,
      setActiveEra: nav.setActiveEra,
      setLens: nav.setLensId,
      clearLens: () => nav.setLensId(null),
      openThread,
      openEra,
      openClueWebTrail,
      clearClueWebTrail: overlays.clearClueWebTrail,
      openCrossing,
      closeCrossing: nav.closeCrossing,
      openItem: overlays.openItem,
      closeItem: overlays.closeItem,
      openTrackGuide: overlays.openTrackGuide,
      closeTrackGuide: overlays.closeTrackGuide,
      openTrack: overlays.openTrack,
      closeTrack: overlays.closeTrack,
      openSong: overlays.openSong,
      openVideo,
      clearPendingVideoAnchor: overlays.clearPendingVideoAnchor,
      openTheoryGuide: overlays.openTheoryGuide,
      closeTheoryGuide: overlays.closeTheoryGuide,
      saveEraScroll: nav.saveEraScroll,
      getEraScroll: nav.getEraScroll,
      clearEraScroll: nav.clearEraScroll,
      setSelectorOpen: nav.setSelectorOpen,
      setScrubbing: nav.setScrubbing,
      setSearchOpen: searchShare.setSearchOpen,
      openShare: searchShare.openShare,
      closeShare: searchShare.closeShare,
      toggleFilter: searchShare.toggleFilter,
      clearFilters: searchShare.clearFilters,
      pushReturnPoint: returnPoints.pushReturnPoint,
      popReturnPoint: returnPoints.popReturnPoint,
      addClownMessage: searchShare.addClownMessage,
      clearClownMessages: searchShare.clearClownMessages,
      setClownChatExpanded: searchShare.setClownChatExpanded,
    }),
    [
      goHome,
      nav.setMode,
      nav.setEra,
      nav.setActiveEra,
      nav.setLensId,
      openThread,
      openEra,
      openClueWebTrail,
      overlays.clearClueWebTrail,
      openCrossing,
      nav.closeCrossing,
      overlays.openItem,
      overlays.closeItem,
      overlays.openTrackGuide,
      overlays.closeTrackGuide,
      overlays.openTrack,
      overlays.closeTrack,
      overlays.openSong,
      openVideo,
      overlays.clearPendingVideoAnchor,
      overlays.openTheoryGuide,
      overlays.closeTheoryGuide,
      nav.saveEraScroll,
      nav.getEraScroll,
      nav.clearEraScroll,
      nav.setSelectorOpen,
      nav.setScrubbing,
      searchShare.setSearchOpen,
      searchShare.openShare,
      searchShare.closeShare,
      searchShare.toggleFilter,
      searchShare.clearFilters,
      returnPoints.pushReturnPoint,
      returnPoints.popReturnPoint,
      searchShare.addClownMessage,
      searchShare.clearClownMessages,
      searchShare.setClownChatExpanded,
    ],
  );

  const state = useMemo<AppState>(
    () => ({
      mode: nav.state.mode,
      eraId: nav.state.eraId,
      eraJumpSeq: nav.state.eraJumpSeq,
      lensId: nav.state.lensId,
      crossing: nav.state.crossing,
      openItemId: overlays.state.openItemId,
      trackGuideEraId: overlays.state.trackGuideEraId,
      openTrackKey: overlays.state.openTrackKey,
      theoryGuideEraId: overlays.state.theoryGuideEraId,
      theoryGuideHighlightSlug: overlays.state.theoryGuideHighlightSlug,
      selectorOpen: nav.state.selectorOpen,
      scrubbing: nav.state.scrubbing,
      searchOpen: searchShare.state.searchOpen,
      share: searchShare.state.share,
      clueWebTrail: overlays.state.clueWebTrail,
      pendingVideoAnchor: overlays.state.pendingVideoAnchor,
      filters: searchShare.state.filters,
      clownMessages: searchShare.state.clownMessages,
      clownChatExpanded: searchShare.state.clownChatExpanded,
    }),
    [nav.state, overlays.state, searchShare.state],
  );

  return (
    <StateCtx.Provider value={state}>
      <ActionsCtx.Provider value={actions}>
        <ProgressProvider>{children}</ProgressProvider>
      </ActionsCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(StateCtx);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

export function useAppActions(): AppActions {
  const ctx = useContext(ActionsCtx);
  if (!ctx) throw new Error('useAppActions must be used within AppProvider');
  return ctx;
}

export function useProgress(): ProgressState {
  const ctx = useContext(ProgressStateCtx);
  if (!ctx) throw new Error('useProgress must be used within AppProvider');
  return ctx;
}

export function useProgressActions(): ProgressActions {
  const ctx = useContext(ProgressActionsCtx);
  if (!ctx) throw new Error('useProgressActions must be used within AppProvider');
  return ctx;
}
