// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReaderSnapshot, ReaderSnapshotContextValue } from '@swift2/experience/reader-snapshot';
import {
  isReaderSnapshot,
  ReaderSnapshotProvider,
  useReader,
  useReaderSnapshot,
  useReaderSnapshotStatus,
} from './context';

const snapshot = {
  version: 1,
  state: 'ready',
  origin: { kind: 'baked' },
  domains: {
    eras: [],
    content: {},
    milestones: [],
    videos: {},
    theories: {},
    eraSecrets: {},
    searchIndex: [],
    tracks: {},
    merch: {},
    songMoods: [],
  },
} as unknown as ReaderSnapshot;

const wrap = (value: ReaderSnapshotContextValue) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(ReaderSnapshotProvider, { value, children });
  };

describe('isReaderSnapshot', () => {
  it('narrows on `domains`, not on key equality', () => {
    expect(isReaderSnapshot(snapshot)).toBe(true);
    expect(isReaderSnapshot({ status: 'loading' })).toBe(false);
  });
});

describe('reader snapshot context', () => {
  it('throws a clear error outside a provider', () => {
    expect(() => renderHook(() => useReaderSnapshotStatus())).toThrow(/ReaderSnapshotProvider/);
    expect(() => renderHook(() => useReaderSnapshot())).toThrow(/ReaderSnapshotProvider/);
  });

  it('status returns the union; useReaderSnapshot throws while loading', () => {
    const loading = { status: 'loading' } as const;
    const { result } = renderHook(() => useReaderSnapshotStatus(), { wrapper: wrap(loading) });
    expect(result.current).toBe(loading);
    expect(() => renderHook(() => useReaderSnapshot(), { wrapper: wrap(loading) })).toThrow(/loading/);
  });

  it('returns the very same snapshot object across re-renders', () => {
    const { result, rerender } = renderHook(() => useReaderSnapshot(), { wrapper: wrap(snapshot) });
    const first = result.current;
    rerender();
    rerender();
    expect(first).toBe(snapshot);
    expect(result.current).toBe(first);
  });

  it('useReader is memoised per snapshot', () => {
    const { result, rerender } = renderHook(() => useReader(), { wrapper: wrap(snapshot) });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
    expect(first.searchIndex).toBe(snapshot.domains.searchIndex);
  });
});
