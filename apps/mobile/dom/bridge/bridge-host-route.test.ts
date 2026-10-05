import { describe, expect, it, vi } from 'vitest';
import type { Envelope } from '@swift2/ui';
import { createExpoBridge } from './transport-expo';
import { createAppHandlersFor } from '../../lib/app-handlers';
import { createBridgeHost, type BridgeHost } from '../../lib/bridge-host';
import { createBridgeLink, createDomHostHandlers } from '../../lib/dom-host-handlers';

const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>) };

/** Real DOM client <-> real host. `gate` holds the DOM's `ready` back to model a delayed handshake. */
function wire(onRoute: (p: string, busy: boolean) => void, onSignal = vi.fn()) {
  const ref: { host?: BridgeHost; dom?: ReturnType<typeof createExpoBridge> } = {};
  const link = createBridgeLink(() => void ref.host?.inbox());
  const sent: { kind: string; type: string }[] = [];
  const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn(), protocol: vi.fn() };
  const handlers = createDomHostHandlers({ onSignal: vi.fn(), watch, bridge: link.bridge, bridgeClosed: link.isClosed, token: 'tok' });
  const host = createBridgeHost({
    handlers: createAppHandlersFor(vi.fn(), {}),
    send: (e) => {
      sent.push({ kind: e.kind, type: e.type });
      link.send(e);
      ref.dom?.client.receive(e);
    },
    now: Date.now,
    scheduler,
    onProtocolFatal: () => watch.protocol(),
    onSignal,
    onRoute,
  });
  ref.host = host;
  link.attach(host);
  const held: Envelope[] = [];
  let gated = false;
  const dom = createExpoBridge((env, t) => {
    if (gated && env.type === 'ready') {
      held.push(env);
      return;
    }
    return handlers.bridge(env, t);
  }, undefined, undefined, () => handlers.bridgeHello());
  ref.dom = dom;
  return {
    host,
    dom,
    sent,
    gate: () => void (gated = true),
    release: () => {
      gated = false;
      for (const e of held.splice(0)) void handlers.bridge(e, 'tok');
    },
  };
}

describe('route event (fire-and-forget)', () => {
  it('delayed handshake: queued routes coalesce, then onRoute fires once with the latest path and nothing is sent back', async () => {
    const onRoute = vi.fn();
    const onSignal = vi.fn();
    const w = wire(onRoute, onSignal);
    w.gate();
    w.dom.mount();
    w.dom.client.sendEvent('route', { path: '/privacy' });
    w.dom.client.sendEvent('route', { path: '/terms?x=1' });
    await new Promise((r) => setTimeout(r, 20));
    expect(onRoute).not.toHaveBeenCalled();
    w.release();
    await vi.waitFor(() => expect(onRoute).toHaveBeenCalledTimes(1));
    expect(onRoute).toHaveBeenCalledWith('/terms?x=1', false, false);
    expect(onSignal).not.toHaveBeenCalledWith('bridge-pre-ready', 'route');
    expect(w.sent.some((e) => e.type === 'route' || e.kind === 'res')).toBe(false);
    w.dom.client.dispose();
    w.host.dispose();
  });

  it('carries the busy flag through the real client and host, coalesced with the path', async () => {
    const onRoute = vi.fn();
    const w = wire(onRoute);
    w.gate();
    w.dom.mount();
    w.dom.client.sendEvent('route', { path: '/' });
    w.dom.client.sendEvent('route', { path: '/', busy: true });
    w.release();
    await vi.waitFor(() => expect(onRoute).toHaveBeenCalledTimes(1));
    expect(onRoute).toHaveBeenCalledWith('/', true, false);
    w.dom.client.dispose();
    w.host.dispose();
  });

  it('carries the engaged flag through the real client and host, alone and with busy', async () => {
    const onRoute = vi.fn();
    const w = wire(onRoute);
    w.dom.mount();
    await vi.waitFor(() => expect(w.host.isReady()).toBe(true));
    w.dom.client.sendEvent('route', { path: '/', engaged: true });
    await vi.waitFor(() => expect(onRoute).toHaveBeenLastCalledWith('/', false, true));
    w.dom.client.sendEvent('route', { path: '/', busy: true, engaged: true });
    await vi.waitFor(() => expect(onRoute).toHaveBeenLastCalledWith('/', true, true));
    w.dom.client.dispose();
    w.host.dispose();
  });

  it('post-ready sendEvent is immediate', async () => {
    const onRoute = vi.fn();
    const w = wire(onRoute);
    w.dom.mount();
    await vi.waitFor(() => expect(w.host.isReady()).toBe(true));
    await vi.waitFor(() => {
      w.dom.client.sendEvent('route', { path: '/support' });
      expect(onRoute).toHaveBeenCalledWith('/support', false, false);
    });
    w.dom.client.dispose();
    w.host.dispose();
  });

  it('ignores a route before ready (signal) and rejects bad payloads once ready', async () => {
    const onRoute = vi.fn();
    const onSignal = vi.fn();
    const w = wire(onRoute, onSignal);
    w.host.receive({ v: 1, id: 'a', kind: 'evt', type: 'route', payload: { path: '/x' }, ts: 1 });
    expect(onRoute).not.toHaveBeenCalled();
    expect(onSignal).toHaveBeenCalledWith('bridge-pre-ready', 'route');
    w.dom.mount();
    await vi.waitFor(() => expect(w.host.isReady()).toBe(true));
    const bad = [{ path: 'x' }, { path: '/x', engaged: 'yes' }, { path: '/x', engaged: true, extra: 1 }, { path: '/' + 'a'.repeat(2048) }, { path: '/x', extra: 1 }, { path: '/x', busy: 'yes' }, { path: '/x', busy: true, extra: 1 }, {}, { path: 3 }, 'x'];
    bad.forEach((payload, i) => w.host.receive({ v: 1, id: 'b' + i, kind: 'evt', type: 'route', payload, ts: 1 } as never));
    expect(onRoute).not.toHaveBeenCalled();
    expect(onSignal.mock.calls.filter((c) => c[0] === 'bridge-invalid' && c[1] === 'route payload')).toHaveLength(bad.length);
    w.dom.client.dispose();
    w.host.dispose();
  });
});
