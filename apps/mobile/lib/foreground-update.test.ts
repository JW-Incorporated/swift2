import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./recovery-retry', () => ({ OTA_CHECK_TIMEOUT_MS: 8000, OTA_FETCH_TIMEOUT_MS: 30000 }));

import {
  BACKGROUND_APPLY_MS,
  CHECK_INTERVAL_MS,
  decideForegroundAction,
  startForegroundUpdate,
  type ForegroundDecisionInput,
} from './foreground-update';

const base: ForegroundDecisionInput = {
  now: 1_000_000,
  lastCheckAt: null,
  backgroundedAt: null,
  pendingUpdate: false,
  lastReloadAt: null,
  hasPendingLink: false,
};

describe('decideForegroundAction', () => {
  it('checks when never checked, then throttles for 10 minutes', () => {
    expect(decideForegroundAction(base)).toBe('check');
    expect(decideForegroundAction({ ...base, lastCheckAt: base.now - CHECK_INTERVAL_MS + 1 })).toBe('none');
    expect(decideForegroundAction({ ...base, lastCheckAt: base.now - CHECK_INTERVAL_MS })).toBe('check');
  });

  it('never reloads while the fan is using the app (no background gap)', () => {
    expect(decideForegroundAction({ ...base, pendingUpdate: true, backgroundedAt: null })).toBe('none');
  });

  it('reloads only after at least 30 seconds in the background', () => {
    const p = { ...base, pendingUpdate: true };
    expect(decideForegroundAction({ ...p, backgroundedAt: base.now - BACKGROUND_APPLY_MS + 1 })).toBe('none');
    expect(decideForegroundAction({ ...p, backgroundedAt: base.now - BACKGROUND_APPLY_MS })).toBe('reload');
  });

  it('loop guard: a reload earlier in this process blocks another', () => {
    const p = { ...base, pendingUpdate: true, backgroundedAt: 0 };
    expect(decideForegroundAction({ ...p, lastReloadAt: base.now - 10 * 60_000 })).toBe('none');
    expect(decideForegroundAction({ ...p, lastReloadAt: base.now - 1000 })).toBe('none');
  });

  it('skips the reload when a link is pending', () => {
    expect(decideForegroundAction({ ...base, pendingUpdate: true, backgroundedAt: 0, hasPendingLink: true })).toBe('none');
  });
});

function harness(over: { updates?: Partial<Record<string, unknown>>; planReload?: () => Promise<boolean>; link?: () => boolean; isDev?: boolean } = {}) {
  let clock = 1_000_000;
  let cb: (s: string) => void = () => undefined;
  const appState = { current: 'active', subscribe: (fn: (s: string) => void) => ((cb = fn), () => undefined) };
  const updates = {
    isEnabled: true,
    checkForUpdateAsync: vi.fn(async () => ({ isAvailable: true })),
    fetchUpdateAsync: vi.fn(async () => ({ isNew: true })),
    reloadAsync: vi.fn(async () => undefined),
    ...over.updates,
  };
  const planReload = vi.fn(over.planReload ?? (async () => true));
  const stop = startForegroundUpdate({
    updates: updates as never,
    appState,
    planReload,
    hasPendingLink: over.link ?? (() => false),
    isDev: over.isDev,
    now: () => clock,
    wait: async () => undefined,
  });
  const send = async (s: string) => {
    appState.current = s;
    cb(s);
    await vi.advanceTimersByTimeAsync(0);
  };
  const advance = (ms: number) => void (clock += ms);
  return { updates, planReload, stop, send, advance };
}

describe('startForegroundUpdate', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('checks shortly after cold start and fetches an available update without reloading', async () => {
    const h = harness();
    await vi.advanceTimersByTimeAsync(0);
    expect(h.updates.checkForUpdateAsync).toHaveBeenCalledTimes(1);
    expect(h.updates.fetchUpdateAsync).toHaveBeenCalledTimes(1);
    expect(h.updates.reloadAsync).not.toHaveBeenCalled();
  });

  it('throttles checks on repeated foregrounds within 10 minutes', async () => {
    const h = harness({ updates: { checkForUpdateAsync: vi.fn(async () => ({ isAvailable: false })) } });
    await vi.advanceTimersByTimeAsync(0);
    await h.send('active');
    expect(h.updates.checkForUpdateAsync).toHaveBeenCalledTimes(1);
    h.advance(CHECK_INTERVAL_MS);
    await h.send('active');
    expect(h.updates.checkForUpdateAsync).toHaveBeenCalledTimes(2);
  });

  it('does not reload on a short foreground, reloads once after 30s+ away (planned reload first)', async () => {
    const h = harness();
    await vi.advanceTimersByTimeAsync(0);
    await h.send('background');
    h.advance(5_000);
    await h.send('active');
    expect(h.updates.reloadAsync).not.toHaveBeenCalled();
    await h.send('background');
    h.advance(BACKGROUND_APPLY_MS);
    await h.send('active');
    expect(h.planReload).toHaveBeenCalledTimes(1);
    expect(h.updates.reloadAsync).toHaveBeenCalledTimes(1);
    await h.send('background');
    h.advance(BACKGROUND_APPLY_MS);
    await h.send('active');
    expect(h.updates.reloadAsync).toHaveBeenCalledTimes(1);
  });

  it('skips the reload when a link is pending, and when the watchdog refuses the planned reload', async () => {
    const linked = harness({ link: () => true });
    await vi.advanceTimersByTimeAsync(0);
    await linked.send('background');
    linked.advance(BACKGROUND_APPLY_MS);
    await linked.send('active');
    expect(linked.updates.reloadAsync).not.toHaveBeenCalled();
    const refused = harness({ planReload: async () => false });
    await vi.advanceTimersByTimeAsync(0);
    await refused.send('background');
    refused.advance(BACKGROUND_APPLY_MS);
    await refused.send('active');
    expect(refused.updates.reloadAsync).not.toHaveBeenCalled();
  });

  it('swallows a thrown check, a thrown fetch and a thrown reload', async () => {
    const a = harness({ updates: { checkForUpdateAsync: vi.fn(async () => Promise.reject(new Error('net'))) } });
    const b = harness({ updates: { fetchUpdateAsync: vi.fn(async () => Promise.reject(new Error('net'))) } });
    const c = harness({ updates: { reloadAsync: vi.fn(async () => Promise.reject(new Error('boom'))) } });
    await vi.advanceTimersByTimeAsync(0);
    await c.send('background');
    c.advance(BACKGROUND_APPLY_MS);
    await expect(c.send('active')).resolves.toBeUndefined();
    expect(a.updates.fetchUpdateAsync).not.toHaveBeenCalled();
    expect(b.updates.reloadAsync).not.toHaveBeenCalled();
  });

  it('gives up on a hung check and a hung fetch via the timeouts', async () => {
    const never = () => new Promise<never>(() => undefined);
    const hungCheck = harness({ updates: { checkForUpdateAsync: vi.fn(never) } });
    await vi.advanceTimersByTimeAsync(8000);
    expect(hungCheck.updates.fetchUpdateAsync).not.toHaveBeenCalled();
    const hungFetch = harness({ updates: { fetchUpdateAsync: vi.fn(never) } });
    await vi.advanceTimersByTimeAsync(30000);
    await hungFetch.send('background');
    hungFetch.advance(BACKGROUND_APPLY_MS);
    await hungFetch.send('active');
    expect(hungFetch.updates.reloadAsync).not.toHaveBeenCalled();
  });

  it('does nothing in dev or when updates are disabled', async () => {
    const dev = harness({ isDev: true });
    const off = harness({ updates: { isEnabled: false } });
    await vi.advanceTimersByTimeAsync(0);
    expect(dev.updates.checkForUpdateAsync).not.toHaveBeenCalled();
    expect(off.updates.checkForUpdateAsync).not.toHaveBeenCalled();
  });
});
