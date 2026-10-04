// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../web/node_modules/react-dom'));
vi.mock('react-native', () => ({ BackHandler: { addEventListener: () => ({ remove: () => {} }) }, Platform: { OS: 'ios' } }));
vi.mock('../components/SiteShell', () => ({ SITE_URL: 'https://example.test' }));

let release: () => void = () => {};
vi.mock('./track-guide-data', () => ({
  ensureTrackGuideWired: () => new Promise<void>((r) => { release = r; }),
  loadTrackGuide: () => Promise.resolve([]),
}));
vi.mock('@swift2/experience', () => ({
  resolveTrackKey: () => ({ eraId: 'lover', track: { id: 't' } }),
}));

import { useNativeScreenState } from './use-native-screen-state';

afterEach(cleanup);

describe('useNativeScreenState back + stale navigation', () => {
  it('goBack walks song -> track guide -> closed -> home tab -> root', () => {
    const { result } = renderHook(() => useNativeScreenState());
    expect(result.current.goBack()).toBe(false);
    act(() => result.current.setActiveTab('threads'));
    act(() => { result.current.goBack(); });
    expect(result.current.activeTab).toBe('era');
    act(() => result.current.setTrackGuideRoute({ screen: 'song', eraId: 'lover' as never, track: { id: 't' } as never }));
    act(() => { result.current.goBack(); });
    expect(result.current.trackGuideRoute).toEqual({ screen: 'track-guide', eraId: 'lover' });
    act(() => { result.current.goBack(); });
    expect(result.current.trackGuideRoute).toBeNull();
    expect(result.current.goBack()).toBe(false);
  });

  it('a stale async song resolution cannot override newer navigation', async () => {
    const { result } = renderHook(() => useNativeScreenState());
    act(() => result.current.openNativeScreen('song', { trackKey: 'k' }));
    const stale = release;
    act(() => result.current.setActiveTab('threads'));
    await act(async () => { stale(); await Promise.resolve(); });
    expect(result.current.trackGuideRoute).toBeNull();
  });

  it('a fresh song resolution still opens the song', async () => {
    const { result } = renderHook(() => useNativeScreenState());
    act(() => result.current.openNativeScreen('song', { trackKey: 'k' }));
    await act(async () => { release(); await Promise.resolve(); });
    expect(result.current.trackGuideRoute?.screen).toBe('song');
  });
});
