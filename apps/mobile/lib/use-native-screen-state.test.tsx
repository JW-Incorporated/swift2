// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../web/node_modules/react-dom'));
const rn = vi.hoisted(() => ({ os: 'ios', handlers: [] as Array<() => boolean>, removed: 0 }));
vi.mock('react-native', () => ({
  BackHandler: {
    addEventListener: (_e: string, h: () => boolean) => {
      rn.handlers.push(h);
      return { remove: () => { rn.handlers = rn.handlers.filter((x) => x !== h); rn.removed++; } };
    },
  },
  Platform: { get OS() { return rn.os; } },
}));
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

afterEach(() => {
  cleanup();
  rn.os = 'ios';
  rn.handlers = [];
  rn.removed = 0;
});

// Mirrors BackHandler: newest registered handler runs first, first to return true wins.
const pressBack = () => [...rn.handlers].reverse().some((h) => h());

describe('Android hardware Back registration', () => {
  it('registers only while native-mounted, once, and removes on unmount', () => {
    rn.os = 'android';
    const { result, unmount } = renderHook(() => useNativeScreenState());
    expect(rn.handlers).toHaveLength(0);
    act(() => result.current.setNativeMounted(true));
    expect(rn.handlers).toHaveLength(1);
    act(() => result.current.setActiveTab('threads'));
    act(() => result.current.setInboxOpen(true));
    expect(rn.handlers).toHaveLength(1);
    expect(rn.removed).toBe(0);
    unmount();
    expect(rn.handlers).toHaveLength(0);
  });

  it('removes the handler when the DOM host mounts', () => {
    rn.os = 'android';
    const { result } = renderHook(() => useNativeScreenState());
    act(() => result.current.setNativeMounted(true));
    act(() => result.current.setNativeMounted(false));
    expect(rn.handlers).toHaveLength(0);
  });

  it('handles Back with current state, returns false at the root, and does not pre-empt a later handler', () => {
    rn.os = 'android';
    const { result } = renderHook(() => useNativeScreenState());
    act(() => result.current.setNativeMounted(true));
    expect(pressBack()).toBe(false);
    act(() => result.current.setInboxOpen(true));
    let handled = false;
    act(() => { handled = pressBack(); });
    expect(handled).toBe(true);
    expect(result.current.inboxOpen).toBe(false);
    const dom = vi.fn(() => true);
    rn.handlers.push(dom);
    act(() => result.current.setInboxOpen(true));
    act(() => { handled = pressBack(); });
    expect(handled).toBe(true);
    expect(dom).toHaveBeenCalledTimes(1);
    expect(result.current.inboxOpen).toBe(true);
  });

  it('never registers on iOS', () => {
    const { result } = renderHook(() => useNativeScreenState());
    act(() => result.current.setNativeMounted(true));
    expect(rn.handlers).toHaveLength(0);
  });
});

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
