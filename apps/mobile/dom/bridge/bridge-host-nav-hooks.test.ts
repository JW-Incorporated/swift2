import { describe, expect, it, vi } from 'vitest';
import { createExpoBridge } from './transport-expo';
import { createAppHandlersFor } from '../../lib/app-handlers';
import { createBridgeHost, type BridgeHost } from '../../lib/bridge-host';
import { createBridgeLink, createDomHostHandlers } from '../../lib/dom-host-handlers';

const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>) };

function wire(extra: Partial<Parameters<typeof createBridgeHost>[0]> = {}) {
  const ref: { host?: BridgeHost } = {};
  const link = createBridgeLink(() => void ref.host?.inbox());
  const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn(), protocol: vi.fn() };
  const handlers = createDomHostHandlers({ onSignal: vi.fn(), watch, bridge: link.bridge, bridgeClosed: link.isClosed, token: 'tok' });
  const host = createBridgeHost({
    handlers: createAppHandlersFor(vi.fn(), {}),
    send: link.send,
    now: Date.now,
    scheduler,
    onProtocolFatal: () => watch.protocol(),
    onSignal: vi.fn(),
    ...extra,
  });
  ref.host = host;
  link.attach(host);
  return { host, link, handlers, watch };
}

describe('bridge-host navigation hooks', () => {
  it('onBeforeShutdown runs once, before the host closes, on dispose', () => {
    const emitted: unknown[] = [];
    const holder: { host?: BridgeHost } = {};
    const w = wire({ onBeforeShutdown: () => void emitted.push(holder.host?.emit('navigate', { path: '/' as never, source: 'notification' })) });
    holder.host = w.host;
    w.host.dispose();
    w.host.dispose();
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).not.toBeNull();
  });

  it('protocol fatal: onBeforeShutdown runs before the host closes and before onProtocolFatal', () => {
    const order: string[] = [];
    const holder: { host?: BridgeHost } = {};
    const w = wire({
      onBeforeShutdown: () => void order.push(`before:emit=${holder.host?.emit('navigate', { path: '/' as never, source: 'notification' }) === null ? 'closed' : 'open'}`),
      onProtocolFatal: () => void order.push('fatal'),
    });
    holder.host = w.host;
    w.host.receive({ v: 1, id: 'x', kind: 'evt', type: 'ready', payload: { v: 999 }, ts: 1 });
    expect(order).toEqual(['before:emit=open', 'fatal']);
  });

  it('navReady and navigated reach their hooks; a malformed navigated is ignored with a signal', async () => {
    const onNavReady = vi.fn();
    const onNavigated = vi.fn();
    const onSignal = vi.fn();
    const w = wire({ onNavReady, onNavigated, onSignal });
    const dom = createExpoBridge((env, t) => w.handlers.bridge(env, t), undefined, undefined, () => w.handlers.bridgeHello());
    dom.mount();
    dom.client.sendEvent('navReady', {});
    dom.client.sendEvent('navigated', { id: 't1', ok: true });
    await vi.waitFor(() => expect(onNavigated).toHaveBeenCalledWith({ id: 't1', ok: true }));
    expect(onNavReady).toHaveBeenCalledTimes(1);
    w.host.receive({ v: 1, id: 'bad', kind: 'evt', type: 'navigated', payload: { id: 5 }, ts: 1 });
    expect(onNavigated).toHaveBeenCalledTimes(1);
    expect(onSignal).toHaveBeenCalledWith('bridge-invalid', 'navigated payload');
    dom.client.dispose();
    w.host.dispose();
  });

  it('navReady/navigated before ready are ignored and signalled', () => {
    const onNavReady = vi.fn();
    const onNavigated = vi.fn();
    const onSignal = vi.fn();
    const w = wire({ onNavReady, onNavigated, onSignal });
    w.host.receive({ v: 1, id: 'a', kind: 'evt', type: 'navReady', payload: {}, ts: 1 });
    w.host.receive({ v: 1, id: 'b', kind: 'evt', type: 'navigated', payload: { id: 't1', ok: true }, ts: 1 });
    expect(onNavReady).not.toHaveBeenCalled();
    expect(onNavigated).not.toHaveBeenCalled();
    expect(onSignal).toHaveBeenCalledWith('bridge-pre-ready', 'navReady');
    expect(onSignal).toHaveBeenCalledWith('bridge-pre-ready', 'navigated');
    w.host.dispose();
  });

  it('onReadyAgain fires only for a ready after the handshake', async () => {
    const onReadyAgain = vi.fn();
    const w = wire({ onReadyAgain });
    const dom = createExpoBridge((env, t) => w.handlers.bridge(env, t), undefined, undefined, () => w.handlers.bridgeHello());
    dom.mount();
    await vi.waitFor(() => expect(w.host.isReady()).toBe(true));
    expect(onReadyAgain).not.toHaveBeenCalled();
    const again = createExpoBridge((env, t) => w.handlers.bridge(env, t), undefined, undefined, () => w.handlers.bridgeHello());
    again.mount();
    await vi.waitFor(() => expect(onReadyAgain).toHaveBeenCalledTimes(1));
    again.client.dispose();
    dom.client.dispose();
    w.host.dispose();
  });
});
