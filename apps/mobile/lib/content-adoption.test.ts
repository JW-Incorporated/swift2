import { describe, expect, it, vi } from 'vitest';
import { createContentAdoption } from './content-adoption';

function setup(mounted: string | null = 'v1') {
  let m = mounted;
  const bump = vi.fn();
  const onSignal = vi.fn();
  const a = createContentAdoption({ differs: (v) => m !== null && v !== m, getMounted: () => m, setMounted: (v) => void (m = v), bump, onSignal });
  const navigate = vi.fn(async (_p: string) => true);
  a.appState('active');
  a.epochStarted();
  a.navReady(navigate);
  return { a, bump, navigate, onSignal, mounted: () => m };
}

describe('content adoption', () => {
  it('newer bundle + background -> foreground: bumps once, navigates to the latest route after the new epoch is ready', () => {
    const { a, bump, navigate, mounted } = setup();
    a.route('/privacy');
    a.route('/terms?x=1');
    a.loaded('v2');
    a.appState('background');
    expect(bump).not.toHaveBeenCalled();
    a.appState('inactive');
    a.appState('active');
    expect(bump).toHaveBeenCalledTimes(1);
    expect(mounted()).toBe('v2');
    a.route('/');
    a.epochStarted();
    expect(navigate).not.toHaveBeenCalled();
    const next = vi.fn(async (_p: string) => true);
    a.navReady(next);
    expect(next).toHaveBeenCalledExactlyOnceWith('/terms?x=1');
    a.appState('background');
    a.appState('active');
    expect(bump).toHaveBeenCalledTimes(1);
  });

  it('same version never re-keys; no transition (already active) never re-keys', () => {
    const { a, bump } = setup();
    a.loaded('v1');
    a.appState('background');
    a.appState('active');
    expect(bump).not.toHaveBeenCalled();
    a.loaded('v2');
    a.appState('active');
    expect(bump).not.toHaveBeenCalled();
  });

  it('first load with nothing mounted records the baseline without arming', () => {
    const { a, bump, mounted } = setup(null);
    a.loaded('v1');
    a.appState('background');
    a.appState('active');
    expect(mounted()).toBe('v1');
    expect(bump).not.toHaveBeenCalled();
  });

  it('never re-keys mid-handshake: defers to the epoch ready, then adopts once', () => {
    const { a, bump, navigate } = setup();
    a.route('/support');
    a.loaded('v2');
    a.epochStarted();
    a.appState('background');
    a.appState('active');
    expect(bump).not.toHaveBeenCalled();
    a.navReady(navigate);
    expect(bump).toHaveBeenCalledTimes(1);
    a.epochStarted();
    a.route('/');
    const next = vi.fn(async (_p: string) => true);
    a.navReady(next);
    expect(next).toHaveBeenCalledExactlyOnceWith('/support');
    expect(bump).toHaveBeenCalledTimes(1);
  });

  it('a failed restore navigate signals and is not retried', async () => {
    const { a, onSignal } = setup();
    a.route('/privacy');
    a.loaded('v2');
    a.appState('background');
    a.appState('active');
    a.epochStarted();
    const next = vi.fn(async (_p: string) => false);
    a.navReady(next);
    await Promise.resolve();
    expect(onSignal).toHaveBeenCalledWith('content-adopt-nav-failed', '/privacy');
    a.navReady(next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
