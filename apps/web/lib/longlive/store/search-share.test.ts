import { describe, expect, it } from 'vitest';
import { searchShareReducer, searchShareInitialState } from './search-share';
import type { ClownAnswer } from '../clown-answer';

const answer = { text: 'hi', citations: [], investigation: [] } as unknown as ClownAnswer;

describe('searchShareReducer', () => {
  it('has the expected initial state', () => {
    const state = searchShareInitialState();
    expect(state.searchOpen).toBe(false);
    expect(state.share).toBeNull();
    expect(state.filters.size).toBe(0);
    expect(state.clownMessages).toEqual([]);
    expect(state.clownChatExpanded).toBe(false);
  });

  it('setSearchOpen toggles independently of share', () => {
    const start = searchShareInitialState();
    const opened = searchShareReducer(start, { type: 'setSearchOpen', open: true });
    expect(opened.searchOpen).toBe(true);
    expect(opened.share).toBeNull();
  });

  it('setShare / closeShare (setShare null) set and clear the share target', () => {
    const start = searchShareInitialState();
    const withTarget = searchShareReducer(start, { type: 'setShare', target: { kind: 'site' } });
    expect(withTarget.share).toEqual({ kind: 'site' });
    const cleared = searchShareReducer(withTarget, { type: 'setShare', target: null });
    expect(cleared.share).toBeNull();
  });

  it('toggleFilter adds then removes a filter id', () => {
    const start = searchShareInitialState();
    const added = searchShareReducer(start, { type: 'toggleFilter', id: 'Videos' });
    expect(added.filters.has('Videos')).toBe(true);
    const removed = searchShareReducer(added, { type: 'toggleFilter', id: 'Videos' });
    expect(removed.filters.has('Videos')).toBe(false);
  });

  it('clearFilters empties the filter set', () => {
    const start = { ...searchShareInitialState(), filters: new Set(['Videos' as const]) };
    const next = searchShareReducer(start, { type: 'clearFilters' });
    expect(next.filters.size).toBe(0);
  });

  it('addClownMessage appends and caps the transcript at 6 exchanges', () => {
    let state = searchShareInitialState();
    for (let i = 0; i < 8; i++) {
      state = searchShareReducer(state, {
        type: 'addClownMessage',
        question: `q${i}`,
        answer,
      });
    }
    expect(state.clownMessages).toHaveLength(6);
    expect(state.clownMessages[0].question).toBe('q2');
    expect(state.clownMessages[5].question).toBe('q7');
  });

  it('clearClownMessages empties the transcript', () => {
    let state = searchShareReducer(searchShareInitialState(), {
      type: 'addClownMessage',
      question: 'q',
      answer,
    });
    state = searchShareReducer(state, { type: 'clearClownMessages' });
    expect(state.clownMessages).toEqual([]);
  });

  it('setClownChatExpanded sets the fullscreen flag', () => {
    const start = searchShareInitialState();
    const next = searchShareReducer(start, { type: 'setClownChatExpanded', v: true });
    expect(next.clownChatExpanded).toBe(true);
  });

  it('closeAll clears searchOpen and share but leaves filters/transcript alone', () => {
    const start = {
      ...searchShareInitialState(),
      searchOpen: true,
      share: { kind: 'site' as const },
      filters: new Set(['Videos' as const]),
    };
    const next = searchShareReducer(start, { type: 'closeAll' });
    expect(next.searchOpen).toBe(false);
    expect(next.share).toBeNull();
    expect(next.filters.has('Videos')).toBe(true);
  });
});
