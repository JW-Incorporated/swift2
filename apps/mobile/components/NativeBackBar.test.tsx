// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../web/node_modules/react-dom'));
vi.mock('react-native', async () => {
  const React = await import('react');
  const el = (tag: string) => (p: Record<string, unknown>) => React.createElement(tag, null, p.children as never);
  return {
    View: el('div'),
    Text: el('span'),
    StyleSheet: { create: (s: unknown) => s, hairlineWidth: 1 },
    Pressable: (p: { onPress?: () => void; accessibilityLabel?: string; children?: unknown }) =>
      React.createElement('button', { onClick: p.onPress, 'aria-label': p.accessibilityLabel }, p.children as never),
  };
});

import { NativeBackBar } from './NativeBackBar';

afterEach(cleanup);

describe('NativeBackBar', () => {
  it('renders a labelled control that calls onBack', () => {
    const onBack = vi.fn();
    render(<NativeBackBar label="Close" onBack={onBack} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
