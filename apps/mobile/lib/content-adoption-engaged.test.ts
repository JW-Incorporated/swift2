import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDLE_MS, STALE_BACKGROUND_MS, createContentAdoption } from './content-adoption';

function setup() {
  let m: string | null = 'v1';
  let clock = 1_000_000;
  const bump = vi.fn();
  const prepare = vi.fn(async () => true);
  const onSignal = vi.fn();
  const a = createContentAdoption({ differs: (v) => m !== null && v !== m, getMounted: () => m, setMounted: (v) => void (m = v), prepare, bump, onSignal, now: () => clock });
  a.appState('active');
  a.epochStarted();
  a.navReady(vi.fn(async () => true));
  a.readerReady();
  return { a, bump, prepare, onSignal, advance: (ms: number) => void (clock += ms) };
}

const settle = () => vi.advanceTimersByTimeAsync(0);
const bounce = (a: ReturnType<typeof setup>['a']) => {
  a.appState('background');
  a.appState('active');
};

describe('content adoption respects the reader (engaged)', () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  it('pending + foreground while engaged: no re-key, signals the deferral', async () => {
    const { a, bump, onSignal } = setup();
    a.loaded('v2');
    a.route('/', false, true);
    bounce(a);
    await vi.advanceTimersByTimeAsync(IDLE_MS * 5);
    expect(bump).not.toHaveBeenCalled();
    expect(onSignal).toHaveBeenCalledWith('content-adopt-deferred-engaged');
  });

  it('engaged then idle for 2 s adopts once; a blip of engagement restarts the debounce', async () => {
    const { a, bump } = setup();
    a.loaded('v2');
    a.route('/', false, true);
    bounce(a);
    a.route('/', false, false);
    await vi.advanceTimersByTimeAsync(IDLE_MS - 100);
    a.route('/', false, true);
    await vi.advanceTimersByTimeAsync(IDLE_MS);
    expect(bump).not.toHaveBeenCalled();
    a.route('/', false, false);
    await vi.advanceTimersByTimeAsync(IDLE_MS - 1);
    expect(bump).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(bump).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(IDLE_MS * 5);
    expect(bump).toHaveBeenCalledTimes(1);
  });

  it('idle but busy never adopts, even after the debounce', async () => {
    const { a, bump } = setup();
    a.loaded('v2');
    a.route('/', false, true);
    bounce(a);
    a.route('/', true, false);
    await vi.advanceTimersByTimeAsync(IDLE_MS * 5);
    expect(bump).not.toHaveBeenCalled();
    a.route('/', false, false);
    await vi.advanceTimersByTimeAsync(IDLE_MS);
    expect(bump).toHaveBeenCalledTimes(1);
  });

  it('backgrounded >= 30 min adopts on foreground even while engaged; 29 min does not', async () => {
    const stale = setup();
    stale.a.loaded('v2');
    stale.a.route('/', false, true);
    stale.a.appState('inactive');
    stale.a.appState('background');
    stale.advance(STALE_BACKGROUND_MS + 60_000);
    stale.a.appState('active');
    await settle();
    expect(stale.bump).toHaveBeenCalledTimes(1);

    const fresh = setup();
    fresh.a.loaded('v2');
    fresh.a.route('/', false, true);
    fresh.a.appState('background');
    fresh.advance(STALE_BACKGROUND_MS - 60_000);
    fresh.a.appState('active');
    await vi.advanceTimersByTimeAsync(IDLE_MS * 5);
    expect(fresh.bump).not.toHaveBeenCalled();
  });

  it('busy still blocks a stale foreground', async () => {
    const { a, bump, advance } = setup();
    a.loaded('v2');
    a.route('/', true, true);
    a.appState('background');
    advance(STALE_BACKGROUND_MS * 2);
    a.appState('active');
    await settle();
    expect(bump).not.toHaveBeenCalled();
  });

  it('an idle reader still waits the 2 s hold; any engaged signal during it cancels, and so does going to background', async () => {
    const idle = setup();
    idle.a.loaded('v2');
    idle.a.route('/', false, false);
    bounce(idle.a);
    await vi.advanceTimersByTimeAsync(IDLE_MS - 1);
    expect(idle.bump).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(idle.bump).toHaveBeenCalledTimes(1);

    const late = setup();
    late.a.loaded('v2');
    late.a.route('/', false, false);
    bounce(late.a);
    await vi.advanceTimersByTimeAsync(IDLE_MS - 100);
    late.a.route('/', false, true);
    await vi.advanceTimersByTimeAsync(IDLE_MS * 5);
    expect(late.bump).not.toHaveBeenCalled();

    const { a, bump } = setup();
    a.loaded('v2');
    a.route('/', false, true);
    bounce(a);
    a.route('/', false, false);
    a.appState('background');
    await vi.advanceTimersByTimeAsync(IDLE_MS * 5);
    expect(bump).not.toHaveBeenCalled();
  });

  it('engagement is unknown (counts as engaged) until the first route report of the epoch', async () => {
    const { a, bump, onSignal } = setup();
    a.epochStarted();
    a.navReady(vi.fn(async () => true));
    a.readerReady();
    a.loaded('v2');
    bounce(a);
    await vi.advanceTimersByTimeAsync(IDLE_MS * 5);
    expect(bump).not.toHaveBeenCalled();
    expect(onSignal).toHaveBeenCalledWith('content-adopt-deferred-engaged');
    a.route('/', false, false);
    await vi.advanceTimersByTimeAsync(IDLE_MS);
    expect(bump).toHaveBeenCalledTimes(1);
  });

  it('inactive -> active never counts as a background stay, however long', async () => {
    const { a, bump, advance } = setup();
    a.loaded('v2');
    a.route('/', false, true);
    a.appState('inactive');
    advance(STALE_BACKGROUND_MS * 3);
    a.appState('active');
    await vi.advanceTimersByTimeAsync(IDLE_MS * 5);
    expect(bump).not.toHaveBeenCalled();
  });

  it('a clock jump (backwards, or absurdly forwards) is not an elapsed stay', async () => {
    for (const jump of [-STALE_BACKGROUND_MS * 2, 365 * 24 * 60 * 60 * 1000]) {
      const { a, bump, advance } = setup();
      a.loaded('v2');
      a.route('/', false, true);
      a.appState('background');
      advance(jump);
      a.appState('active');
      await vi.advanceTimersByTimeAsync(IDLE_MS * 5);
      expect(bump).not.toHaveBeenCalled();
    }
  });

  it('dispose during the idle hold cancels the adoption', async () => {
    const { a, bump, prepare } = setup();
    a.loaded('v2');
    a.route('/', false, false);
    bounce(a);
    await vi.advanceTimersByTimeAsync(IDLE_MS - 100);
    a.dispose();
    await vi.advanceTimersByTimeAsync(IDLE_MS * 5);
    expect(prepare).not.toHaveBeenCalled();
    expect(bump).not.toHaveBeenCalled();
  });

  it('dispose during an in-flight adoption: the completion commits nothing and prepare sees it is stale', async () => {
    let m: string | null = 'v1';
    const bump = vi.fn();
    const setMounted = vi.fn((v: string) => void (m = v));
    const onSignal = vi.fn();
    let release: (ok: boolean) => void = () => {};
    let current: () => boolean = () => true;
    const prepare = vi.fn((isCurrent: () => boolean) => {
      current = isCurrent;
      return new Promise<boolean>((r) => (release = r));
    });
    const a = createContentAdoption({ differs: (v) => v !== m, getMounted: () => m, setMounted, prepare, bump, onSignal });
    a.appState('active');
    a.epochStarted();
    a.navReady(vi.fn(async () => true));
    a.readerReady();
    a.route('/', false, false);
    a.loaded('v2');
    bounce(a);
    await vi.advanceTimersByTimeAsync(IDLE_MS);
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(current()).toBe(true);
    a.dispose();
    expect(current()).toBe(false);
    release(true);
    await vi.advanceTimersByTimeAsync(IDLE_MS * 5);
    expect(setMounted).not.toHaveBeenCalled();
    expect(bump).not.toHaveBeenCalled();
    expect(onSignal).not.toHaveBeenCalledWith('content-adopt', expect.anything());
  });

  it('cold start is unchanged: the first load records the baseline and nothing re-keys', async () => {
    const { a, bump } = setup();
    a.route('/', false, true);
    a.loaded('v1');
    bounce(a);
    await vi.advanceTimersByTimeAsync(IDLE_MS * 5);
    expect(bump).not.toHaveBeenCalled();
  });
});
