// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

const appState = vi.hoisted(() => ({ current: 'active', listeners: new Set<(s: string) => void>() }));

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
    }: Record<string, unknown>) =>
      R.createElement(
        tag,
        {
          onClick: onPress,
          'data-testid': testID,
          'aria-label': accessibilityLabel,
          role: accessibilityRole,
          'aria-live': accessibilityLiveRegion,
        },
        children as never,
      );
  return {
    View: el('div'),
    Text: el('span'),
    Pressable: el('button'),
    ActivityIndicator: el('i'),
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
});
