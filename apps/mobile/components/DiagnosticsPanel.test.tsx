// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../web/node_modules/react-dom'));

type P = Record<string, unknown> & { children?: unknown };
vi.mock('react-native', async () => {
  const R = await import('react');
  const box = (tag: string) => (p: P) => R.createElement(tag, null, p.children as never);
  return {
    Modal: box('div'),
    View: box('div'),
    ScrollView: box('div'),
    Text: (p: P) =>
      R.createElement('span', { 'data-live': p.accessibilityLiveRegion as string, 'data-testid': p.testID as string, role: p.accessibilityRole as string }, p.children as never),
    Pressable: (p: P) =>
      R.createElement(
        'button',
        { 'aria-label': p.accessibilityLabel as string, 'data-style': JSON.stringify(([] as unknown[]).concat(p.style).flat(Infinity).filter(Boolean)) },
        p.children as never,
      ),
    Switch: (p: P) => R.createElement('input', { type: 'checkbox', role: 'switch', 'aria-label': p.accessibilityLabel as string }),
    Share: { share: vi.fn() },
    StyleSheet: { create: (s: unknown) => s },
  };
});
vi.mock('../lib/diagnostics', () => ({
  buildDiagPayload: () => ({}),
  diagCollector: { summary: () => ({ launch: 'x', stages: [] }) },
  getMountInfo: () => ({ mount: 'dom', reason: 'r', source: 's' }),
  isPointStage: () => false,
}));
vi.mock('../lib/diagnostics-env', () => ({ readDiagEnv: () => ({ model: 'm', os: 'o', build: 'b', updateId: 'u' }) }));
vi.mock('../lib/diagnostics-override', () => ({
  getForceDomFailure: async () => 'off',
  getUseTestPage: async () => false,
  persistAndReread: async () => ({ value: false }),
  setForceDomFailure: async () => undefined,
  setUseTestPage: async () => undefined,
}));
vi.mock('../dom/reader/probe', () => ({ latestProbeJson: () => null }));
vi.mock('../lib/dom-probe-store', () => ({ readerSpikeLines: () => [] }));
vi.mock('../lib/diagnostics-send', () => ({ sendDiagReport: async () => ({ ok: true }) }));
vi.mock('../lib/speed-test', () => ({ isActive: () => false, panelLines: () => [] }));
vi.mock('../lib/speed-test-runtime', () => ({
  speedTest: { state: async () => null, onChange: () => () => undefined, queued: () => 0, enable: async () => undefined, disable: async () => undefined },
}));
vi.mock('../lib/watchdog-policy', () => ({ mountLine: () => 'mount', watchdogLines: () => [] }));
vi.mock('../lib/watchdog-store', () => ({ clearWatchdogRecord: async () => undefined, loadWatchdogRecord: async () => null }));

import { DiagnosticsPanel } from './DiagnosticsPanel';

afterEach(cleanup);

const minHeight = (el: HTMLElement) => Math.max(...JSON.parse(el.getAttribute('data-style')!).map((s: { minHeight?: number }) => s.minHeight ?? 0));

describe('DiagnosticsPanel a11y', () => {
  it('Close is named for its visible "Done" text and is a 44pt button', () => {
    render(<DiagnosticsPanel visible onClose={() => undefined} />);
    const close = screen.getByLabelText('Done');
    expect(close.textContent).toBe('Done');
    expect(minHeight(close)).toBeGreaterThanOrEqual(44);
  });

  it('both Switches carry their visible text as label', () => {
    render(<DiagnosticsPanel visible onClose={() => undefined} />);
    const labels = screen.getAllByRole('switch').map((s) => s.getAttribute('aria-label'));
    expect(labels).toEqual(['Use WP0.4 test page, not ReaderSpike (next launch)', 'Speed test mode (auto-sends the next 10 launches)']);
    for (const l of labels) expect(screen.getByText(l!)).toBeTruthy();
  });

  it('mode buttons are 44pt and the status text is a polite live region', () => {
    render(<DiagnosticsPanel visible onClose={() => undefined} />);
    for (const mode of ['off', 'throw', 'hang']) {
      expect(minHeight(screen.getByText(mode).parentElement as HTMLElement)).toBeGreaterThanOrEqual(44);
    }
    expect(screen.getByTestId('diag-status').getAttribute('data-live')).toBe('polite');
  });
});
