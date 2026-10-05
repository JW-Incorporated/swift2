// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

// @ts-expect-error -- untyped deep path on purpose (no declaration file for the copy)
vi.mock('react', async () => await import('../../web/node_modules/react'));
vi.mock('react-native', async () => {
  // @ts-expect-error -- untyped deep path on purpose
  const R = await import('../../web/node_modules/react');
  const el =
    (tag: string) =>
    ({ children, onPress, testID, accessibilityLabel }: Record<string, unknown>) =>
      R.createElement(
        tag,
        { onClick: onPress, 'data-testid': testID, 'aria-label': accessibilityLabel },
        children as never,
      );
  return {
    View: el('div'),
    Text: el('span'),
    Pressable: el('button'),
    ActivityIndicator: el('i'),
    StyleSheet: { create: <T,>(s: T) => s },
  };
});

import { createElement } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { FirstLaunchScreen } from './FirstLaunchScreen';

describe('FirstLaunchScreen', () => {
  it('loading state shows the download copy and no Retry', () => {
    const { getByText, queryByLabelText } = render(
      createElement(FirstLaunchScreen, { failed: false, onRetry: () => undefined }),
    );
    expect(getByText('Downloading Long Live…')).toBeTruthy();
    expect(queryByLabelText('Retry')).toBeNull();
  });

  it('failed state shows offline copy and Retry fires the callback', () => {
    const onRetry = vi.fn();
    const { getByText, getByLabelText } = render(
      createElement(FirstLaunchScreen, { failed: true, onRetry }),
    );
    expect(getByText("You're offline — connect to load Long Live")).toBeTruthy();
    fireEvent.click(getByLabelText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
