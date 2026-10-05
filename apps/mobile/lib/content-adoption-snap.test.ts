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

  it("a route report without a snapshot keeps the epoch's last one; epochStarted resets it", async () => {
    const { a, restore, newEpoch, advance } = setup();
    a.loaded('v2');
    a.route('/', false, true, snap(7));
    a.route('/', false, true);
    a.appState('background');
    advance(STALE_BACKGROUND_MS);
    a.appState('active');
    await flush();
    newEpoch();
    await flush();
    expect(restore).toHaveBeenCalledWith(snap(7));
    restore.mockClear();
    newEpoch();
    await flush();
    expect(restore).not.toHaveBeenCalled();
  });

  it("crash re-key (no adoption): the dying epoch's route and snapshot are replayed to the next", async () => {
    const { a, navigate, restore, newEpoch } = setup();
    a.route('/?era=fearless', false, false, snap(42, 'fearless'));
    newEpoch();
    await flush();
    expect(navigate).toHaveBeenCalledWith('/?era=fearless');
    expect(restore).toHaveBeenCalledWith(snap(42, 'fearless'));
  });

  it('nothing is replayed when the dying epoch never reported', async () => {
    const { navigate, restore, newEpoch } = setup();
    newEpoch();
    await flush();
    expect(navigate).not.toHaveBeenCalled();
    expect(restore).not.toHaveBeenCalled();
  });
});
