'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { deepLinkTarget } from './deepLink';
import { CURRENT_ERA_ID, getEra } from './eras';
import { THREADS } from './lenses';
import { resolveTrackKey } from './tracks';
import {
  emptyProgress,
  readStoredProgress,
  withAdded,
  withToggled,
  writeStoredProgress,
  type Progress,
} from './progress';
import { pushBackEntry } from './useBackDismiss';
import type { EraId, LensId, MotifId } from './types';

export type AppMode = 'landing' | 'era' | 'threads' | 'mood' | 'clownbot';

interface AppState {
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
  /** Whether the search overlay is open. */
  searchOpen: boolean;
  /** Whether the share sheet is open, and for what target. */
  share: ShareTarget | null;
  /**
   * Pending Clue Web trail focus, set by cross-links (openClueWebTrail) so the
   * Clue Web opens directly on that motif's trail instead of its home screen.
   * Consumed (cleared) by ClueWeb once it lands there.
   */
  clueWebTrail: MotifId | null;
}

export type ShareTarget =
  | { kind: 'era'; eraId: EraId }
  | { kind: 'lens'; lensId: LensId }
  | { kind: 'item'; itemId: string }
  // #707 — every immersive overlay is now shareable. A `track` carries the
  // composite trackKey that reopens the song dossier (over its album guide);
  // `trackGuide`/`theoryGuide` reopen the per-era guides; `site` is the bare
  // front door (the landing page, which has no more specific target).
  | { kind: 'track'; eraId: EraId; trackKey: string }
  | { kind: 'trackGuide'; eraId: EraId }
  | { kind: 'theoryGuide'; eraId: EraId }
  | { kind: 'site' };

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
  /**
   * Pivot from anywhere into the Clue Web, landing directly on one motif's
   * trail (a cross-link jump — e.g. a moment's "follow this thread").
   */
  openClueWebTrail: (motif: MotifId) => void;
  /** Consume the pending trail focus (called by ClueWeb after landing). */
  clearClueWebTrail: () => void;
  /** Pivot from a thread back into an era (switches to era mode + jumps). */
  openEra: (id: EraId) => void;
  /** Open the crossings overlay for a pair of threads. */
  openCrossing: (a: LensId, b: LensId) => void;
  /** Close the crossings overlay (back to the thread gallery). */
  closeCrossing: () => void;
  openItem: (id: string) => void;
  closeItem: () => void;
  /** Open the album track guide overlay for an era. */
  openTrackGuide: (id: EraId) => void;
  closeTrackGuide: () => void;
  /** Open a single song's detail page (stacks on top of the track guide). */
  openTrack: (key: string) => void;
  closeTrack: () => void;
  /**
   * Jump straight to a song's detail page in a specific era — the song-to-song
   * connection hop (issue #440 §10). Unlike openTrack (which assumes the
   * track guide underneath is already on the right era), this retargets the
   * guide too, so a cross-era hop lands with a consistent guide behind it.
   */
  openSong: (eraId: EraId, key: string) => void;
  /** Open the theories/easter-eggs overlay for an era. */
  openTheoryGuide: (id: EraId) => void;
  closeTheoryGuide: () => void;
  /** Save the era-stream position when leaving era mode (for later restore). */
  saveEraScroll: (snap: EraScrollSnapshot) => void;
  /** Read the saved era-stream position without clearing it. */
  getEraScroll: () => EraScrollSnapshot | null;
  /** Invalidate any saved position — explicit jumps land at the top instead. */
  clearEraScroll: () => void;
  setSelectorOpen: (open: boolean) => void;
  /** Mark whether the TimelineScrubber is currently being dragged. */
  setScrubbing: (v: boolean) => void;
  /** Open/close the search overlay. */
  setSearchOpen: (open: boolean) => void;
  openShare: (t: ShareTarget) => void;
  closeShare: () => void;
}

/**
 * Exploration progress (visited moments, seen eggs/trails, favorites) —
 * persisted to localStorage, in its own context pair so the low-frequency
 * "mark seen" writes don't re-render everything hanging off AppState.
 */
export interface ProgressState {
  progress: Progress;
  /**
   * False on the server and on the first client paint; flips true once the
   * post-mount localStorage read lands. Progress-driven UI that should not
   * "pop" (e.g. a completion card) can gate on it — everything renders the
   * empty-progress state first, so server and client markup always match.
   */
  hydrated: boolean;
}

export interface ProgressActions {
  /** Record that a moment's detail view was opened. Idempotent. */
  markMomentVisited: (id: string) => void;
  /** Record Clue Web egg nodes as read. Idempotent. */
  markEggsSeen: (ids: readonly string[]) => void;
  /** Record that a motif's trail view was opened. Idempotent. */
  markTrailSeen: (motif: MotifId) => void;
  /** Heart / un-heart a moment. */
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

  // Hydrate after mount — never during render, so there is no SSR read and no
  // hydration mismatch. StrictMode's double-invoke just re-reads the same blob.
  useEffect(() => {
    setProgress(readStoredProgress());
    setHydrated(true);
  }, []);

  // Write on change — but only after hydration, so the initial empty state
  // can never clobber a returning visitor's stored progress.
  useEffect(() => {
    if (hydrated) writeStoredProgress(progress);
  }, [progress, hydrated]);

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
  // The landing page is the site's front door (#684): every fresh load starts
  // there; deep links (?item/?lens/?era) bypass it in the mount effect below.
  const [mode, setModeRaw] = useState<AppMode>('landing');
  const [eraId, setEraId] = useState<EraId>(CURRENT_ERA_ID);
  const [eraJumpSeq, setEraJumpSeq] = useState(0);
  const [lensId, setLensId] = useState<LensId | null>(null);
  const [crossing, setCrossing] = useState<{ a: LensId; b: LensId } | null>(null);
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [trackGuideEraId, setTrackGuideEraId] = useState<EraId | null>(null);
  const [openTrackKey, setOpenTrackKey] = useState<string | null>(null);
  const [theoryGuideEraId, setTheoryGuideEraId] = useState<EraId | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [share, setShare] = useState<ShareTarget | null>(null);
  const [clueWebTrail, setClueWebTrail] = useState<MotifId | null>(null);

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
  const navStateRef = useRef({ mode, eraId, lensId, crossing });
  navStateRef.current = { mode, eraId, lensId, crossing };
  const suppressNavPushRef = useRef(false);

  const restoreNav = useCallback((prev: typeof navStateRef.current) => {
    suppressNavPushRef.current = true;
    setModeRaw(prev.mode);
    setEraId(prev.eraId);
    setLensId(prev.lensId);
    setCrossing(prev.crossing);
    // Jump the era stream to the restored era — unless a scroll snapshot
    // exists (mode-switch return), which the stream restores more precisely.
    if (prev.mode === 'era' && eraScrollRef.current == null) setEraJumpSeq((n) => n + 1);
    suppressNavPushRef.current = false;
  }, []);

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
      setModeRaw('era');
      setEraId(valid);
      setSelectorOpen(false);
      setEraJumpSeq((n) => n + 1);
    },
    [clearEraScroll, pushNav],
  );

  const setActiveEra = useCallback((id: EraId) => {
    // Theming-only update from scroll; guard to avoid needless renders.
    setEraId((prev) => (prev === id ? prev : getEra(id).id));
  }, []);

  const setMode = useCallback(
    (m: AppMode) => {
      if (m !== navStateRef.current.mode) pushNav();
      setModeRaw(m);
      // Entering Threads always lands on the gallery for a clear sense of place.
      if (m === 'threads') {
        setLensId(null);
        setCrossing(null);
      }
    },
    [pushNav],
  );

  const openThread = useCallback(
    (id: LensId) => {
      const cur = navStateRef.current;
      if (!(cur.mode === 'threads' && cur.lensId === id && !cur.crossing)) pushNav();
      setModeRaw('threads');
      setCrossing(null);
      setLensId(id);
      setSelectorOpen(false);
      setOpenItemId(null);
      setTrackGuideEraId(null);
      setTheoryGuideEraId(null);
    },
    [pushNav],
  );

  const openEra = useCallback(
    (id: EraId) => {
      const valid = getEra(id).id;
      const cur = navStateRef.current;
      if (cur.mode !== 'era' || valid !== cur.eraId) pushNav();
      clearEraScroll();
      setModeRaw('era');
      setEraId(valid);
      setEraJumpSeq((n) => n + 1);
      setLensId(null);
      setCrossing(null);
      setSelectorOpen(false);
      setOpenItemId(null);
      setTrackGuideEraId(null);
      setTheoryGuideEraId(null);
    },
    [clearEraScroll, pushNav],
  );

  // The Clue Web lives inside the 'easter-eggs' thread; a cross-link jump is
  // openThread plus a pending trail focus that ClueWeb consumes on landing.
  const openClueWebTrail = useCallback(
    (motif: MotifId) => {
      setClueWebTrail(motif);
      openThread('easter-eggs');
    },
    [openThread],
  );

  const openCrossing = useCallback((a: LensId, b: LensId) => {
    setModeRaw('threads');
    setLensId(null);
    setCrossing({ a, b });
    setOpenItemId(null);
  }, []);

  // Home is the landing page (#684) — the same front door every visitor gets.
  const goHome = useCallback(() => {
    clearEraScroll();
    setModeRaw('landing');
    setEraId(CURRENT_ERA_ID);
    setLensId(null);
    setCrossing(null);
    setSelectorOpen(false);
    setOpenItemId(null);
    setTrackGuideEraId(null);
    setTheoryGuideEraId(null);
    setSearchOpen(false);
    setShare(null);
  }, [clearEraScroll]);

  // Deep link support: a shared URL (?item=, ?lens=, or ?era=) lands the
  // visitor on the shared target instead of the landing page. One-time
  // read on mount — ongoing navigation stays state-only, not URL-synced.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const target = deepLinkTarget(
      window.location.search,
      THREADS.map((t) => t.id),
    );
    if (!target) return;
    // A deep link is the visitor's FIRST state, not a navigation away from
    // one — pushing a back-entry here would trap the first back gesture.
    suppressNavPushRef.current = true;
    if (target.kind === 'item') {
      // The moment overlay reads over the era stream, not the landing page.
      setModeRaw('era');
      setOpenItemId(target.id);
    } else if (target.kind === 'song') {
      // The song dossier stacks on top of its album's track guide, so open
      // both — same state openSong sets. A stale key resolves to null; drop it
      // and fall through to the front door rather than open an empty overlay.
      const resolved = resolveTrackKey(target.key);
      if (resolved) {
        setModeRaw('era');
        setTrackGuideEraId(resolved.eraId);
        setOpenTrackKey(target.key);
      }
    } else if (target.kind === 'guide') {
      // Open the album track guide over the era stream. getEra round-trips a
      // real id (it falls back to the newest era for a bad one); reject the
      // fallback so a mangled ?guide= can't open the wrong album.
      const eraId = getEra(target.eraId).id;
      if (eraId === target.eraId) {
        setModeRaw('era');
        setTrackGuideEraId(eraId);
      }
    } else if (target.kind === 'theories') {
      const eraId = getEra(target.eraId).id;
      if (eraId === target.eraId) {
        setModeRaw('era');
        setTheoryGuideEraId(eraId);
      }
    } else if (target.kind === 'lens') {
      openThread(target.id as LensId);
    } else {
      setEra(target.id as EraId);
    }
    suppressNavPushRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions = useMemo<AppActions>(
    () => ({
      goHome,
      setMode,
      setEra,
      setActiveEra,
      setLens: setLensId,
      clearLens: () => setLensId(null),
      openThread,
      openEra,
      openClueWebTrail,
      clearClueWebTrail: () => setClueWebTrail(null),
      openCrossing,
      closeCrossing: () => setCrossing(null),
      openItem: setOpenItemId,
      closeItem: () => setOpenItemId(null),
      // The two era-hero overlays are mutually exclusive — opening one always
      // closes the other so they can never stack.
      openTrackGuide: (id: EraId) => {
        setTheoryGuideEraId(null);
        setOpenTrackKey(null);
        setTrackGuideEraId(getEra(id).id);
      },
      closeTrackGuide: () => {
        setOpenTrackKey(null);
        setTrackGuideEraId(null);
      },
      openTrack: setOpenTrackKey,
      closeTrack: () => setOpenTrackKey(null),
      openSong: (eraId: EraId, key: string) => {
        setTheoryGuideEraId(null);
        setTrackGuideEraId(getEra(eraId).id);
        setOpenTrackKey(key);
      },
      openTheoryGuide: (id: EraId) => {
        setTrackGuideEraId(null);
        setTheoryGuideEraId(getEra(id).id);
      },
      closeTheoryGuide: () => setTheoryGuideEraId(null),
      saveEraScroll,
      getEraScroll,
      clearEraScroll,
      setSelectorOpen,
      setScrubbing,
      setSearchOpen,
      openShare: setShare,
      closeShare: () => setShare(null),
    }),
    [
      setEra,
      setActiveEra,
      setMode,
      goHome,
      openThread,
      openEra,
      openClueWebTrail,
      openCrossing,
      saveEraScroll,
      getEraScroll,
      clearEraScroll,
    ],
  );

  const state = useMemo<AppState>(
    () => ({
      mode,
      eraId,
      eraJumpSeq,
      lensId,
      crossing,
      openItemId,
      trackGuideEraId,
      openTrackKey,
      theoryGuideEraId,
      selectorOpen,
      scrubbing,
      searchOpen,
      share,
      clueWebTrail,
    }),
    [
      mode,
      eraId,
      eraJumpSeq,
      lensId,
      crossing,
      openItemId,
      trackGuideEraId,
      openTrackKey,
      theoryGuideEraId,
      selectorOpen,
      scrubbing,
      searchOpen,
      share,
      clueWebTrail,
    ],
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
