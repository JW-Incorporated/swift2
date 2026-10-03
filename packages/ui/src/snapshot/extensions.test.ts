// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { WatchableVideoNote } from '@swift2/content-enrichment';
import type { ReaderSnapshotCore, ReaderSnapshotExtensions } from '@swift2/experience/reader-snapshot';
import { ReaderSnapshotProvider, useReader, useReaderSnapshot } from './context';
import { ReaderExtensionsProvider, useExtendedSnapshot, useMerch, useSongMoods } from './extensions';

const core = {
  version: 1,
  state: 'ready',
  origin: { kind: 'baked' },
  domains: { eras: [], content: {}, searchIndex: [] },
} as unknown as ReaderSnapshotCore;

const extensions = {
  merch: { shopTheLook: [], officialStore: [], fanMade: [] },
  songMoods: [],
} as unknown as ReaderSnapshotExtensions;

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(ReaderSnapshotProvider, {
    value: core,
    children: createElement(ReaderExtensionsProvider, { extensions, children }),
  });

describe('ReaderExtensionsProvider', () => {
  it('attaches the extensions without touching the core snapshot', () => {
    const { result } = renderHook(() => ({ core: useReaderSnapshot(), ext: useExtendedSnapshot() }), { wrapper });
    expect(result.current.core).toBe(core);
    expect('merch' in result.current.core.domains).toBe(false);
    expect(result.current.ext.domains.merch).toBe(extensions.merch);
    expect(result.current.ext.domains.eras).toBe(core.domains.eras);
  });

  it('keeps one attached snapshot across re-renders, and exposes each domain', () => {
    const { result, rerender } = renderHook(() => ({ s: useExtendedSnapshot(), m: useMerch(), v: useSongMoods() }), {
      wrapper,
    });
    const first = result.current.s;
    rerender();
    expect(result.current.s).toBe(first);
    expect(result.current.m).toBe(extensions.merch);
    expect(result.current.v).toBe(extensions.songMoods);
  });

  it('throws outside the provider', () => {
    expect(() => renderHook(() => useMerch())).toThrow(/ReaderExtensionsProvider/);
  });
});

describe('useReader typing', () => {
  it('returns watchable videos with no cast', () => {
    expectTypeOf<ReturnType<ReturnType<typeof useReader>['videosForEra']>>().toEqualTypeOf<WatchableVideoNote[]>();
  });
});
