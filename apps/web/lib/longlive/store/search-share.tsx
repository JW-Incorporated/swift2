'use client';

import { useCallback, useReducer } from 'react';
import type { FilterId } from '@swift2/experience';
import type { ClownAnswer } from '../clown-answer';
export type { ShareTarget } from '@swift2/experience';

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
      return { ...state, searchOpen: false };
    default:
      return state;
  }
}

export function searchShareInitialState(): SearchShareState {
  return {
    searchOpen: false,
    filters: new Set(),
    clownMessages: [],
    clownChatExpanded: false,
  };
}

/** Owns search overlay, timeline filter chips, and the clown-bot transcript/expansion. */
export function useSearchShare() {
  const [state, dispatch] = useReducer(searchShareReducer, undefined, searchShareInitialState);

  const setSearchOpen = useCallback((open: boolean) => dispatch({ type: 'setSearchOpen', open }), []);
  const toggleFilter = useCallback((id: FilterId) => dispatch({ type: 'toggleFilter', id }), []);
  const clearFilters = useCallback(() => dispatch({ type: 'clearFilters' }), []);
  const addClownMessage = useCallback(
    (question: string, answer: ClownAnswer) => dispatch({ type: 'addClownMessage', question, answer }),
    [],
  );
  const clearClownMessages = useCallback(() => dispatch({ type: 'clearClownMessages' }), []);
  const setClownChatExpanded = useCallback((v: boolean) => dispatch({ type: 'setClownChatExpanded', v }), []);
  const closeSearch = useCallback(() => dispatch({ type: 'closeAll' }), []);

  return {
    state,
    dispatch,
    setSearchOpen,
    toggleFilter,
    clearFilters,
    addClownMessage,
    clearClownMessages,
    setClownChatExpanded,
    closeSearch,
  };
}
