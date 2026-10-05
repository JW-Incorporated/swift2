// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../web/node_modules/react-dom'));

const openURL = vi.hoisted(() => vi.fn(async (_u: string) => true));
vi.mock('react-native', async () => {
  const React = await import('react');
  return {
    View: (p: { children?: unknown }) => React.createElement('div', null, p.children as never),
    ScrollView: (p: { children?: unknown; contentContainerStyle?: { flexGrow?: number } }) =>
      React.createElement('div', { 'data-testid': 'scroll', 'data-flexgrow': String(p.contentContainerStyle?.flexGrow) }, p.children as never),
    Text: (p: { children?: unknown }) => React.createElement('span', null, p.children as never),
    Pressable: (p: { onPress?: () => void; accessibilityLabel?: string; style?: { minHeight?: number }; children?: unknown }) =>
      React.createElement('button', { onClick: p.onPress, 'aria-label': p.accessibilityLabel, 'data-minheight': String(p.style?.minHeight) }, p.children as never),
    StyleSheet: { create: (s: unknown) => s },
    Platform: { OS: 'ios' },
    Linking: { openURL },
  };
});

vi.mock('../lib/update-required', () => ({ storeUrlFor: () => 'https://store.test/app' }));

import { UpdateRequiredScreen } from './UpdateRequiredScreen';

afterEach(cleanup);

describe('UpdateRequiredScreen', () => {
  it('Update is a 44pt button that opens the store, inside a scrolling container', () => {
    render(<UpdateRequiredScreen />);
    const btn = screen.getByLabelText('Update Long Live');
    expect(Number(btn.getAttribute('data-minheight'))).toBeGreaterThanOrEqual(44);
    expect(screen.getByTestId('scroll').getAttribute('data-flexgrow')).toBe('1');
    fireEvent.click(btn);
    expect(openURL).toHaveBeenCalledWith('https://store.test/app');
  });
});
