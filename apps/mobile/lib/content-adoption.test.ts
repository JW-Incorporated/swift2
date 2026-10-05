import { describe, expect, it, vi } from 'vitest';
import { createContentAdoption } from './content-adoption';

const tick = () => new Promise((r) => setTimeout(r, 0));

function setup(mounted: string | null = 'v1') {
  let m = mounted;
  const order: string[] = [];
  const bump = vi.fn(() => void order.push('bump'));
  const prepare = vi.fn(async () => (order.push('prepare'), true));
  const onSignal = vi.fn();
  const a = createContentAdoption({ differs: (v) => m !== null && v !== m, getMounted: () => m, setMounted: (v) => void (order.push('setMounted'), (m = v)), prepare, bump, onSignal });
  const navigate = vi.fn(async (_p: string) => true);
  a.appState('active');
  a.epochStarted();
  a.navReady(navigate);
  a.readerReady();
  order.length = 0;
  return { a, bump, prepare, navigate, onSignal, order, mounted: () => m };
}

describe('content adoption', () => {
  it('newer bundle + background -> foreground: prepares then bumps once, navigates to the latest route only after navReady AND reader ready', async () => {
    const { a, bump, order, mounted } = setup();
    a.route('/privacy');
    a.route('/terms?x=1');
    a.loaded('v2');
    a.appState('background');
    expect(bump).not.toHaveBeenCalled();
    a.appState('inactive');
    a.appState('active');
    await tick();
    expect(order).toEqual(['prepare', 'setMounted', 'bump']);
    expect(mounted()).toBe('v2');
    a.route('/');
    a.epochStarted();
    const next = vi.fn(async (_p: string) => true);
    a.navReady(next);
    expect(next).not.toHaveBeenCalled();
    a.readerReady();
    expect(next).toHaveBeenCalledExactlyOnceWith('/terms?x=1');
    a.appState('background');
    a.appState('active');
    await tick();
    expect(bump).toHaveBeenCalledTimes(1);
  });

  it('same version never re-keys; no transition (already active) never re-keys', async () => {
    const { a, bump } = setup();
    a.loaded('v1');
    a.appState('background');
    a.appState('active');
    a.loaded('v2');
    a.appState('active');
    await tick();
    expect(bump).not.toHaveBeenCalled();
  });

  it('an unknown mounted version (cache without a stamp) arms on the first load; a null baseline records it instead', async () => {
    const u = setup('unknown-mounted');
    u.a.loaded('v1');
    u.a.appState('background');
    u.a.appState('active');
    await tick();
    expect(u.bump).toHaveBeenCalledTimes(1);
    expect(u.mounted()).toBe('v1');
    const { a, bump, mounted } = setup(null);
    a.loaded('v1');
    a.appState('background');
    a.appState('active');
    await tick();
    expect(mounted()).toBe('v1');
    expect(bump).not.toHaveBeenCalled();
  });

  it('never re-keys mid-handshake: defers until navReady AND reader ready, then adopts once', async () => {
    const { a, bump, navigate } = setup();
    a.route('/support');
    a.loaded('v2');
    a.epochStarted();
    a.appState('background');
    a.appState('active');
    await tick();
    expect(bump).not.toHaveBeenCalled();
    a.navReady(navigate);
    await tick();
    expect(bump).not.toHaveBeenCalled();
    a.readerReady();
    await tick();
    expect(bump).toHaveBeenCalledTimes(1);
    a.epochStarted();
    a.route('/');
    const next = vi.fn(async (_p: string) => true);
    a.navReady(next);
    a.readerReady();
    expect(next).toHaveBeenCalledExactlyOnceWith('/support');
    await tick();
    expect(bump).toHaveBeenCalledTimes(1);
  });

  it('defers while the user is busy (draft / ClownBot / feedback) and adopts at the next foreground when idle', async () => {
    const { a, bump, onSignal } = setup();
    a.loaded('v2');
    a.route('/', true);
    a.appState('background');
    a.appState('active');
    await tick();
    expect(bump).not.toHaveBeenCalled();
    expect(onSignal).toHaveBeenCalledWith('content-adopt-deferred-busy');
    a.route('/', false);
    a.appState('background');
    a.appState('active');
    await tick();
    expect(bump).toHaveBeenCalledTimes(1);
  });

  it('a busy flag raised while waiting for the epoch to be ready cancels that adoption', async () => {
    const { a, bump, navigate } = setup();
    a.loaded('v2');
    a.epochStarted();
    a.appState('background');
    a.appState('active');
    a.route('/', true);
    a.navReady(navigate);
    a.readerReady();
    await tick();
    expect(bump).not.toHaveBeenCalled();
  });

  it('a failed restore navigate signals and is not retried', async () => {
    const { a, onSignal } = setup();
    a.route('/privacy');
    a.loaded('v2');
    a.appState('background');
    a.appState('active');
    await tick();
    a.epochStarted();
    const next = vi.fn(async (_p: string) => false);
    a.navReady(next);
    a.readerReady();
    await tick();
    expect(onSignal).toHaveBeenCalledWith('content-adopt-nav-failed', '/privacy');
    a.readerReady();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('prepare false (or throwing): no setMounted, no bump, pending kept; the next foreground retries once', async () => {
    const { a, bump, prepare, order, onSignal } = setup();
    prepare.mockResolvedValueOnce(false);
    a.loaded('v2');
    a.appState('background');
    a.appState('active');
    await tick();
    expect(order).toEqual([]);
    expect(bump).not.toHaveBeenCalled();
    expect(onSignal).toHaveBeenCalledWith('content-adopt-prepare-failed');
    prepare.mockRejectedValueOnce(new Error('x'));
    a.appState('background');
    a.appState('active');
    await tick();
    expect(bump).not.toHaveBeenCalled();
    expect(prepare).toHaveBeenCalledTimes(2);
    a.appState('background');
    a.appState('active');
    await tick();
    expect(bump).toHaveBeenCalledTimes(1);
  });

  it('a version that lands while prepare is awaiting is the one committed', async () => {
    const { a, bump, prepare, mounted } = setup();
    let release: (ok: boolean) => void = () => {};
    prepare.mockImplementationOnce(() => new Promise<boolean>((r) => (release = r)));
    a.loaded('v2');
    a.appState('background');
    a.appState('active');
    await tick();
    a.loaded('v3');
    release(true);
    await tick();
    expect(mounted()).toBe('v3');
    expect(bump).toHaveBeenCalledTimes(1);
  });

  it('two foregrounds during the prepare await produce one bump', async () => {
    const { a, bump, prepare } = setup();
    let release: (ok: boolean) => void = () => {};
    prepare.mockImplementationOnce(() => new Promise<boolean>((r) => (release = r)));
    a.loaded('v2');
    a.appState('background');
    a.appState('active');
    await tick();
    a.appState('background');
    a.appState('active');
    release(true);
    await tick();
    a.appState('background');
    a.appState('active');
    await tick();
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(bump).toHaveBeenCalledTimes(1);
  });
});
