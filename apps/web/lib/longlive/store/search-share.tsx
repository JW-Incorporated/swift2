'use client';

import { useCallback, useReducer } from 'react';
import type { FilterId } from '../filters';
import type { EraId, LensId } from '../types';
import type { ClownAnswer } from '../clown-answer';

export type ShareTarget =
  | { kind: 'era'; eraId: EraId }
  | { kind: 'lens'; lensId: LensId }
  | { kind: 'item'; itemId: string }
  // #707 — every immersive overlay is now shareable. A `track` carries the
  // composite trackKey that reopens the song dossier (over its album guide);
  // `trackGuide`/`theoryGuide` reopen the per-era guides; `site` is the bare
  // front door (the era stream, which has no more specific target).
  | { kind: 'track'; eraId: EraId; trackKey: string }
  | { kind: 'trackGuide'; eraId: EraId }
  | { kind: 'theoryGuide'; eraId: EraId }
  | { kind: 'site' }
  // #2105 — the Threads gallery, Mood, and Clownbot are each shareable as a
  // destination (the surface itself, empty and ready), never as whatever a
  // reader typed there — see topbarShareTarget's JSDoc for why. Community and
  // Merch take no user input at all, but share the same destination-only
  // shape for consistency with the other three.
  | { kind: 'threads' }
  | { kind: 'mood' }
  | { kind: 'clownbot' }
  | { kind: 'community' }
  | { kind: 'merch' };

/** One exchange in the clown bot transcript. */
export interface ClownMessage {
  id: string;
  question: string;
  answer: ClownAnswer;
}

/**
 * How many exchanges the clown bot transcript keeps. Client-held only — zero
 * server storage is a product promise (PLAN.md Step 11) — so this cap exists
 * purely to bound the in-memory array, never persisted to localStorage or
 * sessionStorage.
 */
const CLOWN_TRANSCRIPT_CAP = 6;

interface SearchShareState {
  /** Whether the search overlay is open. */
  searchOpen: boolean;
  /** Whether the share sheet is open, and for what target. */
  share: ShareTarget | null;
  /** Active global timeline filter chips. Empty = show everything (P1). */
  filters: ReadonlySet<FilterId>;
  /**
   * Clown bot transcript — client-held, capped at `CLOWN_TRANSCRIPT_CAP`
   * exchanges, never persisted. Lives in the app store (rather than local
   * component state) purely so it survives a mode switch away and back;
   * a fresh page load always starts empty.
   */
  clownMessages: ClownMessage[];
  /**
   * True while the clown bot panel is expanded to its `fixed inset-0`
   * fullscreen overlay (ClownChat.tsx). Page furniture that floats above
   * every other overlay (FeedbackButton's z-[71]) reads this to hide itself —
   * a genuinely fullscreen app surface owns the top layer while active, so
   * furniture should not still be reachable, not even just visually stacked
   * under it.
   */
  clownChatExpanded: boolean;
}

type SearchShareAction =
  | { type: 'setSearchOpen'; open: boolean }
  | { type: 'setShare'; target: ShareTarget | null }
  | { type: 'toggleFilter'; id: FilterId }
  | { type: 'clearFilters' }
  | { type: 'addClownMessage'; question: string; answer: ClownAnswer }
  | { type: 'clearClownMessages' }
  | { type: 'setClownChatExpanded'; v: boolean }
  /** Bulk-close (goHome). */
  | { type: 'closeAll' };

export function searchShareReducer(state: SearchShareState, action: SearchShareAction): SearchShareState {
  switch (action.type) {
    case 'setSearchOpen':
      return { ...state, searchOpen: action.open };
    case 'setShare':
      return { ...state, share: action.target };
    case 'toggleFilter': {
      const next = new Set(state.filters);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, filters: next };
    }
    case 'clearFilters':
      return { ...state, filters: new Set() };
    case 'addClownMessage': {
      const next = [
        ...state.clownMessages,
        { id: `m-${Date.now()}`, question: action.question, answer: action.answer },
      ];
      return {
        ...state,
        clownMessages:
          next.length > CLOWN_TRANSCRIPT_CAP ? next.slice(next.length - CLOWN_TRANSCRIPT_CAP) : next,
      };
    }
    case 'clearClownMessages':
      return { ...state, clownMessages: [] };
    case 'setClownChatExpanded':
      return { ...state, clownChatExpanded: action.v };
    case 'closeAll':
      return { ...state, searchOpen: false, share: null };
    default:
      return state;
  }
}

export function searchShareInitialState(): SearchShareState {
  return {
    searchOpen: false,
    share: null,
    filters: new Set(),
    clownMessages: [],
    clownChatExpanded: false,
  };
}

/** Owns search overlay, share sheet, timeline filter chips, and the clown-bot transcript/expansion. */
export function useSearchShare() {
  const [state, dispatch] = useReducer(searchShareReducer, undefined, searchShareInitialState);

  const setSearchOpen = useCallback((open: boolean) => dispatch({ type: 'setSearchOpen', open }), []);
  const openShare = useCallback((t: ShareTarget) => dispatch({ type: 'setShare', target: t }), []);
  const closeShare = useCallback(() => dispatch({ type: 'setShare', target: null }), []);
  const toggleFilter = useCallback((id: FilterId) => dispatch({ type: 'toggleFilter', id }), []);
  const clearFilters = useCallback(() => dispatch({ type: 'clearFilters' }), []);
  const addClownMessage = useCallback(
    (question: string, answer: ClownAnswer) => dispatch({ type: 'addClownMessage', question, answer }),
    [],
  );
  const clearClownMessages = useCallback(() => dispatch({ type: 'clearClownMessages' }), []);
  const setClownChatExpanded = useCallback((v: boolean) => dispatch({ type: 'setClownChatExpanded', v }), []);
  const closeSearchAndShare = useCallback(() => dispatch({ type: 'closeAll' }), []);

  return {
    state,
    dispatch,
    setSearchOpen,
    openShare,
    closeShare,
    toggleFilter,
    clearFilters,
    addClownMessage,
    clearClownMessages,
    setClownChatExpanded,
    closeSearchAndShare,
  };
}
