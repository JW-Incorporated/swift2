import { describe, expect, it, vi } from 'vitest';
import { createAppHandlersFor } from '../../lib/app-handlers';
import { createBridgeHost, type BridgeHost } from '../../lib/bridge-host';
import { createBridgeLink, createDomHostHandlers } from '../../lib/dom-host-handlers';
import { createTapGate } from '../../lib/notification-tap-gate';
import { resolveDestination } from '../../lib/destination-resolver';
import { createTapBinder, createTapTarget, type TapBinder } from '../../lib/tap-bind-epoch';
import { isNativeRoute as isHostRoute } from '../slots/routes';
import { applyNavigateEvent, installNavigateSubscriber } from './navigate-subscriber';
import { inboxOverlay, resetInboxOverlayForTests } from '../slots/inbox-store';
import { resetSettingsOverlayForTests, settingsOverlay } from '../slots/settings-store';
import { createExpoBridge } from './transport-expo';

const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>) };
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('applyNavigateEvent', () => {
  it('keeps search + hash only, applies the search through the store, and reports success after it', async () => {
    const deps = { replaceUrl: vi.fn(), apply: vi.fn(async () => true) };
    expect(await applyNavigateEvent({ path: '/?item=abc&era=debut#x' as never }, deps)).toBe(true);
    expect(deps.replaceUrl).toHaveBeenCalledWith('?item=abc&era=debut#x');
    expect(deps.apply).toHaveBeenCalledWith('?item=abc&era=debut');
    expect(deps.apply).toHaveBeenCalledTimes(1);
  });

  it('a bare root clears the query', async () => {
    const deps = { replaceUrl: vi.fn(), apply: vi.fn(async () => true) };
    await applyNavigateEvent({ path: '/' as never }, deps);
    expect(deps.replaceUrl).toHaveBeenCalledWith('?');
  });

  it('a non-root pathname is refused without touching the page', async () => {
    const deps = { replaceUrl: vi.fn(), apply: vi.fn(async () => true) };
    expect(await applyNavigateEvent({ path: '/privacy' as never }, deps)).toBe(false);
    expect(deps.replaceUrl).not.toHaveBeenCalled();
    expect(deps.apply).not.toHaveBeenCalled();
  });

  it('an allow-listed legal path is shown in the DOM and acked only after it was set; a reader path closes it first', async () => {
    const order: string[] = [];
    const deps = { replaceUrl: vi.fn(() => void order.push('replace')), apply: vi.fn(async () => true), setPath: vi.fn((p: string) => (order.push(p), true)) };
    expect(await applyNavigateEvent({ path: '/privacy' as never }, deps)).toBe(true);
    expect(deps.replaceUrl).not.toHaveBeenCalled();
    expect(deps.apply).not.toHaveBeenCalled();
    expect(await applyNavigateEvent({ path: '/?item=a' as never }, deps)).toBe(true);
    expect(order).toEqual(['/privacy', '/', 'replace']);
  });

  it('a legal path is refused when the DOM has no path state, and a refused setPath answers false', async () => {
    expect(await applyNavigateEvent({ path: '/terms' as never }, { replaceUrl: vi.fn(), apply: vi.fn(async () => true) })).toBe(false);
    expect(await applyNavigateEvent({ path: '/terms' as never }, { replaceUrl: vi.fn(), apply: vi.fn(async () => true), setPath: () => false })).toBe(false);
  });

  it('an unresolved target (apply -> false) reports false, never ok:true', async () => {
    const deps = { replaceUrl: vi.fn(), apply: vi.fn(async () => false) };
    expect(await applyNavigateEvent({ path: '/?item=gone' as never }, deps)).toBe(false);
  });

  it('an apply failure reports false', async () => {
    const deps = { replaceUrl: vi.fn(), apply: vi.fn(async () => Promise.reject(new Error('boom'))) };
    expect(await applyNavigateEvent({ path: '/?item=a' as never }, deps)).toBe(false);
  });
});

// One epoch wired as SharedUiHost does it (host hooks, tap target, binder), real gate + real DOM client.
function epoch(opts: { subscribe?: boolean; apply?: () => Promise<boolean>; gateBind?: boolean } = {}) {
  const { subscribe = true } = opts;
  const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn(), protocol: vi.fn() };
  const ref: { host?: BridgeHost; binder?: TapBinder; target?: ReturnType<typeof createTapTarget>; dom?: ReturnType<typeof createExpoBridge> } = {};
  const link = createBridgeLink(() => void ref.dom?.client.consumeInbox(ref.host?.inbox() ?? []));
  const handlers = createDomHostHandlers({ onSignal: vi.fn(), watch, bridge: link.bridge, bridgeClosed: link.isClosed });
  const host = createBridgeHost({
    handlers: createAppHandlersFor(vi.fn(), {}),
    send: link.send,
    now: Date.now,
    scheduler,
    onBeforeShutdown: () => ref.binder?.release(),
    onReadyAgain: () => ref.binder?.readyAgain(),
    onNavReady: () => ref.binder?.navReady(),
    onNavigated: (e) => ref.target?.onNavigated(e),
    onProtocolFatal: () => watch.protocol(),
    onSignal: vi.fn(),
  });
  const openElsewhere = vi.fn(async (_p: string) => true);
  const destination = (p: string) => resolveDestination(p, { isHostRoute });
  const target = createTapTarget({ host, canonicalize: (p) => destination(p).path, isReaderPath: (p) => destination(p).kind === 'dom', openElsewhere });
  const gate = createTapGate({ siteUrl: 'https://www.longlivets.com', retryMs: 60_000 });
  const binder = createTapBinder({ gate, host: target, onReadinessLoss: vi.fn() });
  ref.host = host;
  ref.target = target;
  ref.binder = binder;
  link.attach(host);
  const dom = createExpoBridge((env) => handlers.bridge(env));
  ref.dom = dom;
  const deps = { replaceUrl: vi.fn(), apply: opts.apply ?? vi.fn(async () => true), setPath: vi.fn(async () => true) };
  dom.mount();
  if (subscribe) installNavigateSubscriber(dom.client, deps);
  const ready = async () => {
    await vi.waitFor(() => expect(host.isReady()).toBe(true));
    binder.firstPaint();
  };
  const dispose = () => {
    dom.client.dispose();
    host.dispose();
    link.dispose();
  };
  return { host, gate, binder, deps, openElsewhere, ready, dispose, watch };
}

describe('native-to-DOM navigate, end to end (real host, DOM client, gate)', () => {
  it('/vault (no DOM route) is opened by native, never swallowed by the reader', async () => {
    const path = '/vault';
    const e = epoch();
    await e.ready();
    e.gate.enqueue({ id: `id${path}`, deepLink: `https://www.longlivets.com${path}` });
    await vi.waitFor(() => expect(e.openElsewhere).toHaveBeenCalledWith(path));
    await vi.waitFor(() => expect(e.gate.size()).toBe(0));
    expect(e.deps.replaceUrl).not.toHaveBeenCalled();
    expect(e.deps.apply).not.toHaveBeenCalled();
    e.dispose();
  });

  // Every backend-emitted settings/inbox/legal link form, through the REAL resolver, tap target and DOM subscriber.
  it.each([
    ['https://www.longlivets.com/?screen=settings', 'settings'],
    ['https://www.longlivets.com/?current=inbox', 'inbox'],
    ['https://www.longlivets.com/settings', 'settings'],
    ['https://www.longlivets.com/settings?tab=1', 'settings'],
    ['/privacy', 'legal'],
    ['/terms', 'legal'],
    ['/support', 'legal'],
  ])('%s opens in the DOM and is delivered, never openElsewhere', async (deepLink, kind) => {
    const e = epoch();
    await e.ready();
    e.gate.enqueue({ id: `d${deepLink}`, deepLink });
    await vi.waitFor(() => expect(e.gate.size()).toBe(0));
    expect(e.openElsewhere).not.toHaveBeenCalled();
    if (kind === 'settings') expect(settingsOverlay.isOpen()).toBe(true);
    if (kind === 'inbox') expect(inboxOverlay.isOpen()).toBe(true);
    if (kind === 'legal') expect(e.deps.setPath).toHaveBeenCalledWith(deepLink.replace(/^https:\/\/www\.longlivets\.com/, ''));
    resetSettingsOverlayForTests();
    resetInboxOverlayForTests();
    e.dispose();
  });

  it.each(['/?item=abc', '/?lens=easter-eggs', '/?era=debut', '/?mode=threads'])('%s routes in the DOM and is delivered only after the apply commits', async (path) => {
    let commit!: () => void;
    const apply = vi.fn(() => new Promise<boolean>((r) => (commit = () => r(true))));
    const e = epoch({ apply });
    await e.ready();
    e.gate.enqueue({ id: `id${path}`, deepLink: path });
    await vi.waitFor(() => expect(apply).toHaveBeenCalledTimes(1));
    expect(e.deps.replaceUrl).toHaveBeenCalledWith(path.slice(1));
    await tick();
    await tick();
    expect(e.gate.size()).toBe(1);
    commit();
    await vi.waitFor(() => expect(e.gate.size()).toBe(0));
    e.dispose();
  });

  it('a DOM failure keeps the tap queued', async () => {
    const e = epoch({ apply: async () => Promise.reject(new Error('boom')) });
    await e.ready();
    e.gate.enqueue({ id: 'f1', deepLink: '/?item=abc' });
    await vi.waitFor(() => expect(e.deps.replaceUrl).toHaveBeenCalled());
    await tick();
    await tick();
    expect(e.gate.size()).toBe(1);
    e.dispose();
  });

  it('with no DOM subscriber the host ack alone never completes the tap, and the epoch never binds', async () => {
    const e = epoch({ subscribe: false });
    await e.ready();
    expect(e.binder.isBound()).toBe(false);
    e.gate.enqueue({ id: 'n1', deepLink: '/?item=abc' });
    await tick();
    await tick();
    expect(e.gate.size()).toBe(1);
    e.dispose();
  });

  it('protocol fatal unbinds through the host pre-shutdown hook (ordering: bridge-host-nav-hooks.test.ts)', async () => {
    const e = epoch();
    await e.ready();
    expect(e.binder.isBound()).toBe(true);
    e.host.receive({ v: 1, id: 'bad', kind: 'evt', type: 'ready', payload: { v: 999 }, ts: 1 });
    expect(e.binder.isBound()).toBe(false);
    expect(e.watch.protocol).toHaveBeenCalledTimes(1);
    e.dispose();
  });

  it('a DOM re-handshake after bind releases the lease', async () => {
    const e = epoch();
    await e.ready();
    expect(e.binder.isBound()).toBe(true);
    const again = createExpoBridge((env) => e.host.receive(env));
    again.mount();
    await vi.waitFor(() => expect(e.binder.isBound()).toBe(false));
    again.client.dispose();
    e.dispose();
  });
});
