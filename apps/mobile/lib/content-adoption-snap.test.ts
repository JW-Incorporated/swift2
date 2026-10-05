import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReaderSnap } from '@swift2/ui';
import { STALE_BACKGROUND_MS, createContentAdoption } from './content-adoption';

const snap = (scrollY: number, eraId = 'lover'): ReaderSnap => ({ v: 1, mode: 'era', eraId, itemId: 'm1', scrollY });

function setup() {
  let m: string | null = 'v1';
  let clock = 1_000_000;
  const bump = vi.fn();
  const a = createContentAdoption({ differs: (v) => m !== null && v !== m, getMounted: () => m, setMounted: (v) => void (m = v), prepare: async () => true, bump, now: () => clock });
  const navigate = vi.fn(async () => true);
  const restore = vi.fn();
  const newEpoch = () => {
    a.epochStarted();
    a.navReady(navigate, restore);
    a.readerReady();
  };
  a.appState('active');
  newEpoch();
  return { a, bump, navigate, restore, newEpoch, advance: (ms: number) => void (clock += ms) };
}

const flush = () => vi.advanceTimersByTimeAsync(0);

describe('content adoption replays the reader snapshot (#5114)', () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  it('adoption re-key: the latest snapshot of the old epoch is sent once, after the route navigation', async () => {
    const { a, bump, navigate, restore, newEpoch, advance } = setup();
    a.loaded('v2');
    a.route('/?era=lover', false, true, snap(100));
    a.route('/?era=lover', false, true, snap(900));
    a.appState('background');
    advance(STALE_BACKGROUND_MS);
    a.appState('active');
    await flush();
    expect(bump).toHaveBeenCalledTimes(1);
    newEpoch();
    await flush();
    expect(navigate).toHaveBeenCalledWith('/?era=lover');
    expect(restore).toHaveBeenCalledTimes(1);
    expect(restore).toHaveBeenCalledWith(snap(900));
    a.readerReady();
    await flush();
    expect(restore).toHaveBeenCalledTimes(1);
  });

  const adoptRekey = async (h: ReturnType<typeof setup>) => {
    h.a.appState('background');
    h.advance(STALE_BACKGROUND_MS);
    h.a.appState('active');
    await flush();
  };

  it('a route report without a snapshot clears it (never a stale snapshot paired with a newer route)', async () => {
    const h = setup();
    h.a.loaded('v2');
    h.a.route('/', false, true, snap(7));
    h.a.route('/', false, true);
    await adoptRekey(h);
    h.newEpoch();
    await flush();
    expect(h.restore).not.toHaveBeenCalled();
  });

  it('a bare route with a snapshot sends the snapshot immediately, without a navigate that would reset it', async () => {
    const h = setup();
    h.a.loaded('v2');
    h.a.route('/', false, true, snap(7));
    await adoptRekey(h);
    h.newEpoch();
    expect(h.restore).toHaveBeenCalledWith(snap(7));
    expect(h.navigate).not.toHaveBeenCalled();
    h.restore.mockClear();
    h.newEpoch();
    await flush();
    expect(h.restore).not.toHaveBeenCalled();
  });

  it('crash re-key (no adoption): neither the route nor the snapshot is replayed, even one pending from a half-done adoption', async () => {
    const h = setup();
    h.a.route('/?era=fearless', false, false, snap(42, 'fearless'));
    h.newEpoch();
    await flush();
    expect(h.navigate).not.toHaveBeenCalled();
    expect(h.restore).not.toHaveBeenCalled();
    h.a.loaded('v2');
    h.a.route('/?era=lover', false, true, snap(1));
    await adoptRekey(h);
    h.a.epochStarted();
    h.a.epochStarted();
    h.a.navReady(h.navigate, h.restore);
    h.a.readerReady();
    await flush();
    expect(h.navigate).not.toHaveBeenCalled();
    expect(h.restore).not.toHaveBeenCalled();
  });

  it('a tap/deep link reaching the new epoch before the replay wins: no navigate, no snapshot', async () => {
    const h = setup();
    h.a.loaded('v2');
    h.a.route('/?era=lover', false, true, snap(3));
    await adoptRekey(h);
    h.a.epochStarted();
    h.a.navReady(h.navigate, h.restore);
    h.a.userNavigated();
    h.a.readerReady();
    await flush();
    expect(h.navigate).not.toHaveBeenCalled();
    expect(h.restore).not.toHaveBeenCalled();
  });

  it('a tap while the route navigation is in flight cancels the snapshot', async () => {
    const h = setup();
    let done!: (ok: boolean) => void;
    h.navigate.mockImplementationOnce(() => new Promise<boolean>((r) => void (done = r)));
    h.a.loaded('v2');
    h.a.route('/?era=lover', false, true, snap(3));
    await adoptRekey(h);
    h.newEpoch();
    h.a.userNavigated();
    done(true);
    await flush();
    expect(h.restore).not.toHaveBeenCalled();
  });

  it('user interaction reported by the DOM before the replay (busy) cancels it', async () => {
    const h = setup();
    h.a.loaded('v2');
    h.a.route('/', false, true, snap(3));
    await adoptRekey(h);
    h.a.epochStarted();
    h.a.navReady(h.navigate, h.restore);
    h.a.route('/', true, false);
    h.a.readerReady();
    await flush();
    expect(h.restore).not.toHaveBeenCalled();
  });
});
