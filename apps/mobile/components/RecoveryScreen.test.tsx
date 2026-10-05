// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../web/node_modules/react-dom'));

const announce = vi.hoisted(() => vi.fn());
const openURL = vi.hoisted(() => vi.fn(async (_u: string) => true));
vi.mock('react-native', async () => {
  const React = await import('react');
  const el = (tag: string) => (p: Record<string, unknown>) => React.createElement(tag, null, p.children as never);
  return {
    View: el('div'),
    Text: (p: { children?: unknown; accessibilityLiveRegion?: string }) =>
      React.createElement('span', { 'data-live': p.accessibilityLiveRegion }, p.children as never),
    StyleSheet: { create: (s: unknown) => s },
    Platform: { OS: 'ios' },
    AccessibilityInfo: { announceForAccessibility: announce },
    Linking: { openURL },
    Pressable: (p: {
      onPress?: () => void;
      disabled?: boolean;
      accessibilityLabel?: string;
      accessibilityState?: { disabled?: boolean; busy?: boolean };
      children?: unknown;
    }) =>
      React.createElement(
        'button',
        {
          onClick: p.disabled ? undefined : p.onPress,
          'aria-label': p.accessibilityLabel,
          'aria-disabled': p.accessibilityState?.disabled ? 'true' : 'false',
          'aria-busy': p.accessibilityState?.busy ? 'true' : 'false',
        },
        p.children as never,
      ),
  };
});

const retryDomAttempt = vi.hoisted(() => vi.fn());
vi.mock('../lib/recovery-retry', () => ({ retryDomAttempt: () => retryDomAttempt() }));
const sendDiagReport = vi.fn(async (_p: unknown) => ({ ok: true }));
vi.mock('../lib/diagnostics-send', () => ({ sendDiagReport: (p: unknown) => sendDiagReport(p) }));
vi.mock('../lib/diagnostics', () => ({
  buildDiagPayload: () => ({ kind: 'diag' }),
  createTapUnlock: () => () => false,
  diagCollector: { summary: () => ({}) },
}));
vi.mock('../lib/diagnostics-env', () => ({ readDiagEnv: () => ({}) }));

import { RELOAD_GRACE_MS, RecoveryScreen } from './RecoveryScreen';
import { shouldMountHotCorner } from '../lib/diag-hot-corner';
import { decideMount, freshRecord, recordStrike, shouldMountDom } from '../lib/watchdog';

beforeEach(() => {
  retryDomAttempt.mockReset().mockResolvedValue('reload-requested');
  sendDiagReport.mockClear();
  announce.mockClear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const retryBtn = () => screen.getByLabelText('Retry');

describe('RecoveryScreen', () => {
  it('renders the message, Retry and Send report', () => {
    render(<RecoveryScreen />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(retryBtn()).toBeTruthy();
    expect(screen.getByLabelText('Send report')).toBeTruthy();
  });

  it('a double-tap on Retry requests one reload and shows the busy state', async () => {
    render(<RecoveryScreen />);
    fireEvent.click(retryBtn());
    fireEvent.click(retryBtn());
    await waitFor(() => expect(retryDomAttempt).toHaveBeenCalledTimes(1));
    expect(retryBtn().getAttribute('aria-busy')).toBe('true');
    expect(retryBtn().getAttribute('aria-disabled')).toBe('true');
    expect(announce).toHaveBeenCalledWith('Retrying');
  });

  it('a failed record write shows a fixed error and keeps Retry enabled', async () => {
    retryDomAttempt.mockResolvedValue('save-failed');
    render(<RecoveryScreen />);
    fireEvent.click(retryBtn());
    await screen.findByText("Couldn't restart. Please try again.");
    expect(retryBtn().getAttribute('aria-disabled')).toBe('false');
    expect(announce).toHaveBeenCalledWith("Couldn't restart. Please try again.");
    fireEvent.click(retryBtn());
    await waitFor(() => expect(retryDomAttempt).toHaveBeenCalledTimes(2));
  });

  it('a rejected reload shows the error and re-enables Retry', async () => {
    retryDomAttempt.mockResolvedValue('reload-failed');
    render(<RecoveryScreen />);
    fireEvent.click(retryBtn());
    await screen.findByText("Couldn't restart. Please try again.");
    expect(retryBtn().getAttribute('aria-disabled')).toBe('false');
  });

  it('a reload that resolves without restarting re-enables Retry after the grace period', async () => {
    vi.useFakeTimers();
    render(<RecoveryScreen />);
    await act(async () => {
      fireEvent.click(retryBtn());
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(retryBtn().getAttribute('aria-disabled')).toBe('true');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(RELOAD_GRACE_MS);
    });
    expect(screen.getByText("The app didn't restart. Please try again.")).toBeTruthy();
    expect(retryBtn().getAttribute('aria-disabled')).toBe('false');
  });

  it.each([
    ['Privacy Policy', 'https://www.longlivets.com/privacy'],
    ['Terms of Use', 'https://www.longlivets.com/terms'],
    ['Support', 'https://www.longlivets.com/support'],
  ])('the %s link opens %s externally', (label, url) => {
    render(<RecoveryScreen />);
    fireEvent.click(screen.getByLabelText(label));
    expect(openURL).toHaveBeenCalledWith(url);
  });

  it('Send report uses the existing diagnostics sender and announces the result', async () => {
    render(<RecoveryScreen />);
    fireEvent.click(screen.getByLabelText('Send report'));
    await waitFor(() => expect(sendDiagReport).toHaveBeenCalledTimes(1));
    expect(sendDiagReport).toHaveBeenCalledWith({ kind: 'diag' });
    await screen.findByText('Report sent');
    expect(announce).toHaveBeenCalledWith('Report sent');
    expect(document.querySelector('[data-live="polite"]')).toBeTruthy();
  });

  it('a watchdog strike owes a native launch that mounts Recovery, with the hot corner', () => {
    const { record } = recordStrike({ ...freshRecord('7:u1', 1), strikes: 1 }, 'boom', 2);
    const decision = decideMount(record, '7:u1', 3);
    expect(shouldMountDom(true, decision)).toBe(false);
    expect(shouldMountHotCorner('native')).toBe(true);
  });
});
