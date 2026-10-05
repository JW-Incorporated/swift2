import { describe, expect, it, vi } from 'vitest';
import { resOk } from '@swift2/ui';
import { createUnwiredHandlers } from '../../lib/app-handlers';
import { createBridgeHost, type BridgeHost } from '../../lib/bridge-host';
import { createBridgeLink, createDomHostHandlers } from '../../lib/dom-host-handlers';
import { registerRoutes, resetRoutesForTests } from '../slots/routes-instance';
import { createReaderAdapter } from '../reader/reader-modules';
import { createNavigateDom, installReaderBridge } from './reader-nav';
import { createExpoBridge } from './transport-expo';

const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>) };

describe('createNavigateDom', () => {
  const make = (applier: ((s: string) => Promise<boolean>) | null = vi.fn(async () => true)) => {
    const d = { replaceUrl: vi.fn(), setPath: vi.fn(), applier: () => applier, openNative: vi.fn() };
    return { d, nav: createNavigateDom(d), applier };
  };

  it('a reader path rewrites the page query and applies it through the store', () => {
    const { d, nav, applier } = make();
    nav('/?item=abc#x');
    expect(d.replaceUrl).toHaveBeenCalledWith('?item=abc#x');
    expect(applier).toHaveBeenCalledWith('?item=abc');
    expect(d.openNative).not.toHaveBeenCalled();
  });

  it('a reader path closes an open legal page first', () => {
    const { d, nav } = make();
    nav('/?item=abc');
    expect(d.setPath).toHaveBeenCalledWith('/');
    expect(d.setPath.mock.invocationCallOrder[0]).toBeLessThan(d.replaceUrl.mock.invocationCallOrder[0]);
  });

  it('the allow-listed legal paths stay in the DOM', () => {
    for (const p of ['/privacy', '/terms', '/support']) {
      const { d, nav, applier } = make();
      nav(p);
      expect(d.setPath).toHaveBeenCalledWith(p);
      expect(d.openNative).not.toHaveBeenCalled();
      expect(d.replaceUrl).not.toHaveBeenCalled();
      expect(applier).not.toHaveBeenCalled();
    }
  });

  it('any other path goes to native, never a DOM dead end', () => {
    const { d, nav, applier } = make();
    nav('/privacy/x');
    expect(d.openNative).toHaveBeenCalledWith('/privacy/x');
    expect(d.setPath).not.toHaveBeenCalled();
    expect(d.replaceUrl).not.toHaveBeenCalled();
    expect(applier).not.toHaveBeenCalled();
  });

  it('survives an unmounted reader and a failing apply', async () => {
    expect(() => make(null).nav('/?era=debut')).not.toThrow();
    expect(() => make(vi.fn(async () => Promise.reject(new Error('x')))).nav('/?era=debut')).not.toThrow();
  });
});

// One epoch exactly as SharedUiHost builds it: real host + link + DOM handlers, with a recording `navigate`.
function epoch() {
  const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn(), protocol: vi.fn() };
  const onSignal = vi.fn();
  const onNavigated = vi.fn();
  const navigate = vi.fn(async () => resOk(null));
  const ref: { host?: BridgeHost; dom?: ReturnType<typeof createExpoBridge> } = {};
  const link = createBridgeLink(() => void ref.dom?.client.consumeInbox(ref.host?.inbox() ?? []));
  const handlers = createDomHostHandlers({ onSignal, watch, bridge: link.bridge, bridgeClosed: link.isClosed, token: 'tok' });
  const host = createBridgeHost({
    handlers: { ...createUnwiredHandlers(onSignal), navigate } as never,
    send: link.send,
    now: Date.now,
    scheduler,
    onNavigated,
    onProtocolFatal: () => watch.protocol(),
    onSignal,
  });
  ref.host = host;
  link.attach(host);
  const dom = createExpoBridge((env, t) => handlers.bridge(env, t), undefined, undefined, () => handlers.bridgeHello());
  ref.dom = dom;
  return { host, dom, navigate, onNavigated, watch, dispose: () => (dom.client.dispose(), host.dispose(), link.dispose()) };
}

describe('AppReader bridge round trip (real host + DOM client)', () => {
  it('ready is acked, then a native navigate is applied through the store and acked navigated{id, ok:true} only after', async () => {
    const e = epoch();
    let commit!: () => void;
    const apply = vi.fn(() => new Promise<boolean>((r) => (commit = () => r(true))));
    const back = vi.fn(() => 'handled' as const);
    const off = installReaderBridge(e.dom.client, { onInsets: vi.fn(), onContentVersion: vi.fn(), back, nav: { replaceUrl: vi.fn(), apply } });
    e.dom.mount();
    await vi.waitFor(() => expect(e.host.isReady()).toBe(true));
    e.host.emit('navigate', { path: '/?item=abc', source: 'notification', id: 'n1' } as never);
    await vi.waitFor(() => expect(apply).toHaveBeenCalledWith('?item=abc'));
    await new Promise((r) => setTimeout(r, 5));
    expect(e.onNavigated).not.toHaveBeenCalled();
    commit();
    await vi.waitFor(() => expect(e.onNavigated).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1', ok: true })));
    off();
    e.dispose();
  });

  it('subscribes insets, contentVersion and back, and unsubscribes them all', () => {
    const off = vi.fn();
    const client = { on: vi.fn((_type: string, _fn: unknown) => off), handle: vi.fn((_type: string, _fn: () => string) => off), sendEvent: vi.fn() };
    const back = vi.fn(() => 'handled' as const);
    const stop = installReaderBridge(client as never, { onInsets: vi.fn(), onContentVersion: vi.fn(), back, nav: { replaceUrl: vi.fn(), apply: async () => true } });
    expect(client.on.mock.calls.map((c) => c[0]).sort()).toEqual(['contentVersion', 'insets', 'navigate', 'restore']);
    const [type, fn] = client.handle.mock.calls[0]!;
    expect([type, fn()]).toEqual(['back', 'handled']);
    expect(client.sendEvent).toHaveBeenCalledWith('navReady', {});
    stop();
    expect(off).toHaveBeenCalledTimes(5);
  });

  it('a native restore event reaches the restore handler with its snapshot', () => {
    const handlers: Record<string, (e: unknown) => void> = {};
    const client = { on: vi.fn((t: string, fn: (e: unknown) => void) => ((handlers[t] = fn), vi.fn())), handle: vi.fn(() => vi.fn()), sendEvent: vi.fn() };
    const restore = vi.fn();
    installReaderBridge(client as never, { onInsets: vi.fn(), onContentVersion: vi.fn(), back: vi.fn(() => 'handled' as const), nav: { replaceUrl: vi.fn(), apply: async () => true }, restore });
    const snap = { v: 1, mode: 'era', eraId: 'lover', scrollY: 5 };
    handlers.restore!({ snap });
    expect(restore).toHaveBeenCalledWith(snap);
  });

  it('the adapter built on the live client reaches the host handler (one lifetime for host and transport)', async () => {
    const e = epoch();
    e.dom.mount();
    await vi.waitFor(() => expect(e.host.isReady()).toBe(true));
    const adapter = createReaderAdapter({ client: e.dom.client, insets: { top: 0, right: 0, bottom: 0, left: 0 }, navigateDom: vi.fn(), getPath: () => '/' });
    registerRoutes({ slice: 't', nativeRoutes: [{ id: 't:s', match: '/?screen=settings' }] });
    adapter.navigate('/?screen=settings');
    await vi.waitFor(() => expect(e.navigate).toHaveBeenCalledTimes(1));
    resetRoutesForTests();
    e.dispose();
  });
});
