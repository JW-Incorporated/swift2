// W6 closure proof for the watchdog wiring TODOs (dom-host.md "Watchdog wiring"). Real watchdog monitor +
// record rules, real tap gate/queue/binder, real bridge host/link/handlers and real native-route presenter;
// only the clock/timers and the native navigator sink are fakes. App.tsx's React glue is reproduced by
// `applyMount` (useNotificationTaps + reconcileOverlay(domSurfaceRendered)), the two calls it makes per mount change.
import { describe, expect, it, vi } from 'vitest';
import { createUnwiredHandlers } from './app-handlers';
import { createBridgeHost, type BridgeHost } from './bridge-host';
import { createBridgeLink, createDomHostHandlers } from './dom-host-handlers';
import { createTapGate } from './notification-tap-gate';
import { createNativeRoutePresenter, domSurfaceRendered, reconcileOverlay } from './native-route';
import { createTapBinder, createTapTarget, releaseBeforeStrike } from './tap-bind-epoch';
import { beginAttempt, createAttemptMonitor, decideMount, freshRecord, recordStrike, shouldMountDom, type WatchdogRecord } from './watchdog';

const SITE = 'https://www.longlivets.com';
const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>) };
const ready = (id = 'r1', v = 1) => ({ v: 1, id, kind: 'evt', type: 'ready', payload: { v }, ts: 1 });

function app() {
  const nativeOpened: string[] = [];
  const gate = createTapGate({ siteUrl: SITE, retryMs: 1_000_000 });
  const presenter = createNativeRoutePresenter({ isNativeRoute: (p) => p === '/settings', now: () => 0 });
  let mount: 'dom' | 'native' = 'dom';
  let record: WatchdogRecord = beginAttempt(freshRecord('b', 0), 0);
  const applyMount = () => {
    gate.setNativeNavigator(mount === 'native' ? (u) => void nativeOpened.push(u) : null);
    reconcileOverlay(presenter, domSurfaceRendered(mount, false));
  };
  const monitor = createAttemptMonitor({
    now: () => 0,
    active: true,
    onReady: () => void (record = { ...record, state: 'ready' }),
    onStrike: (reason) => {
      record = recordStrike(record, reason, 0).record;
      mount = 'native';
      applyMount();
    },
    scheduler: { setTimeout: () => 0, clearTimeout: () => undefined },
  });
  const baseWatch = { ready: () => monitor.ready(), error: (m: string) => monitor.error(m), crashed: (k: 'terminated' | 'render-gone') => monitor.crashed(k), protocol: () => monitor.protocolFatal() };
  const holder: { host?: BridgeHost; binder?: ReturnType<typeof createTapBinder> } = {};
  const link = createBridgeLink(() => void holder.host?.inbox());
  const host = createBridgeHost({
    handlers: createUnwiredHandlers(vi.fn()),
    send: link.send,
    now: Date.now,
    scheduler,
    onBeforeShutdown: () => holder.binder?.release(),
    onProtocolFatal: () => {
      link.dispose();
      baseWatch.protocol();
    },
    onSignal: vi.fn(),
  });
  holder.host = host;
  link.attach(host);
  const target = createTapTarget({ host, isReaderPath: () => true, openElsewhere: async () => true });
  const binder = createTapBinder({ gate, host: target, onReadinessLoss: vi.fn() });
  holder.binder = binder;
  const handlers = createDomHostHandlers({ onSignal: vi.fn(), watch: releaseBeforeStrike(baseWatch, binder), bridge: link.bridge, bridgeClosed: link.isClosed, token: 'tok' });
  applyMount();
  return { gate, presenter, host, binder, handlers, nativeOpened, getMount: () => mount, getRecord: () => record };
}

async function bindDom(a: ReturnType<typeof app>) {
  await a.handlers.bridge(ready(), 'tok');
  await a.handlers.onReady('tok');
  a.binder.navReady();
  a.binder.firstPaint();
  expect(a.binder.isBound()).toBe(true);
}

describe('(1) protocol fatal strikes the real watchdog, before and after first paint', () => {
  it.each([
    ['host-detected (version too new) before first paint', false],
    ['host-detected after first paint', true],
  ])('%s', async (_n, afterPaint) => {
    const a = app();
    if (afterPaint) await a.handlers.onReady('tok');
    void a.handlers.bridge(ready('r1', 99), 'tok').catch(() => undefined);
    expect(a.getRecord().strikes).toBe(1);
    expect(a.getRecord().lastReason).toBe('protocol-fatal');
    expect(a.getMount()).toBe('native');
  });

  it.each([
    ['DOM-reported before first paint', false],
    ['DOM-reported after first paint', true],
  ])('%s', async (_n, afterPaint) => {
    const a = app();
    if (afterPaint) await a.handlers.onReady('tok');
    await a.handlers.reportProtocolFatal('ready-failed', 'tok');
    expect(a.getRecord().strikes).toBe(1);
    expect(a.getRecord().lastReason).toBe('protocol-fatal');
    expect(a.getMount()).toBe('native');
  });
});

describe('(2) fallback clears the open overlay and releases the native back ownership', () => {
  it('an open native-route overlay is reset by the strike; hardware back is no longer consumed', async () => {
    const a = app();
    await bindDom(a);
    expect(a.presenter.presentNativeRoute('/settings')).toBe('applied');
    a.presenter.opened(a.presenter.getState().seq);
    expect(a.presenter.getState().phase).toBe('open');
    await a.handlers.reportProtocolFatal('id-space-exhausted', 'tok');
    expect(a.getMount()).toBe('native');
    expect(a.presenter.getState()).toMatchObject({ phase: 'idle', route: null, deadlineAt: null });
    expect(a.presenter.handleBack()).toBe(false);
  });

  it('the host lease is released before the strike lands, so the gate is no longer bound', async () => {
    const a = app();
    await bindDom(a);
    await a.handlers.reportProtocolFatal('ready-failed', 'tok');
    expect(a.binder.isBound()).toBe(false);
  });
});

describe('(3) taps while quarantined/fallback route natively; taps held at fallback are flushed natively', () => {
  it('a tap in flight to the DOM host (unacked) is delivered to the native navigator at the strike', async () => {
    const a = app();
    await bindDom(a);
    expect(a.gate.enqueue({ id: 'n1', deepLink: '/settings' })).toBe('queued');
    await Promise.resolve();
    expect(a.nativeOpened).toEqual([]);
    await a.handlers.reportProtocolFatal('ready-failed', 'tok');
    await vi.waitFor(() => expect(a.nativeOpened).toEqual([`${SITE}/settings`]));
    await vi.waitFor(() => expect(a.gate.size()).toBe(0));
  });

  it('taps held before any host binds (pending) flush natively when the launch falls back', async () => {
    const a = app();
    a.gate.enqueue({ id: 'p1', deepLink: '/support' });
    expect(a.gate.size()).toBe(1);
    await a.handlers.reportProtocolFatal('ready-failed', 'tok');
    await vi.waitFor(() => expect(a.nativeOpened).toEqual([`${SITE}/support`]));
    await vi.waitFor(() => expect(a.gate.size()).toBe(0));
  });

  it('while quarantined every tap (including an unknown route root) opens natively at once, never queued', async () => {
    let record: WatchdogRecord | null = null;
    for (const launch of [1, 2, 3, 4, 5, 6]) {
      const d = decideMount(record, 'b', launch);
      record = d.record;
      if (shouldMountDom(true, d)) record = recordStrike(beginAttempt(record, launch), 'ready-timeout', launch).record;
    }
    const d = decideMount(record, 'b', 7);
    expect(d.record.state).toBe('quarantined');
    expect(shouldMountDom(true, d)).toBe(false);
    const opened: string[] = [];
    const gate = createTapGate({ siteUrl: SITE, retryMs: 1_000_000 });
    gate.setNativeNavigator((u) => void opened.push(u));
    gate.enqueue({ id: 'q1', deepLink: '/vault' });
    gate.enqueue({ id: 'q2', deepLink: '/unknown-root/x' });
    await vi.waitFor(() => expect([...opened].sort()).toEqual([`${SITE}/unknown-root/x`, `${SITE}/vault`]));
    await vi.waitFor(() => expect(gate.size()).toBe(0));
  });
});
