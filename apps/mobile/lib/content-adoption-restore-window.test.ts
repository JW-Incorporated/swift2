import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReaderSnap } from '@swift2/ui';
import { RESTORE_WINDOW_MS, STALE_BACKGROUND_MS, createContentAdoption } from './content-adoption';

const PATH = '/?era=lover';
const snap = (scrollY: number): ReaderSnap => ({ v: 1, mode: 'era', eraId: 'lover', itemId: 'm1', scrollY });

// Adopts, re-keys, and leaves the restore navigation in flight (`done` resolves it).
async function inFlight() {
  let m: string | null = 'v1';
  let clock = 1_000_000;
  const a = createContentAdoption({ differs: (v) => m !== null && v !== m, getMounted: () => m, setMounted: (v) => void (m = v), prepare: async () => true, bump: vi.fn(), now: () => clock });
  const restore = vi.fn();
  const navigate = vi.fn(async () => true);
  a.appState('active');
  a.epochStarted();
  a.navReady(navigate, restore);
  a.readerReady();
  a.loaded('v2');
  a.route(PATH, false, true, snap(5));
  a.appState('background');
  clock += STALE_BACKGROUND_MS;
  a.appState('active');
  await vi.advanceTimersByTimeAsync(0);
  let done!: (ok: boolean) => void;
  navigate.mockImplementationOnce(() => new Promise<boolean>((r) => void (done = r)));
  a.epochStarted();
  a.navReady(navigate, restore);
  a.readerReady();
  await vi.advanceTimersByTimeAsync(0);
  return { a, restore, navigate, done: (ok = true) => done(ok) };
}

describe('restore navigation window (#5124)', () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  it('normal restore still replays', async () => {
    const h = await inFlight();
    expect(h.navigate).toHaveBeenCalledWith(PATH);
    h.done();
    await vi.advanceTimersByTimeAsync(0);
    expect(h.restore).toHaveBeenCalledWith(snap(5));
  });

  it("the restore's own engaged report (same path) does not cancel it", async () => {
    const h = await inFlight();
    h.a.route(PATH, false, true, snap(0));
    h.done();
    await vi.advanceTimersByTimeAsync(0);
    expect(h.restore).toHaveBeenCalledTimes(1);
  });

  it('a busy report during the restore navigation cancels the replay', async () => {
    const h = await inFlight();
    h.a.route(PATH, true, true, snap(0));
    h.done();
    await vi.advanceTimersByTimeAsync(0);
    expect(h.restore).not.toHaveBeenCalled();
  });

  it('an engaged report on a different path during the restore navigation cancels the replay', async () => {
    const h = await inFlight();
    h.a.route('/?era=folklore', false, true, null);
    h.done();
    await vi.advanceTimersByTimeAsync(0);
    expect(h.restore).not.toHaveBeenCalled();
  });

  it('a hung navigateDom is abandoned after the cap: a late settle does not replay', async () => {
    const h = await inFlight();
    await vi.advanceTimersByTimeAsync(RESTORE_WINDOW_MS);
    h.done();
    await vi.advanceTimersByTimeAsync(0);
    expect(h.restore).not.toHaveBeenCalled();
  });
});
