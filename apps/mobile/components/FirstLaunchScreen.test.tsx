// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

const appState = vi.hoisted(() => ({ current: 'active', listeners: new Set<(s: string) => void>() }));
const announce = vi.hoisted(() => vi.fn());
const platform = vi.hoisted(() => ({ OS: 'ios' }));

// @ts-expect-error -- untyped deep path on purpose (no declaration file for the copy)
vi.mock('react', async () => await import('../../web/node_modules/react'));
vi.mock('react-native', async () => {
  // @ts-expect-error -- untyped deep path on purpose
  const R = await import('../../web/node_modules/react');
  const el =
    (tag: string) =>
    ({
      children,
      onPress,
      testID,
      accessibilityLabel,
      accessibilityRole,
      accessibilityLiveRegion,
      accessibilityElementsHidden,
      importantForAccessibility,
      style,
      contentContainerStyle,
    }: Record<string, unknown>) =>
      R.createElement(
        tag,
        {
          onClick: onPress,
          'data-testid': testID,
          'aria-label': accessibilityLabel,
          role: accessibilityRole,
          'aria-live': accessibilityLiveRegion,
          'aria-hidden': accessibilityElementsHidden ? 'true' : undefined,
          'data-ifa': importantForAccessibility,
          'data-style': JSON.stringify([style, contentContainerStyle].flat(Infinity).filter(Boolean)),
        },
        children as never,
      );
  return {
    View: el('div'),
    Text: el('span'),
    Pressable: el('button'),
    ActivityIndicator: el('i'),
    ScrollView: el('div'),
    Platform: platform,
    AccessibilityInfo: { announceForAccessibility: announce },
    StyleSheet: { create: <T,>(s: T) => s },
    AppState: {
      get currentState() {
        return appState.current;
      },
      addEventListener: (_: string, l: (s: string) => void) => {
        appState.listeners.add(l);
        return { remove: () => appState.listeners.delete(l) };
      },
    },
  };
});

import { createElement } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { FAILURE_COPY, FirstLaunchScreen } from './FirstLaunchScreen';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  appState.current = 'active';
  platform.OS = 'ios';
  announce.mockClear();
});

describe('FirstLaunchScreen', () => {
  it('loading state shows the download copy and no Retry', () => {
    const { getByText, queryByLabelText } = render(
      createElement(FirstLaunchScreen, { failed: false, onRetry: () => undefined }),
    );
    expect(getByText('Downloading Long Live…')).toBeTruthy();
    expect(queryByLabelText('Retry')).toBeNull();
    expect(getByText('Downloading Long Live…').getAttribute('aria-live')).toBe('polite');
  });

  it('failed state shows offline copy and Retry fires the callback', () => {
    const onRetry = vi.fn();
    const { getByText, getByLabelText } = render(
      createElement(FirstLaunchScreen, { failed: true, onRetry, kind: 'offline' }),
    );
    expect(getByText("You're offline — connect to load Long Live").getAttribute('role')).toBe(
      'alert',
    );
    fireEvent.click(getByLabelText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('picks distinct friendly copy per failure class, without raw error text', () => {
    expect(new Set(Object.values(FAILURE_COPY)).size).toBe(3);
    for (const kind of ['offline', 'timeout', 'server'] as const) {
      const { getByText, unmount } = render(
        createElement(FirstLaunchScreen, { failed: true, onRetry: () => undefined, kind }),
      );
      expect(getByText(FAILURE_COPY[kind])).toBeTruthy();
      unmount();
    }
    expect(FAILURE_COPY.offline).toContain('offline');
    expect(FAILURE_COPY.server).not.toContain('offline');
    expect(FAILURE_COPY.timeout).not.toContain('offline');
  });

  it('auto-retries on backoff while failed and foregrounded, and stops when backgrounded', () => {
    vi.useFakeTimers();
    const onRetry = vi.fn();
    render(createElement(FirstLaunchScreen, { failed: true, onRetry, kind: 'server' }));
    vi.advanceTimersByTime(5000);
    expect(onRetry).toHaveBeenCalledTimes(1);
    act(() => {
      appState.listeners.forEach((l) => l('background'));
    });
    vi.advanceTimersByTime(10 * 60_000);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not auto-retry while loading (no overlapping fetch)', () => {
    vi.useFakeTimers();
    const onRetry = vi.fn();
    render(createElement(FirstLaunchScreen, { failed: false, onRetry }));
    vi.advanceTimersByTime(10 * 60_000);
    expect(onRetry).not.toHaveBeenCalled();
  });
  it('spinner is hidden from AT (the adjacent text names it), Retry is a 44pt target, content scrolls (ScrollView with flexGrow)', () => {
    const { container, getByLabelText, rerender, getByTestId } = render(
      createElement(FirstLaunchScreen, { failed: false, onRetry: () => undefined }),
    );
    const spinner = container.querySelector('i')!;
    expect(spinner.getAttribute('aria-hidden')).toBe('true');
    expect(spinner.getAttribute('data-ifa')).toBe('no-hide-descendants');
    expect(spinner.getAttribute('aria-label')).toBeNull();
    expect(getByTestId('first-launch-screen').getAttribute('data-style')).toContain('flexGrow');
    rerender(createElement(FirstLaunchScreen, { failed: true, onRetry: () => undefined, kind: 'server' }));
    expect(JSON.parse(getByLabelText('Retry').getAttribute('data-style')!)[0].minHeight).toBeGreaterThanOrEqual(44);
  });

  it('announces on iOS: loading, the failure, a changed class while failed, and a repeat failure after retry', () => {
    const onRetry = () => undefined;
    const { rerender } = render(createElement(FirstLaunchScreen, { failed: false, onRetry }));
    expect(announce).toHaveBeenLastCalledWith('Downloading Long Live');
    rerender(createElement(FirstLaunchScreen, { failed: true, onRetry, kind: 'offline' }));
    expect(announce).toHaveBeenLastCalledWith(FAILURE_COPY.offline);
    rerender(createElement(FirstLaunchScreen, { failed: true, onRetry, kind: 'timeout' }));
    expect(announce).toHaveBeenLastCalledWith(FAILURE_COPY.timeout);
    rerender(createElement(FirstLaunchScreen, { failed: false, onRetry, kind: 'timeout' }));
    rerender(createElement(FirstLaunchScreen, { failed: true, onRetry, kind: 'timeout' }));
    expect(announce).toHaveBeenCalledTimes(5);
  });

  it('does not announce imperatively on Android (the polite live region carries it)', () => {
    platform.OS = 'android';
    const { getByText } = render(createElement(FirstLaunchScreen, { failed: true, onRetry: () => undefined, kind: 'offline' }));
    expect(announce).not.toHaveBeenCalled();
    expect(getByText(FAILURE_COPY.offline).getAttribute('aria-live')).toBe('polite');
  });
});
