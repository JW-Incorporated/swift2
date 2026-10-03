// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { matchMoods, MOOD_AXES, type MoodQuery } from '@swift2/experience';
import * as snapshotModule from '@swift2/experience/reader-snapshot';
import { ReaderExtensionsProvider, useMerch, useReaderSnapshot, useSongMoods } from '@swift2/ui';
import { MerchSection } from '../../components/longlive/MerchSection';
import { MERCH_CATALOGUE } from './merch';
import { TestHostProvider } from '../test-host';
import { AppProvider } from './store';
import { MOOD_STARTERS } from './mood-starters';
import { WebReaderSnapshotProvider } from './reader-snapshot-provider';
import { SONG_MOODS } from './song-moods.generated';

const extensions = {
  merch: MERCH_CATALOGUE as unknown as snapshotModule.ReaderSnapshotExtensions['merch'],
  songMoods: SONG_MOODS,
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <WebReaderSnapshotProvider>
    <ReaderExtensionsProvider extensions={extensions}>{children}</ReaderExtensionsProvider>
  </WebReaderSnapshotProvider>
);

afterEach(() => vi.restoreAllMocks());

describe('WP2.2-E: merch and songMoods through the extension provider', () => {
  it('serves the very same merch and mood data the direct imports hold', () => {
    const { result } = renderHook(() => ({ merch: useMerch(), moods: useSongMoods() }), {
      wrapper,
    });
    expect(result.current.merch).toBe(extensions.merch);
    expect(result.current.moods).toBe(SONG_MOODS);
  });

  it('keeps the core snapshot free of both extension domains', () => {
    const { result } = renderHook(() => useReaderSnapshot(), { wrapper });
    expect(Object.keys(result.current.domains)).not.toContain('merch');
    expect(Object.keys(result.current.domains)).not.toContain('songMoods');
  });

  it('ranks identically through the provider catalogue over every starter and axis', () => {
    const { result } = renderHook(() => useSongMoods(), { wrapper });
    const queries: MoodQuery[] = [
      ...MOOD_STARTERS.map((s) => ({ moods: s.moods, energy: s.energy, valence: s.valence })),
      ...MOOD_AXES.map((axis) => ({ moods: { [axis]: 1 } })),
      ...MOOD_AXES.map((axis) => ({ moods: { [axis]: 1 }, bereavement: true })),
    ];
    expect(queries.length).toBeGreaterThan(10);
    for (const q of queries) {
      for (const limit of [1, 5, 8]) {
        expect(matchMoods(q, { limit, catalogue: result.current })).toEqual(
          matchMoods(q, { limit }),
        );
      }
    }
  });

  it('renders the merch section the same whichever songMoods the provider holds', () => {
    const html = (songMoods: typeof SONG_MOODS) =>
      renderToStaticMarkup(
        <WebReaderSnapshotProvider>
          <TestHostProvider>
            <AppProvider>
              <ReaderExtensionsProvider extensions={{ ...extensions, songMoods }}>
                <MerchSection />
              </ReaderExtensionsProvider>
            </AppProvider>
          </TestHostProvider>
        </WebReaderSnapshotProvider>,
      );
    const lone = renderToStaticMarkup(
      <WebReaderSnapshotProvider>
        <TestHostProvider>
          <AppProvider>
            <MerchSection />
          </AppProvider>
        </TestHostProvider>
      </WebReaderSnapshotProvider>,
    );
    expect(lone).toBe(html([]));
    expect(lone).toBe(html(SONG_MOODS));
    expect(lone).toContain(String(MERCH_CATALOGUE.shopTheLook.length));
    for (const item of MERCH_CATALOGUE.officialStore.slice(0, 12)) {
      expect(lone).toContain(item.url.replaceAll('&', '&amp;'));
    }
  });

  it('never hashes a core-only snapshot while reading the extensions', () => {
    const hash = vi.spyOn(snapshotModule, 'hashSnapshot');
    renderHook(() => ({ s: useReaderSnapshot(), m: useMerch() }), { wrapper });
    expect(hash).not.toHaveBeenCalled();
  });
});
