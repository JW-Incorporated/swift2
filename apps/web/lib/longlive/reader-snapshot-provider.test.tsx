// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useReader, useReaderSnapshot } from '@swift2/ui';
import { WebReaderSnapshotProvider } from './reader-snapshot-provider';

const wrapper = ({ children }: { children: ReactNode }) => (
  <WebReaderSnapshotProvider>{children}</WebReaderSnapshotProvider>
);

describe('WebReaderSnapshotProvider', () => {
  it('builds one baked snapshot per instance, stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useReaderSnapshot(), { wrapper });
    const first = result.current;
    rerender();
    rerender();
    expect(result.current).toBe(first);
    expect(first.origin).toEqual({ kind: 'baked' });
    expect(first.domains.searchIndex.length).toBeGreaterThan(0);
  });

  it('useReader exposes the snapshot\'s own (referentially stable) search index', () => {
    const { result, rerender } = renderHook(() => ({ s: useReaderSnapshot(), r: useReader() }), { wrapper });
    expect(result.current.r.searchIndex).toBe(result.current.s.domains.searchIndex);
    const idx = result.current.r.searchIndex;
    rerender();
    expect(result.current.r.searchIndex).toBe(idx);
  });

  it('two provider instances do not share a snapshot (no module singleton)', () => {
    const a = renderHook(() => useReaderSnapshot(), { wrapper }).result.current;
    const b = renderHook(() => useReaderSnapshot(), { wrapper }).result.current;
    expect(a).not.toBe(b);
  });
});
