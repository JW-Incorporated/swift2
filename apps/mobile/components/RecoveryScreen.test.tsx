// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
    StyleSheet: { create: (s: unknown) => s },
    Pressable: (p: { onPress?: () => void; accessibilityLabel?: string; children?: unknown }) =>
      React.createElement('button', { onClick: p.onPress, 'aria-label': p.accessibilityLabel }, p.children as never),
  };
});

const reloadAsync = vi.fn(async () => {});
vi.mock('expo-updates', () => ({ reloadAsync: () => reloadAsync(), updateId: 'u1' }));
vi.mock('expo-application', () => ({ nativeBuildVersion: '7' }));
const store = { rec: null as unknown, saved: [] as unknown[] };
vi.mock('../lib/watchdog-store', () => ({
  currentBuildKey: () => '7:u1',
  loadWatchdogRecord: async () => store.rec,
  saveWatchdogRecord: async (r: unknown) => (store.saved.push(r), true),
}));
const sendDiagReport = vi.fn(async (_p: unknown) => ({ ok: true }));
vi.mock('../lib/diagnostics-send', () => ({ sendDiagReport: (p: unknown) => sendDiagReport(p) }));
vi.mock('../lib/diagnostics', () => ({
  createTapUnlock: () => () => false,
  buildDiagPayload: () => ({ kind: 'diag' }),
  diagCollector: { summary: () => ({}) },
}));
vi.mock('../lib/diagnostics-env', () => ({ readDiagEnv: () => ({}) }));

import { RecoveryScreen } from './RecoveryScreen';
import { shouldMountHotCorner } from '../lib/diag-hot-corner';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { decideMount, freshRecord, recordStrike, shouldMountDom } from '../lib/watchdog';

beforeEach(() => {
  reloadAsync.mockClear();
  sendDiagReport.mockClear();
  store.saved = [];
  store.rec = { ...freshRecord('7:u1', 1), state: 'fallback', strikes: 2, fallbackCycles: 1, fallbackLaunchesRemaining: 1 };
});
afterEach(cleanup);

describe('RecoveryScreen', () => {
  it('renders the message, Retry and Send report', () => {
    render(<RecoveryScreen />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByLabelText('Retry')).toBeTruthy();
    expect(screen.getByLabelText('Send report')).toBeTruthy();
  });

  it('Retry writes an idle record (strikes cleared, fallbackCycles kept) then reloads once', async () => {
    render(<RecoveryScreen />);
    fireEvent.click(screen.getByLabelText('Retry'));
    await waitFor(() => expect(reloadAsync).toHaveBeenCalledTimes(1));
    expect(store.saved).toHaveLength(1);
    expect(store.saved[0]).toMatchObject({ state: 'idle', strikes: 0, fallbackCycles: 1, fallbackLaunchesRemaining: 0 });
  });

  it('a double-tap on Retry reloads once', async () => {
    render(<RecoveryScreen />);
    const retry = screen.getByLabelText('Retry');
    fireEvent.click(retry);
    fireEvent.click(retry);
    await waitFor(() => expect(reloadAsync).toHaveBeenCalledTimes(1));
    expect(store.saved).toHaveLength(1);
  });

  it('Send report uses the existing diagnostics sender', async () => {
    render(<RecoveryScreen />);
    fireEvent.click(screen.getByLabelText('Send report'));
    await waitFor(() => expect(sendDiagReport).toHaveBeenCalledTimes(1));
    expect(sendDiagReport).toHaveBeenCalledWith({ kind: 'diag' });
  });

  it('a watchdog strike owes a native launch, and App mounts Recovery (not NativeScreenRouter) there, with the hot corner', () => {
    const { record } = recordStrike({ ...freshRecord('7:u1', 1), strikes: 1 }, 'boom', 2);
    const decision = decideMount(record, '7:u1', 3);
    expect(decision.fallbackActive).toBe(true);
    expect(shouldMountDom(true, decision)).toBe(false);
    const app = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    expect(app).toContain('<RecoveryScreen />');
    expect(app).not.toContain('<NativeScreenRouter');
    expect(shouldMountHotCorner('native')).toBe(true);
  });
});
