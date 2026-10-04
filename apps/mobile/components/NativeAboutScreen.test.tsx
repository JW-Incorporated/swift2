// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// apps/mobile resolves its own react copy; testing-library renders with apps/web's, so pin both to it.
// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../web/node_modules/react-dom'));

vi.mock('react-native', async () => {
  const React = await import('react');
  const el = (tag: string) => (p: Record<string, unknown>) => React.createElement(tag, null, p.children as never);
  return {
    View: el('div'),
    ScrollView: el('div'),
    Text: el('span'),
    StyleSheet: { create: (s: unknown) => s, hairlineWidth: 1 },
    Pressable: (p: { onPress?: () => void; accessibilityLabel?: string; children?: unknown }) =>
      React.createElement('button', { onClick: p.onPress, 'aria-label': p.accessibilityLabel }, p.children as never),
  };
});
vi.mock('../lib/diagnostics-env', () => ({ versionLabel: () => 'v9.9.9 (test)' }));
vi.mock('./DiagnosticsPanel', () => ({ DiagnosticsPanel: (p: { visible: boolean }) => (p.visible ? <div>diagnostics-open</div> : null) }));

import { NativeAboutScreen } from './NativeAboutScreen';

afterEach(cleanup);

describe('NativeAboutScreen', () => {
  it('renders the legal links, disclaimer, version label and a Close control', () => {
    render(<NativeAboutScreen onClose={vi.fn()} navigateDom={vi.fn()} />);
    for (const l of ['Privacy Policy', 'Terms of Use', 'Support']) expect(screen.getByText(l)).toBeTruthy();
    expect(screen.getByText(/Unofficial/)).toBeTruthy();
    expect(screen.getByText('v9.9.9 (test)')).toBeTruthy();
    expect(screen.getByLabelText('Close About')).toBeTruthy();
  });

  it('7 quick taps on the version label open Diagnostics (6 do not)', () => {
    render(<NativeAboutScreen onClose={vi.fn()} navigateDom={vi.fn()} />);
    const version = screen.getByText('v9.9.9 (test)');
    for (let i = 0; i < 6; i++) fireEvent.click(version);
    expect(screen.queryByText('diagnostics-open')).toBeNull();
    fireEvent.click(version);
    expect(screen.getByText('diagnostics-open')).toBeTruthy();
  });

  it('a legal row dismisses the overlay BEFORE handing the path to the DOM', () => {
    const calls: string[] = [];
    const onClose = vi.fn(() => void calls.push('close'));
    const navigateDom = vi.fn((p: string) => (calls.push(`dom:${p}`), Promise.resolve(true)));
    render(<NativeAboutScreen onClose={onClose} navigateDom={navigateDom} />);
    fireEvent.click(screen.getByLabelText('Open Privacy Policy'));
    expect(calls).toEqual(['close', 'dom:/privacy']);
  });

  it('Close only dismisses', () => {
    const navigateDom = vi.fn();
    const onClose = vi.fn();
    render(<NativeAboutScreen onClose={onClose} navigateDom={navigateDom} />);
    fireEvent.click(screen.getByLabelText('Close About'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(navigateDom).not.toHaveBeenCalled();
  });
});
